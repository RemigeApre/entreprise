<script setup lang="ts">
import type { Evenement, EvenementType, UserProfile } from '~/utils/types'
import { formatDate } from '~/utils/dates'

const props = defineProps<{
  open: boolean
  event?: Evenement
  defaultDate?: string  // 'YYYY-MM-DD'
  isAdmin?: boolean
  currentUserId: string
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'saved', event: Evenement): void
  (e: 'deleted'): void
}>()

const { createEvent, updateEvent, deleteEvent, addParticipants, removeParticipant, respondToInvitation } = useEvenements()
const { getActiveUsers } = useUsers()
const toast = useToast()

// ─── Mode ───────────────────────────────────────────────────
type ModalMode = 'view' | 'create' | 'edit'
const mode = ref<ModalMode>('view')

const isOwner = computed(() => {
  if (!props.event) return true
  const orgId = typeof props.event.organisateur === 'string'
    ? props.event.organisateur
    : props.event.organisateur.id
  return orgId === props.currentUserId
})

const myParticipation = computed(() =>
  props.event?.participants?.find(p => {
    const uid = typeof p.user === 'string' ? p.user : p.user.id
    return uid === props.currentUserId
  })
)

watch(() => props.open, (v) => {
  if (v) {
    confirmDelete.value = false
    if (props.event) {
      mode.value = 'view'
    } else {
      mode.value = 'create'
      resetForm()
    }
  }
})

// ─── Users list ──────────────────────────────────────────────
const allUsers = ref<UserProfile[]>([])
const usersLoaded = ref(false)

async function ensureUsers() {
  if (usersLoaded.value) return
  allUsers.value = await getActiveUsers()
  usersLoaded.value = true
}

watch(mode, (m) => {
  if (m === 'create' || m === 'edit') ensureUsers()
})

// ─── Form state ──────────────────────────────────────────────
const PALETTE = ['#AF8F3C', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#ec4899', '#6b7280']

const formTitre = ref('')
const formDescription = ref('')
const formLieu = ref('')
const formDateDebut = ref('')
const formTimeDebut = ref('09:00')
const formDateFin = ref('')
const formTimeFin = ref('10:00')
const formTouteJournee = ref(false)
const formCouleur = ref(PALETTE[0])
const formType = ref<EvenementType>('personnel')
const formParticipantIds = ref<string[]>([])
const formTousActifs = ref(false)

const typeOptions = computed(() => {
  const opts = [
    { label: 'Personnel', value: 'personnel' },
    { label: 'Equipe', value: 'equipe' }
  ]
  if (props.isAdmin) opts.push({ label: 'Entreprise (tous)', value: 'entreprise' })
  return opts
})

const showParticipants = computed(() =>
  formType.value !== 'personnel' || formParticipantIds.value.length > 0
)

const availableUsers = computed(() =>
  allUsers.value.filter(u => u.id !== props.currentUserId)
)

function resetForm() {
  const date = props.defaultDate || formatDate(new Date())
  formTitre.value = ''
  formDescription.value = ''
  formLieu.value = ''
  formDateDebut.value = date
  formTimeDebut.value = '09:00'
  formDateFin.value = date
  formTimeFin.value = '10:00'
  formTouteJournee.value = false
  formCouleur.value = PALETTE[0]
  formType.value = 'personnel'
  formParticipantIds.value = []
  formTousActifs.value = false
}

function fillFormFromEvent() {
  if (!props.event) return
  const e = props.event
  formTitre.value = e.titre
  formDescription.value = e.description || ''
  formLieu.value = e.lieu || ''
  formTouteJournee.value = e.toute_journee
  formCouleur.value = e.couleur || PALETTE[0]
  formType.value = e.type

  const [dDebut, tDebut] = e.date_debut.split('T')
  const [dFin, tFin] = e.date_fin.split('T')
  formDateDebut.value = dDebut
  formTimeDebut.value = tDebut?.slice(0, 5) || '09:00'
  formDateFin.value = dFin
  formTimeFin.value = tFin?.slice(0, 5) || '10:00'

  formParticipantIds.value = (e.participants || []).map(p =>
    typeof p.user === 'string' ? p.user : p.user.id
  )
  formTousActifs.value = false
}

function startEdit() {
  fillFormFromEvent()
  ensureUsers()
  mode.value = 'edit'
}

// ─── Save ────────────────────────────────────────────────────
const saving = ref(false)

async function handleSave() {
  if (!formTitre.value.trim()) return
  saving.value = true

  const date_debut = formTouteJournee.value
    ? `${formDateDebut.value}T00:00:00`
    : `${formDateDebut.value}T${formTimeDebut.value}:00`
  const date_fin = formTouteJournee.value
    ? `${formDateFin.value}T23:59:59`
    : `${formDateFin.value}T${formTimeFin.value}:00`

  try {
    const participantIds = formTousActifs.value
      ? availableUsers.value.map(u => u.id)
      : formParticipantIds.value

    let savedEvent: Evenement

    if (mode.value === 'create') {
      savedEvent = await createEvent({
        titre: formTitre.value.trim(),
        description: formDescription.value.trim() || null,
        lieu: formLieu.value.trim() || null,
        date_debut, date_fin,
        toute_journee: formTouteJournee.value,
        couleur: formCouleur.value,
        type: formType.value,
        organisateur: props.currentUserId
      })
      if (participantIds.length) {
        await addParticipants(savedEvent.id, participantIds)
      }
    } else {
      savedEvent = await updateEvent(props.event!.id, {
        titre: formTitre.value.trim(),
        description: formDescription.value.trim() || null,
        lieu: formLieu.value.trim() || null,
        date_debut, date_fin,
        toute_journee: formTouteJournee.value,
        couleur: formCouleur.value,
        type: formType.value
      })
      // Diff participants
      const existingParticipants = props.event!.participants || []
      const existingIds = existingParticipants.map(p =>
        typeof p.user === 'string' ? p.user : p.user.id
      )
      const toAdd = participantIds.filter(id => !existingIds.includes(id))
      const toRemove = existingParticipants.filter(p => {
        const uid = typeof p.user === 'string' ? p.user : p.user.id
        return !participantIds.includes(uid)
      })
      if (toAdd.length) await addParticipants(savedEvent.id, toAdd)
      for (const p of toRemove) await removeParticipant(p.id)
    }

    toast.add({ title: mode.value === 'create' ? 'Evenement cree' : 'Evenement mis a jour', color: 'success' })
    emit('saved', savedEvent)
    emit('update:open', false)
  } catch {
    toast.add({ title: 'Erreur lors de l\'enregistrement', color: 'error' })
  } finally {
    saving.value = false
  }
}

// ─── Delete ──────────────────────────────────────────────────
const deleting = ref(false)
const confirmDelete = ref(false)

async function handleDelete() {
  if (!props.event) return
  if (!confirmDelete.value) { confirmDelete.value = true; return }
  deleting.value = true
  try {
    await deleteEvent(props.event.id)
    toast.add({ title: 'Evenement supprime', color: 'success' })
    emit('deleted')
    emit('update:open', false)
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}

// ─── Respond ─────────────────────────────────────────────────
const responding = ref(false)

async function handleRespond(statut: 'accepte' | 'refuse') {
  if (!myParticipation.value) return
  responding.value = true
  try {
    await respondToInvitation(myParticipation.value.id, statut)
    toast.add({ title: statut === 'accepte' ? 'Invitation acceptee' : 'Invitation refusee', color: 'success' })
    emit('update:open', false)
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    responding.value = false
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function getOrgName(event: Evenement): string {
  if (typeof event.organisateur === 'string') return event.organisateur
  const u = event.organisateur
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getParticipantName(p: any): string {
  if (typeof p.user === 'string') return p.user
  const u = p.user
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getUserName(u: UserProfile): string {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function formatEventDateRange(event: Evenement): string {
  const s = new Date(event.date_debut)
  const e = new Date(event.date_fin)
  if (event.toute_journee) {
    const sd = s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    const ed = e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    return sd === ed ? sd : `${sd} → ${ed}`
  }
  const sd = s.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const st = s.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const et = e.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${sd.charAt(0).toUpperCase() + sd.slice(1)}, ${st} → ${et}`
}

function participantStatusClass(statut: string): string {
  if (statut === 'accepte') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (statut === 'refuse') return 'bg-red-50 text-red-600 border-red-200'
  return 'bg-stone-100 text-stone-500 border-stone-200'
}

function participantStatusLabel(statut: string): string {
  if (statut === 'accepte') return '✓'
  if (statut === 'refuse') return '✗'
  return '?'
}

function toggleParticipant(userId: string) {
  const idx = formParticipantIds.value.indexOf(userId)
  if (idx >= 0) formParticipantIds.value.splice(idx, 1)
  else formParticipantIds.value.push(userId)
}

const typeLabel: Record<string, string> = {
  personnel: 'Personnel',
  equipe: 'Equipe',
  entreprise: 'Entreprise'
}
const typeColor: Record<string, string> = {
  personnel: 'bg-stone-100 text-stone-500',
  equipe: 'bg-indigo-50 text-indigo-600',
  entreprise: 'bg-amber-50 text-amber-700'
}
</script>

<template>
  <UModal :open="open" @update:open="$emit('update:open', $event)">
    <template #content>
      <div class="p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">

        <!-- ══ VIEW MODE ══ -->
        <template v-if="mode === 'view' && event">
          <!-- Header -->
          <div class="flex items-start gap-3 mb-5">
            <span
              class="size-3 rounded-full mt-1.5 shrink-0"
              :style="{ background: event.couleur || '#AF8F3C' }"
            />
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-stone-900 leading-tight">{{ event.titre }}</h3>
              <span class="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full" :class="typeColor[event.type]">
                {{ typeLabel[event.type] }}
              </span>
            </div>
          </div>

          <!-- Date/lieu/desc -->
          <div class="space-y-2 text-sm text-stone-600">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar" class="size-4 shrink-0 text-stone-400" />
              <span>{{ formatEventDateRange(event) }}</span>
            </div>
            <div v-if="event.lieu" class="flex items-center gap-2">
              <UIcon name="i-lucide-map-pin" class="size-4 shrink-0 text-stone-400" />
              <span>{{ event.lieu }}</span>
            </div>
            <div v-if="event.description" class="flex items-start gap-2">
              <UIcon name="i-lucide-align-left" class="size-4 shrink-0 text-stone-400 mt-0.5" />
              <span class="whitespace-pre-line">{{ event.description }}</span>
            </div>
            <div class="flex items-center gap-2 text-stone-400 text-xs">
              <UIcon name="i-lucide-user" class="size-3.5 shrink-0" />
              <span>Organise par {{ getOrgName(event) }}</span>
            </div>
          </div>

          <!-- Participants -->
          <div v-if="event.participants?.length" class="mt-4">
            <p class="text-xs font-medium text-stone-500 mb-2">
              Participants ({{ event.participants.length }})
            </p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="p in event.participants"
                :key="p.id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                :class="participantStatusClass(p.statut)"
              >
                <span>{{ getParticipantName(p) }}</span>
                <span class="font-bold">{{ participantStatusLabel(p.statut) }}</span>
              </span>
            </div>
          </div>

          <!-- Respond (if invited) -->
          <div v-if="myParticipation?.statut === 'invite'" class="mt-5 p-3 rounded-lg bg-amber-50/60 border border-amber-200/40">
            <p class="text-xs text-stone-500 mb-2">Vous avez ete invite a cet evenement</p>
            <div class="flex gap-2">
              <UButton
                label="Accepter"
                icon="i-lucide-check"
                size="sm"
                color="success"
                :loading="responding"
                @click="handleRespond('accepte')"
              />
              <UButton
                label="Refuser"
                icon="i-lucide-x"
                size="sm"
                color="neutral"
                variant="ghost"
                :loading="responding"
                @click="handleRespond('refuse')"
              />
            </div>
          </div>
          <div v-else-if="myParticipation" class="mt-4 text-xs text-stone-400">
            Vous avez {{ myParticipation.statut === 'accepte' ? 'accepte' : 'refuse' }} cet evenement
          </div>

          <!-- Actions footer -->
          <div class="flex justify-between items-center mt-6 pt-4 border-t border-[rgba(175,143,60,0.08)]">
            <div class="flex gap-2">
              <UButton
                v-if="isOwner || isAdmin"
                label="Modifier"
                icon="i-lucide-pencil"
                size="sm"
                color="neutral"
                variant="ghost"
                @click="startEdit"
              />
              <UButton
                v-if="isOwner || isAdmin"
                :label="confirmDelete ? 'Confirmer ?' : 'Supprimer'"
                icon="i-lucide-trash-2"
                size="sm"
                :color="confirmDelete ? 'error' : 'neutral'"
                variant="ghost"
                :loading="deleting"
                @click="handleDelete"
              />
            </div>
            <UButton
              label="Fermer"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="$emit('update:open', false)"
            />
          </div>
        </template>

        <!-- ══ FORM MODE (create / edit) ══ -->
        <template v-else>
          <h3 class="text-base font-semibold text-stone-900 mb-5">
            {{ mode === 'create' ? 'Nouvel evenement' : 'Modifier l\'evenement' }}
          </h3>

          <form class="space-y-4" @submit.prevent="handleSave">
            <!-- Titre -->
            <UFormField label="Titre" required>
              <UInput v-model="formTitre" placeholder="Titre de l'evenement" autofocus class="w-full" />
            </UFormField>

            <!-- Toute la journée -->
            <div class="flex items-center gap-3">
              <UToggle v-model="formTouteJournee" />
              <span class="text-sm text-stone-600">Toute la journee</span>
            </div>

            <!-- Dates / heures -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Debut">
                <input
                  v-model="formDateDebut"
                  type="date"
                  class="w-full h-8 px-3 text-sm rounded-md border border-[rgba(175,143,60,0.2)] bg-transparent text-stone-700 focus:outline-none focus:border-amber-400/60"
                />
                <input
                  v-if="!formTouteJournee"
                  v-model="formTimeDebut"
                  type="time"
                  class="w-full h-8 px-3 text-sm rounded-md border border-[rgba(175,143,60,0.2)] bg-transparent text-stone-700 focus:outline-none focus:border-amber-400/60 mt-1.5"
                />
              </UFormField>
              <UFormField label="Fin">
                <input
                  v-model="formDateFin"
                  type="date"
                  class="w-full h-8 px-3 text-sm rounded-md border border-[rgba(175,143,60,0.2)] bg-transparent text-stone-700 focus:outline-none focus:border-amber-400/60"
                />
                <input
                  v-if="!formTouteJournee"
                  v-model="formTimeFin"
                  type="time"
                  class="w-full h-8 px-3 text-sm rounded-md border border-[rgba(175,143,60,0.2)] bg-transparent text-stone-700 focus:outline-none focus:border-amber-400/60 mt-1.5"
                />
              </UFormField>
            </div>

            <!-- Lieu -->
            <UFormField label="Lieu">
              <UInput v-model="formLieu" placeholder="Lieu (optionnel)" icon="i-lucide-map-pin" class="w-full" />
            </UFormField>

            <!-- Description -->
            <UFormField label="Description">
              <UTextarea v-model="formDescription" placeholder="Description (optionnelle)" class="w-full" />
            </UFormField>

            <!-- Couleur -->
            <div>
              <p class="text-sm font-medium text-stone-700 mb-2">Couleur</p>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="c in PALETTE"
                  :key="c"
                  type="button"
                  class="size-6 rounded-full transition-all"
                  :style="{ background: c }"
                  :class="formCouleur === c ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : 'opacity-70 hover:opacity-100'"
                  @click="formCouleur = c"
                />
              </div>
            </div>

            <!-- Type -->
            <UFormField label="Categorie">
              <USelect v-model="formType" :items="typeOptions" class="w-full" />
            </UFormField>

            <!-- Participants -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="text-sm font-medium text-stone-700">Participants</p>
                <span class="text-xs text-stone-400">{{ formParticipantIds.length }} selectionne(s)</span>
              </div>

              <!-- Tous actifs (admin + entreprise) -->
              <div v-if="isAdmin && formType === 'entreprise'" class="flex items-center gap-2 p-2 rounded-lg bg-amber-50/60 text-sm text-stone-600">
                <UIcon name="i-lucide-users" class="size-4 text-amber-500 shrink-0" />
                <span>Tous les membres actifs seront invites</span>
              </div>

              <div v-else class="max-h-44 overflow-y-auto space-y-0.5 border border-[rgba(175,143,60,0.1)] rounded-lg p-1">
                <p v-if="!usersLoaded" class="text-xs text-stone-400 text-center py-2">Chargement...</p>
                <label
                  v-for="u in availableUsers"
                  v-else
                  :key="u.id"
                  class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    :checked="formParticipantIds.includes(u.id)"
                    class="accent-amber-500"
                    @change="toggleParticipant(u.id)"
                  />
                  <span class="text-sm text-stone-700">{{ getUserName(u) }}</span>
                </label>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                @click="mode === 'edit' ? (mode = 'view') : $emit('update:open', false)"
              />
              <UButton
                type="submit"
                :label="mode === 'create' ? 'Creer' : 'Enregistrer'"
                :loading="saving"
                :disabled="!formTitre.trim()"
              />
            </div>
          </form>
        </template>

      </div>
    </template>
  </UModal>
</template>
