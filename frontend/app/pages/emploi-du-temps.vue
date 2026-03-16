<script setup lang="ts">
import type { PlanningEntry, PlanningPeriode, PlanningType } from '~/utils/types'
import { getMonday, addDays, formatDate, getWeekNumber, isPastDate, formatDateFr, getCurrentOrNextMonday } from '~/utils/dates'

const { user, isDirecteur, hasSchoolDays, hasHourTracking } = useAuth()
const { getEntries, createEntry, deleteEntry, getWorkedStats } = usePlanning()
const { getAdminUsers } = useUsers()
const { createBatch } = useNotifications()
const toast = useToast()

const timetableRef = ref<{ weekNumber: number; weekLabel: string; previousWeek: () => void; nextWeek: () => void; goToToday: () => void } | null>(null)

const entries = ref<PlanningEntry[]>([])
const loading = ref(false)
const currentMonday = ref(getCurrentOrNextMonday(new Date()))
const weekNumber = ref(getWeekNumber(new Date()))
const stats = ref({ totalHours: 0, totalDays: 0, totalHalfDays: 0 })

const contractStart = computed(() => user.value?.date_debut_contrat || null)
const contractEnd = computed(() => user.value?.date_fin_contrat || null)

const weekLabel = computed(() => {
  const start = currentMonday.value
  const end = addDays(start, 4)
  const s = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${s} - ${e}`
})

// --- Quick actions ---
interface QuickAction {
  key: string
  label: string
  icon: string
  planningType: PlanningType
  motif: string | null
  requiresMotif: boolean
}

const quickActions = computed<QuickAction[]>(() => {
  const actions: QuickAction[] = [
    { key: 'travail', label: 'Travail', icon: 'i-lucide-briefcase', planningType: 'travail', motif: null, requiresMotif: false },
    { key: 'teletravail', label: 'Teletravail', icon: 'i-lucide-house', planningType: 'travail', motif: 'Teletravail', requiresMotif: false },
    { key: 'conge_paye', label: 'Conge', icon: 'i-lucide-plane', planningType: 'conge', motif: 'Conge paye', requiresMotif: false },
    { key: 'arret_maladie', label: 'Maladie', icon: 'i-lucide-heart-pulse', planningType: 'absent', motif: 'Arret maladie', requiresMotif: false }
  ]
  if (hasSchoolDays.value) {
    actions.push({ key: 'ecole', label: 'Ecole', icon: 'i-lucide-graduation-cap', planningType: 'ecole', motif: null, requiresMotif: false })
  }
  actions.push({ key: 'autre', label: 'Autre', icon: 'i-lucide-more-horizontal', planningType: 'absent', motif: null, requiresMotif: true })
  return actions
})

const activeAction = ref('travail')
const currentAction = computed(() => quickActions.value.find(a => a.key === activeAction.value)!)

// --- Motif modal ---
const showMotifModal = ref(false)
const motifInput = ref('')
const pendingSlot = ref<{ date: string, periode: PlanningPeriode } | null>(null)

// --- Modification request (past dates, non-admin) ---
interface ModifSlot {
  date: string
  periode: PlanningPeriode
  existingEntry?: PlanningEntry
}

const modifSelections = ref<Map<string, ModifSlot>>(new Map())
const modifSelectedSet = computed(() => new Set(modifSelections.value.keys()))
const showModifModal = ref(false)
const modifDescription = ref('')
const modifSending = ref(false)

function isPastForUser(date: string): boolean {
  return !isDirecteur.value && isPastDate(date)
}

function modifSlotKey(date: string, periode: PlanningPeriode): string {
  return `${date}_${periode}`
}

function toggleModifSelection(date: string, periode: PlanningPeriode, existingEntry?: PlanningEntry) {
  const key = modifSlotKey(date, periode)
  const map = new Map(modifSelections.value)
  if (map.has(key)) map.delete(key)
  else map.set(key, { date, periode, existingEntry })
  modifSelections.value = map
}

function clearModifSelections() {
  modifSelections.value = new Map()
}

const sortedModifSlots = computed(() => {
  return [...modifSelections.value.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.periode === 'matin' ? -1 : 1
  })
})

function openModifModal() {
  modifDescription.value = ''
  showModifModal.value = true
}

async function handleModifSubmit() {
  if (!modifSelections.value.size || !modifDescription.value.trim() || !user.value) return
  modifSending.value = true
  try {
    const admins = await getAdminUsers()
    if (!admins.length) {
      toast.add({ title: 'Aucun administrateur trouve', color: 'error' })
      return
    }
    const userName = [user.value.first_name, user.value.last_name].filter(Boolean).join(' ') || user.value.email
    const slots = sortedModifSlots.value
    const slotLabels = slots.map(s => {
      const periodeLabel = s.periode === 'matin' ? 'matin' : 'apres-midi'
      return `${formatDateFr(s.date + 'T00:00:00')} (${periodeLabel})`
    }).join(', ')
    const message = `${userName} demande une modification sur ${slots.length} creneau(x) : ${slotLabels}. Motif : ${modifDescription.value.trim()}`
    await createBatch(admins.map(a => a.id), message, 'planning_modifie', `/planning/${user.value.id}`)
    toast.add({ title: 'Demande envoyee a l\'administrateur', color: 'success' })
    showModifModal.value = false
    clearModifSelections()
  } catch {
    toast.add({ title: 'Erreur lors de l\'envoi de la demande', color: 'error' })
  } finally {
    modifSending.value = false
  }
}

// --- Load entries ---
async function loadEntries(mondayStr: string) {
  if (!user.value) return
  loading.value = true
  currentMonday.value = new Date(mondayStr + 'T00:00:00')
  weekNumber.value = getWeekNumber(currentMonday.value)
  try {
    const friday = formatDate(addDays(new Date(mondayStr + 'T00:00:00'), 4))
    entries.value = await getEntries(user.value.id, mondayStr, friday)
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  if (!user.value || !hasHourTracking.value) return
  try {
    stats.value = await getWorkedStats(user.value.id, new Date().getFullYear())
  } catch { /* silent */ }
}

// --- Entry actions ---
async function handleAddEntry(date: string, periode: PlanningPeriode) {
  if (!user.value) return
  if (isPastForUser(date)) {
    toggleModifSelection(date, periode)
    return
  }
  const action = currentAction.value
  if (action.requiresMotif) {
    pendingSlot.value = { date, periode }
    motifInput.value = ''
    showMotifModal.value = true
    return
  }
  await doCreateEntry(date, periode, action.planningType, action.motif || undefined)
}

async function handleMotifSubmit() {
  if (!pendingSlot.value || !motifInput.value.trim()) return
  const action = currentAction.value
  await doCreateEntry(pendingSlot.value.date, pendingSlot.value.periode, action.planningType, motifInput.value.trim())
  showMotifModal.value = false
  pendingSlot.value = null
}

async function doCreateEntry(date: string, periode: PlanningPeriode, type: PlanningType, motif?: string) {
  if (!user.value) return
  try {
    const entry = await createEntry({
      utilisateur: user.value.id,
      date, periode, type,
      statut: isDirecteur.value ? 'valide' : undefined,
      motif
    })
    entries.value.push(entry)
    loadStats()
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'Erreur lors de l\'ajout'
    toast.add({ title: msg, color: 'error' })
  }
}

async function handleClickEntry(entry: PlanningEntry) {
  if (!user.value) return
  if (isPastForUser(entry.date)) {
    toggleModifSelection(entry.date, entry.periode, entry)
    return
  }
  const action = currentAction.value
  const isSameType = entry.type === action.planningType && (entry.motif || null) === (action.motif || null)
  try {
    await deleteEntry(entry.id)
    entries.value = entries.value.filter(e => e.id !== entry.id)
    if (!isSameType) {
      if (action.requiresMotif) {
        pendingSlot.value = { date: entry.date, periode: entry.periode }
        motifInput.value = ''
        showMotifModal.value = true
      } else {
        await doCreateEntry(entry.date, entry.periode, action.planningType, action.motif || undefined)
      }
    }
    loadStats()
  } catch {
    toast.add({ title: 'Erreur lors de la modification', color: 'error' })
  }
}

// --- Copy previous week ---
const copyLoading = ref(false)

async function handleCopyPreviousWeek() {
  if (!user.value) return
  copyLoading.value = true
  try {
    const mondayStr = formatDate(currentMonday.value)
    const prevMonday = addDays(currentMonday.value, -7)
    const prevFriday = addDays(prevMonday, 4)
    const prevEntries = await getEntries(user.value.id, formatDate(prevMonday), formatDate(prevFriday))
    if (!prevEntries.length) {
      toast.add({ title: 'Aucune entree la semaine precedente', color: 'warning' })
      return
    }
    for (const existing of entries.value) {
      if (!isPastForUser(existing.date)) await deleteEntry(existing.id)
    }
    let count = 0
    for (const prev of prevEntries) {
      const prevDate = new Date(prev.date + 'T12:00:00')
      const offset = prevDate.getDay() - 1
      const newDate = formatDate(addDays(currentMonday.value, offset))
      if (isPastForUser(newDate)) continue
      await createEntry({
        utilisateur: user.value.id,
        date: newDate,
        periode: prev.periode,
        type: prev.type,
        statut: isDirecteur.value ? 'valide' : undefined,
        motif: prev.motif || undefined,
        heures: prev.heures || undefined
      })
      count++
    }
    await loadEntries(mondayStr)
    toast.add({ title: count > 0 ? `${count} entree(s) copiee(s)` : 'Aucune entree copiee (dates passees)', color: count > 0 ? 'success' : 'warning' })
    loadStats()
  } catch {
    toast.add({ title: 'Erreur lors de la copie', color: 'error' })
  } finally {
    copyLoading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Navigation bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-0.5">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" @click="timetableRef?.previousWeek()" />
            <UButton label="Aujourd'hui" color="neutral" variant="soft" size="xs" @click="timetableRef?.goToToday()" />
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" @click="timetableRef?.nextWeek()" />
          </div>
          <span class="text-sm font-medium text-stone-500 dark:text-stone-400">
            S{{ weekNumber }} <span class="text-stone-300 dark:text-stone-600 mx-0.5">·</span> {{ weekLabel }}
          </span>
        </div>

        <div class="flex items-center gap-1.5">
          <UButton
            v-if="isDirecteur"
            label="Gestion"
            icon="i-lucide-calendar-cog"
            color="neutral"
            variant="ghost"
            size="xs"
            to="/planning/admin"
          />
          <UButton
            label="Conges"
            icon="i-lucide-list"
            color="neutral"
            variant="ghost"
            size="xs"
            to="/planning/conges"
          />
          <UTooltip text="Copier la semaine precedente">
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              :loading="copyLoading"
              @click="handleCopyPreviousWeek"
            />
          </UTooltip>
        </div>
      </div>

      <!-- Quick action pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="action in quickActions"
          :key="action.key"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          :class="activeAction === action.key
            ? 'bg-primary text-white'
            : 'bg-[rgba(175,143,60,0.06)] text-[#2c2419]/60 dark:text-[#e8e0d0]/50 hover:bg-[rgba(175,143,60,0.12)]'"
          @click="activeAction = action.key"
        >
          <UIcon :name="action.icon" class="size-3.5" />
          {{ action.label }}
        </button>
      </div>

      <!-- Timetable -->
      <div class="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <div class="flex-1 min-w-0">
          <PlanningTimetable
            ref="timetableRef"
            :entries="entries"
            :contract-start="contractStart"
            :contract-end="contractEnd"
            :selected-slots="modifSelectedSet"
            hide-nav
            @week-change="loadEntries"
            @add-entry="handleAddEntry"
            @click-entry="handleClickEntry"
          />
        </div>
        <div v-if="hasHourTracking" class="w-full sm:w-56 sm:shrink-0">
          <PlanningHoursSummary
            :total-hours="stats.totalHours"
            :total-days="stats.totalDays"
            :total-half-days="stats.totalHalfDays"
          />
        </div>
      </div>
    </div>

    <!-- Motif modal -->
    <UModal :open="showMotifModal" @update:open="showMotifModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Motif</h3>
          <form class="space-y-4" @submit.prevent="handleMotifSubmit">
            <UFormField label="Justification">
              <UTextarea v-model="motifInput" placeholder="Indiquez le motif..." required />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showMotifModal = false" />
              <UButton type="submit" label="Valider" :disabled="!motifInput.trim()" />
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Floating bar for past date selections -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="translate-y-full opacity-0"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="modifSelections.size > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg bg-white dark:bg-stone-900 border border-[rgba(175,143,60,0.2)]"
      >
        <span class="text-xs text-stone-500">{{ modifSelections.size }} creneau(x) selectionne(s)</span>
        <UButton label="Demander modif." size="xs" @click="openModifModal" />
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="clearModifSelections" />
      </div>
    </Transition>

    <!-- Modif request modal -->
    <UModal :open="showModifModal" @update:open="showModifModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">Demande de modification</h3>
          <p class="text-xs text-stone-400 mb-4">{{ sortedModifSlots.length }} creneau(x) concerne(s)</p>
          <form class="space-y-4" @submit.prevent="handleModifSubmit">
            <UFormField label="Motif de la demande">
              <UTextarea v-model="modifDescription" placeholder="Expliquez pourquoi vous souhaitez modifier ces creneaux..." required />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showModifModal = false" />
              <UButton type="submit" label="Envoyer" :loading="modifSending" :disabled="!modifDescription.trim()" />
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
