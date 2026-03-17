<script setup lang="ts">
import type { Candidat, CandidatStatut, CandidatCommentaire, ContactOrigin } from '~/utils/types'
import { CANDIDAT_STATUTS, CANDIDAT_PIPELINE_ORDER, CANDIDAT_SOURCES } from '~/utils/constants'

definePageMeta({ middleware: ['directeur'] })

const route = useRoute()
const { user } = useAuth()
const { getById, update, remove, addComment, removeComment, getCvUrl } = useCandidats()
const { getAll: getAllOffers } = useJobListings()
const toast = useToast()
const config = useRuntimeConfig()

const candidatId = route.params.id as string

const { data: candidat, status, refresh } = useAsyncData(`candidat-${candidatId}`, () => getById(candidatId))
const { data: offres } = useAsyncData('candidat-detail-offres', getAllOffers)

// --- Editing ---
const editing = ref(false)
const saving = ref(false)

const editForm = reactive({
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  linkedin: '',
  source: null as string | null,
  contact_origin: 'sortant' as ContactOrigin,
  date_contact: '',
  offre: null as string | null,
  notes: ''
})

const sourceOptions = CANDIDAT_SOURCES.map(s => ({ label: s, value: s }))
const offreOptions = computed(() =>
  [{ label: 'Aucune offre', value: '' }, ...(offres.value || []).map(o => ({ label: o.titre, value: o.id }))]
)

function startEditing() {
  if (!candidat.value) return
  const c = candidat.value
  editForm.prenom = c.prenom
  editForm.nom = c.nom
  editForm.email = c.email || ''
  editForm.telephone = c.telephone || ''
  editForm.linkedin = c.linkedin || ''
  editForm.source = c.source || null
  editForm.contact_origin = c.contact_origin || 'sortant'
  editForm.date_contact = c.date_contact || ''
  editForm.offre = (typeof c.offre === 'object' && c.offre?.id) || null
  editForm.notes = c.notes || ''
  editing.value = true
}

async function saveChanges() {
  if (!editForm.prenom.trim() || !editForm.nom.trim()) return
  saving.value = true
  try {
    await update(candidatId, {
      prenom: editForm.prenom.trim(),
      nom: editForm.nom.trim(),
      email: editForm.email.trim() || null,
      telephone: editForm.telephone.trim() || null,
      linkedin: editForm.linkedin.trim() || null,
      source: editForm.source || null,
      contact_origin: editForm.contact_origin,
      date_contact: editForm.date_contact || null,
      offre: editForm.offre || null,
      notes: editForm.notes.trim() || null
    })
    toast.add({ title: 'Candidat mis a jour', color: 'success' })
    editing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    saving.value = false
  }
}

// --- Delete ---
const showDeleteModal = ref(false)
const deleting = ref(false)

async function handleDelete() {
  deleting.value = true
  try {
    await remove(candidatId)
    toast.add({ title: 'Candidat supprime', color: 'success' })
    await navigateTo('/candidats')
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    deleting.value = false
  }
}

// --- Pipeline progression ---
function getPipelineIndex(statut: CandidatStatut): number {
  return CANDIDAT_PIPELINE_ORDER.indexOf(statut as any)
}

async function advanceTo(statut: CandidatStatut) {
  try {
    await update(candidatId, { statut })
    toast.add({ title: `Statut: ${CANDIDAT_STATUTS[statut].label}`, color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function markEchec() {
  try {
    await update(candidatId, { statut: 'echec' as CandidatStatut })
    toast.add({ title: 'Marque en echec', color: 'error' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- CV upload ---
const uploadingCv = ref(false)

async function handleCvUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingCv.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const baseUrl = config.public.directusUrl as string
    const url = baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`
    const res = await fetch(`${url}/files`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Upload failed')
    const { data } = await res.json()

    await update(candidatId, { cv: data.id })
    toast.add({ title: 'CV uploade', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur upload CV', color: 'error' })
  } finally {
    uploadingCv.value = false
  }
}

// --- Comments ---
const showCommentModal = ref(false)
const addingComment = ref(false)
const commentText = ref('')

const sortedComments = computed(() => {
  if (!candidat.value?.commentaires) return []
  return [...candidat.value.commentaires].sort(
    (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
  )
})

async function handleAddComment() {
  if (!user.value || !commentText.value.trim()) return
  addingComment.value = true
  try {
    await addComment({
      candidat: candidatId,
      contenu: commentText.value.trim(),
      auteur: user.value.id
    })
    toast.add({ title: 'Commentaire ajoute', color: 'success' })
    showCommentModal.value = false
    commentText.value = ''
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingComment.value = false
  }
}

async function handleDeleteComment(commentId: string) {
  try {
    await removeComment(commentId)
    toast.add({ title: 'Commentaire supprime', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Helpers ---
function getOffreTitre(c: Candidat): string {
  if (!c.offre || typeof c.offre === 'string') return ''
  return c.offre.titre
}

function getCommentAuthorName(comment: CandidatCommentaire): string {
  if (!comment.auteur || typeof comment.auteur === 'string') return '-'
  return [comment.auteur.first_name, comment.auteur.last_name].filter(Boolean).join(' ') || '-'
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="candidat ? `${candidat.prenom} ${candidat.nom}` : 'Candidat'">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/candidats" />
      </template>
      <template #right>
        <template v-if="!editing && candidat">
          <UButton label="Modifier" icon="i-lucide-pencil" size="sm" variant="subtle" @click="startEditing" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="showDeleteModal = true" />
        </template>
        <template v-if="editing">
          <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="editing = false" />
          <UButton label="Enregistrer" icon="i-lucide-check" size="sm" :loading="saving" @click="saveChanges" />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="candidat" class="max-w-3xl space-y-6">
        <!-- ===== READ MODE ===== -->
        <template v-if="!editing">
          <!-- Pipeline progress -->
          <UCard>
            <div class="space-y-5">
              <!-- Header -->
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-xl font-bold text-stone-900">{{ candidat.prenom }} {{ candidat.nom }}</h2>
                    <UBadge :color="(CANDIDAT_STATUTS[candidat.statut]?.color as any)" variant="subtle">
                      {{ CANDIDAT_STATUTS[candidat.statut]?.label }}
                    </UBadge>
                  </div>
                  <p v-if="getOffreTitre(candidat)" class="text-sm text-stone-500 flex items-center gap-1.5">
                    <UIcon name="i-lucide-megaphone" class="size-3.5" />
                    {{ getOffreTitre(candidat) }}
                  </p>
                </div>
                <div class="text-right text-xs text-stone-400 shrink-0 space-y-0.5">
                  <p>
                    {{ candidat.contact_origin === 'entrant' ? 'Candidature entrante' : 'Contact sortant' }}
                  </p>
                  <p v-if="candidat.date_contact">Contact : {{ formatDateFr(candidat.date_contact) }}</p>
                </div>
              </div>

              <!-- Pipeline steps -->
              <div v-if="candidat.statut !== 'echec'" class="flex items-center gap-1">
                <template v-for="(step, i) in CANDIDAT_PIPELINE_ORDER" :key="step">
                  <button
                    class="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all text-center"
                    :class="getPipelineIndex(candidat.statut) >= i
                      ? 'border-primary/30 bg-primary/8 text-primary'
                      : 'border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-500'"
                    @click="advanceTo(step as CandidatStatut)"
                  >
                    <UIcon :name="CANDIDAT_STATUTS[step].icon" class="size-4" />
                    <span class="text-[10px] sm:text-xs font-medium leading-tight">{{ CANDIDAT_STATUTS[step].label }}</span>
                  </button>
                  <UIcon v-if="i < CANDIDAT_PIPELINE_ORDER.length - 1" name="i-lucide-chevron-right" class="size-3 text-stone-300 shrink-0" />
                </template>
              </div>

              <!-- Echec banner -->
              <div v-else class="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200/60 text-sm text-red-700">
                <UIcon name="i-lucide-x-circle" class="size-5 shrink-0" />
                <span>Procedure en echec. Le profil sera supprime automatiquement 2 mois apres la mise en echec.</span>
              </div>

              <!-- Echec button -->
              <div class="flex items-center gap-2 pt-1">
                <UButton
                  v-if="candidat.statut !== 'echec'"
                  label="Marquer en echec"
                  icon="i-lucide-x-circle"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="markEchec"
                />
                <UButton
                  v-else
                  label="Reprendre le processus"
                  icon="i-lucide-rotate-ccw"
                  variant="ghost"
                  size="xs"
                  @click="advanceTo('premier_contact')"
                />
              </div>
            </div>
          </UCard>

          <!-- Info -->
          <UCard>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-xs text-stone-400">Email</span>
                <p class="font-medium text-stone-800">
                  <a v-if="candidat.email" :href="`mailto:${candidat.email}`" class="text-primary hover:underline">{{ candidat.email }}</a>
                  <span v-else>-</span>
                </p>
              </div>
              <div>
                <span class="text-xs text-stone-400">Telephone</span>
                <p class="font-medium text-stone-800">
                  <a v-if="candidat.telephone" :href="`tel:${candidat.telephone}`" class="text-primary hover:underline">{{ candidat.telephone }}</a>
                  <span v-else>-</span>
                </p>
              </div>
              <div>
                <span class="text-xs text-stone-400">LinkedIn</span>
                <p class="font-medium text-stone-800">
                  <a v-if="candidat.linkedin" :href="candidat.linkedin" target="_blank" class="text-primary hover:underline truncate block">{{ candidat.linkedin }}</a>
                  <span v-else>-</span>
                </p>
              </div>
              <div>
                <span class="text-xs text-stone-400">Source</span>
                <p class="font-medium text-stone-800">{{ candidat.source || '-' }}</p>
              </div>
              <div>
                <span class="text-xs text-stone-400">Date contact</span>
                <p class="font-medium text-stone-800">{{ formatDateFr(candidat.date_contact) }}</p>
              </div>
              <div>
                <span class="text-xs text-stone-400">Cree le</span>
                <p class="font-medium text-stone-800">{{ formatDateFr(candidat.date_created) }}</p>
              </div>
            </div>

            <!-- CV -->
            <div class="pt-3 mt-3 border-t border-stone-100">
              <span class="text-xs text-stone-400">CV</span>
              <div class="mt-1 flex items-center gap-2">
                <template v-if="candidat.cv">
                  <a
                    :href="getCvUrl(candidat.cv)"
                    target="_blank"
                    class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <UIcon name="i-lucide-file-text" class="size-4" />
                    Telecharger le CV
                  </a>
                </template>
                <label class="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary cursor-pointer">
                  <UIcon name="i-lucide-upload" class="size-4" />
                  <span>{{ candidat.cv ? 'Remplacer' : 'Ajouter un CV' }}</span>
                  <input type="file" accept=".pdf,.doc,.docx" class="hidden" @change="handleCvUpload">
                </label>
                <UIcon v-if="uploadingCv" name="i-lucide-loader-2" class="size-4 text-primary animate-spin" />
              </div>
            </div>

            <!-- Notes -->
            <div v-if="candidat.notes" class="pt-3 mt-3 border-t border-stone-100">
              <span class="text-xs text-stone-400">Notes</span>
              <p class="mt-1 text-sm text-stone-700 whitespace-pre-line">{{ candidat.notes }}</p>
            </div>
          </UCard>

          <!-- Comments timeline -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-stone-900">
                  Commentaires
                  <span v-if="sortedComments.length" class="text-stone-400 font-normal">({{ sortedComments.length }})</span>
                </h3>
                <UButton
                  label="Ajouter"
                  icon="i-lucide-plus"
                  size="xs"
                  @click="showCommentModal = true"
                />
              </div>
            </template>

            <div v-if="!sortedComments.length" class="text-center py-6">
              <UIcon name="i-lucide-message-circle" class="size-8 text-stone-300 mx-auto mb-2" />
              <p class="text-sm text-stone-500">Aucun commentaire</p>
              <UButton
                label="Premier commentaire"
                icon="i-lucide-message-square"
                size="xs"
                variant="subtle"
                class="mt-3"
                @click="showCommentModal = true"
              />
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(comment, index) in sortedComments"
                :key="comment.id"
                class="relative flex gap-3 group"
              >
                <div class="flex flex-col items-center">
                  <div class="flex items-center justify-center size-8 rounded-full shrink-0 bg-stone-100">
                    <UIcon name="i-lucide-message-square" class="size-4 text-stone-500" />
                  </div>
                  <div
                    v-if="index < sortedComments.length - 1"
                    class="w-px flex-1 bg-stone-200 mt-1"
                  />
                </div>

                <div class="flex-1 pb-4 min-w-0">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-stone-800">
                        {{ getCommentAuthorName(comment) }}
                      </span>
                      <span class="text-[11px] text-stone-400">
                        {{ formatDateShort(comment.date_created) }}
                      </span>
                    </div>
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      variant="ghost"
                      color="error"
                      class="opacity-0 group-hover:opacity-100"
                      @click="handleDeleteComment(comment.id)"
                    />
                  </div>
                  <p class="text-sm text-stone-700 whitespace-pre-line">
                    {{ comment.contenu }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </template>

        <!-- ===== EDIT MODE ===== -->
        <template v-else>
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900">Identite</h3>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Prenom *">
                  <UInput v-model="editForm.prenom" class="w-full" />
                </UFormField>
                <UFormField label="Nom *">
                  <UInput v-model="editForm.nom" class="w-full" />
                </UFormField>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Email">
                  <UInput v-model="editForm.email" type="email" icon="i-lucide-mail" class="w-full" />
                </UFormField>
                <UFormField label="Telephone">
                  <UInput v-model="editForm.telephone" icon="i-lucide-phone" class="w-full" />
                </UFormField>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="LinkedIn">
                  <UInput v-model="editForm.linkedin" icon="i-lucide-link" class="w-full" />
                </UFormField>
                <UFormField label="Source">
                  <USelect v-model="editForm.source" :items="sourceOptions" value-key="value" placeholder="Non renseigne" class="w-full" />
                </UFormField>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900">Contact</h3>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField label="Date du contact">
                  <UInput v-model="editForm.date_contact" type="date" class="w-full" />
                </UFormField>
                <UFormField label="Origine">
                  <div class="flex items-center gap-2 pt-1">
                    <button
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors"
                      :class="editForm.contact_origin === 'sortant'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-stone-200 text-stone-500 hover:bg-stone-50'"
                      @click="editForm.contact_origin = 'sortant'"
                    >
                      <UIcon name="i-lucide-phone-outgoing" class="size-3.5" />
                      Sortant
                    </button>
                    <button
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors"
                      :class="editForm.contact_origin === 'entrant'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-stone-200 text-stone-500 hover:bg-stone-50'"
                      @click="editForm.contact_origin = 'entrant'"
                    >
                      <UIcon name="i-lucide-phone-incoming" class="size-3.5" />
                      Entrant
                    </button>
                  </div>
                </UFormField>
              </div>
              <UFormField label="Offre associee">
                <USelect v-model="editForm.offre" :items="offreOptions" value-key="value" placeholder="Aucune offre" class="w-full" />
              </UFormField>
              <UFormField label="Notes">
                <UTextarea v-model="editForm.notes" :rows="4" class="w-full" />
              </UFormField>
            </div>
          </UCard>
        </template>
      </div>
    </div>

    <!-- Delete modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Supprimer ce candidat ?</h3>
          <p class="text-sm text-stone-500">
            Cette action est irreversible. Le candidat et tous ses commentaires seront supprimes.
          </p>
          <div class="flex justify-end gap-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showDeleteModal = false" />
            <UButton label="Supprimer" color="error" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Comment modal -->
    <UModal v-model:open="showCommentModal">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Ajouter un commentaire</h3>
          <UTextarea
            v-model="commentText"
            placeholder="Votre commentaire..."
            :rows="4"
            class="w-full"
            autofocus
          />
          <div class="flex justify-end gap-2">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showCommentModal = false" />
            <UButton
              label="Ajouter"
              icon="i-lucide-send"
              :loading="addingComment"
              :disabled="!commentText.trim()"
              @click="handleAddComment"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
