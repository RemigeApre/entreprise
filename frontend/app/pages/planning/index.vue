<script setup lang="ts">
import type { PlanningEntry, PlanningPeriode, PlanningType } from '~/utils/types'
import { getMonday, addDays, formatDate, getWeekNumber } from '~/utils/dates'

const { user, isDirecteur, hasSchoolDays, hasHourTracking } = useAuth()
const { getEntries, createEntry, deleteEntry, getWorkedStats } = usePlanning()
const toast = useToast()

const entries = ref<PlanningEntry[]>([])
const loading = ref(false)
const currentMonday = ref(getMonday(new Date()))
const weekNumber = ref(getWeekNumber(new Date()))
const stats = ref({ totalHours: 0, totalDays: 0, totalHalfDays: 0 })

const contractStart = computed(() => user.value?.date_debut_contrat || null)
const contractEnd = computed(() => user.value?.date_fin_contrat || null)

// --- Quick action types ---
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
    { key: 'conge_paye', label: 'Conge paye', icon: 'i-lucide-palm-tree', planningType: 'conge', motif: 'Conge paye', requiresMotif: false },
    { key: 'sans_solde', label: 'Sans solde', icon: 'i-lucide-wallet', planningType: 'conge', motif: 'Sans solde', requiresMotif: false },
    { key: 'arret_maladie', label: 'Arret maladie', icon: 'i-lucide-heart-pulse', planningType: 'absent', motif: 'Arret maladie', requiresMotif: false },
  ]

  if (hasSchoolDays.value) {
    actions.push({ key: 'ecole', label: 'Ecole', icon: 'i-lucide-graduation-cap', planningType: 'ecole', motif: null, requiresMotif: false })
  }

  actions.push({ key: 'autre', label: 'Autre', icon: 'i-lucide-help-circle', planningType: 'absent', motif: null, requiresMotif: true })

  return actions
})

const activeAction = ref('travail')
const currentAction = computed(() => quickActions.value.find(a => a.key === activeAction.value)!)

// --- Motif modal for "Autre" ---
const showMotifModal = ref(false)
const motifInput = ref('')
const pendingSlot = ref<{ date: string, periode: PlanningPeriode } | null>(null)

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
    toast.add({ title: 'Erreur lors du chargement du planning', color: 'error' })
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  if (!user.value || !hasHourTracking.value) return
  try {
    stats.value = await getWorkedStats(user.value.id, new Date().getFullYear())
  } catch {
    // Silent fail for stats
  }
}

// --- Add entry (click empty slot) ---
async function handleAddEntry(date: string, periode: PlanningPeriode) {
  if (!user.value) return
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
  await doCreateEntry(
    pendingSlot.value.date,
    pendingSlot.value.periode,
    action.planningType,
    motifInput.value.trim()
  )
  showMotifModal.value = false
  pendingSlot.value = null
}

async function doCreateEntry(date: string, periode: PlanningPeriode, type: PlanningType, motif?: string) {
  if (!user.value) return
  try {
    const entry = await createEntry({
      utilisateur: user.value.id,
      date,
      periode,
      type,
      statut: isDirecteur.value ? 'valide' : undefined,
      motif
    })
    entries.value.push(entry)
    toast.add({ title: 'Entree ajoutee', color: 'success' })
    loadStats()
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout', color: 'error' })
  }
}

// --- Click existing entry: same type = remove, different type = replace ---
async function handleClickEntry(entry: PlanningEntry) {
  if (!user.value) return
  const action = currentAction.value
  const isSameType = entry.type === action.planningType && (entry.motif || null) === (action.motif || null)

  try {
    await deleteEntry(entry.id)
    entries.value = entries.value.filter(e => e.id !== entry.id)

    if (isSameType) {
      toast.add({ title: 'Entree supprimee', color: 'success' })
    } else {
      // Replace with the active type
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

    // Delete all current week entries first
    for (const existing of entries.value) {
      await deleteEntry(existing.id)
    }

    let count = 0
    for (const prev of prevEntries) {
      const prevDate = new Date(prev.date + 'T12:00:00')
      const dayOfWeek = prevDate.getDay() // 1=Mon, 2=Tue, ..., 5=Fri
      const offset = dayOfWeek - 1 // Mon=0, Tue=1, ..., Fri=4
      const newDate = formatDate(addDays(currentMonday.value, offset))

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

    // Reload entries from server
    await loadEntries(mondayStr)
    toast.add({ title: `${count} entree(s) copiee(s)`, color: 'success' })
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
  <div>
    <div class="p-4 sm:p-6 space-y-6">
      <!-- Header: centered title + week number -->
      <div class="text-center">
        <h1 class="text-xl font-semibold text-stone-900 dark:text-stone-100">Mon planning</h1>
        <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">Semaine {{ weekNumber }}</p>
      </div>

      <!-- Quick action buttons - centered -->
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-for="action in quickActions"
          :key="action.key"
          :label="action.label"
          :icon="action.icon"
          :variant="activeAction === action.key ? 'solid' : 'outline'"
          :color="activeAction === action.key ? 'primary' : 'neutral'"
          size="sm"
          @click="activeAction = action.key"
        />
      </div>

      <!-- Navigation links -->
      <div class="flex items-center justify-center gap-3 text-sm">
        <UButton
          v-if="isDirecteur"
          label="Gerer les plannings"
          icon="i-lucide-calendar-cog"
          color="neutral"
          variant="ghost"
          size="xs"
          to="/planning/admin"
        />
        <UButton
          label="Mes demandes de conges"
          icon="i-lucide-list"
          color="neutral"
          variant="ghost"
          size="xs"
          to="/planning/conges"
        />
        <UButton
          label="Copier semaine precedente"
          icon="i-lucide-copy"
          color="neutral"
          variant="ghost"
          size="xs"
          :loading="copyLoading"
          @click="handleCopyPreviousWeek"
        />
      </div>

      <!-- Mon planning + hours summary side by side -->
      <div class="flex gap-6">
        <div class="flex-1">
          <PlanningWeekView
            :entries="entries"
            :contract-start="contractStart"
            :contract-end="contractEnd"
            @week-change="loadEntries"
            @add-entry="handleAddEntry"
            @click-entry="handleClickEntry"
          />
        </div>

        <div v-if="hasHourTracking" class="w-64 shrink-0">
          <PlanningHoursSummary
            :total-hours="stats.totalHours"
            :total-days="stats.totalDays"
            :total-half-days="stats.totalHalfDays"
          />
        </div>
      </div>

      <!-- Presence equipe -->
      <PlanningTeamPresence
        :monday="currentMonday"
        :current-user-id="user?.id"
        :is-admin="isDirecteur"
      />
    </div>

    <!-- Motif modal for "Autre" -->
    <UModal :open="showMotifModal" @update:open="showMotifModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">Justification requise</h3>
          <form class="space-y-4" @submit.prevent="handleMotifSubmit">
            <UFormField label="Motif">
              <UTextarea v-model="motifInput" placeholder="Indiquez le motif..." required />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showMotifModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-check" :disabled="!motifInput.trim()" />
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
