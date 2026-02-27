<script setup lang="ts">
import { readUser } from '@directus/sdk'
import type { PlanningEntry, PlanningPeriode, PlanningType, UserProfile } from '~/utils/types'
import { getMonday, addDays, formatDate, getWeekNumber, formatDateFr } from '~/utils/dates'

const route = useRoute()
const { $directus } = useNuxtApp()
const { user, isDirecteur } = useAuth()
const { getEntries, createEntry, deleteEntry } = usePlanning()
const { createBatch } = useNotifications()
const toast = useToast()

const userId = route.params.userId as string

// --- View mode ---
type ViewMode = 'week' | 'month'
const viewMode = ref<ViewMode>('week')

const weekViewRef = ref<{ weekNumber: number; weekLabel: string; previousWeek: () => void; nextWeek: () => void; goToToday: () => void } | null>(null)
const monthViewRef = ref<{ previousMonth: () => void; nextMonth: () => void; goToToday: () => void } | null>(null)

// --- Target user ---
const targetUser = ref<UserProfile | null>(null)
const entries = ref<PlanningEntry[]>([])
const loading = ref(true)
const currentMonday = ref(getMonday(new Date()))
const weekNumber = ref(getWeekNumber(new Date()))

const contractStart = computed(() => targetUser.value?.date_debut_contrat || null)
const contractEnd = computed(() => targetUser.value?.date_fin_contrat || null)

const userName = computed(() => {
  if (!targetUser.value) return ''
  const { first_name, last_name } = targetUser.value
  return [first_name, last_name].filter(Boolean).join(' ') || targetUser.value.email
})

const weekLabel = computed(() => {
  const start = currentMonday.value
  const end = addDays(start, 4)
  const s = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${s} - ${e}`
})

// --- Quick actions (admin-only, includes ferie/sans solde) ---
interface QuickAction {
  key: string
  label: string
  icon: string
  planningType: PlanningType
  motif: string | null
  requiresMotif: boolean
}

const quickActions: QuickAction[] = [
  { key: 'travail', label: 'Travail', icon: 'i-lucide-briefcase', planningType: 'travail', motif: null, requiresMotif: false },
  { key: 'teletravail', label: 'Teletravail', icon: 'i-lucide-house', planningType: 'travail', motif: 'Teletravail', requiresMotif: false },
  { key: 'conge_paye', label: 'Conge paye', icon: 'i-lucide-plane', planningType: 'conge', motif: 'Conge paye', requiresMotif: false },
  { key: 'sans_solde', label: 'Sans solde', icon: 'i-lucide-wallet', planningType: 'conge', motif: 'Sans solde', requiresMotif: false },
  { key: 'arret_maladie', label: 'Maladie', icon: 'i-lucide-heart-pulse', planningType: 'absent', motif: 'Arret maladie', requiresMotif: false },
  { key: 'ecole', label: 'Ecole', icon: 'i-lucide-graduation-cap', planningType: 'ecole', motif: null, requiresMotif: false },
  { key: 'ferie', label: 'Ferie', icon: 'i-lucide-calendar-off', planningType: 'ferie', motif: null, requiresMotif: false },
  { key: 'autre', label: 'Autre', icon: 'i-lucide-more-horizontal', planningType: 'absent', motif: null, requiresMotif: true }
]

const activeAction = ref('travail')
const currentAction = computed(() => quickActions.find(a => a.key === activeAction.value)!)

// --- Motif modal ---
const showMotifModal = ref(false)
const motifInput = ref('')
const pendingSlot = ref<{ date: string; periode: PlanningPeriode } | null>(null)

// --- Load user ---
async function loadUser() {
  try {
    const data = await $directus.request(readUser(userId, {
      fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role.name', 'categorie.nom', 'actif', 'date_debut_contrat', 'date_fin_contrat']
    }))
    targetUser.value = data as unknown as UserProfile
  } catch {
    await navigateTo('/planning')
  }
}

// --- Load entries ---
async function loadEntries(mondayStr: string) {
  loading.value = true
  currentMonday.value = new Date(mondayStr + 'T00:00:00')
  weekNumber.value = getWeekNumber(currentMonday.value)
  try {
    const friday = formatDate(addDays(new Date(mondayStr + 'T00:00:00'), 4))
    entries.value = await getEntries(userId, mondayStr, friday)
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

const currentMonthLabel = ref('')

async function loadMonthEntries(year: number, month: number) {
  loading.value = true
  currentMonthLabel.value = new Date(year, month, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  try {
    const firstDay = formatDate(new Date(year, month, 1))
    const lastDay = formatDate(new Date(year, month + 1, 0))
    entries.value = await getEntries(userId, firstDay, lastDay)
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- Navigation ---
function navigatePrev() {
  if (viewMode.value === 'week') weekViewRef.value?.previousWeek()
  else monthViewRef.value?.previousMonth()
}
function navigateNext() {
  if (viewMode.value === 'week') weekViewRef.value?.nextWeek()
  else monthViewRef.value?.nextMonth()
}
function navigateToday() {
  if (viewMode.value === 'week') weekViewRef.value?.goToToday()
  else monthViewRef.value?.goToToday()
}

// --- Admin: add entry ---
async function handleAddEntry(date: string, periode: PlanningPeriode) {
  if (!isDirecteur.value) return
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
  try {
    const entry = await createEntry({
      utilisateur: userId,
      date,
      periode,
      type,
      statut: 'valide',
      motif
    })
    entries.value.push(entry)
    await createBatch(
      [userId],
      `Votre manager a modifie votre calendrier (${formatDateFr(date + 'T00:00:00')})`,
      'planning_modifie',
      '/planning'
    )
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout', color: 'error' })
  }
}

// --- Admin: click entry ---
async function handleClickEntry(entry: PlanningEntry) {
  if (!isDirecteur.value) return
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
    } else {
      await createBatch(
        [userId],
        `Votre manager a supprime une entree de votre calendrier (${formatDateFr(entry.date + 'T00:00:00')})`,
        'planning_modifie',
        '/planning'
      )
    }
  } catch {
    toast.add({ title: 'Erreur lors de la modification', color: 'error' })
  }
}

// --- Admin: copy previous week ---
const copyLoading = ref(false)

async function handleCopyPreviousWeek() {
  if (!isDirecteur.value) return
  copyLoading.value = true
  try {
    const mondayStr = formatDate(currentMonday.value)
    const prevMonday = addDays(currentMonday.value, -7)
    const prevFriday = addDays(prevMonday, 4)
    const prevEntries = await getEntries(userId, formatDate(prevMonday), formatDate(prevFriday))

    if (!prevEntries.length) {
      toast.add({ title: 'Aucune entree la semaine precedente', color: 'warning' })
      return
    }

    for (const existing of entries.value) {
      await deleteEntry(existing.id)
    }

    let count = 0
    for (const prev of prevEntries) {
      const prevDate = new Date(prev.date + 'T12:00:00')
      const dayOfWeek = prevDate.getDay()
      const offset = dayOfWeek - 1
      const newDate = formatDate(addDays(currentMonday.value, offset))

      await createEntry({
        utilisateur: userId,
        date: newDate,
        periode: prev.periode,
        type: prev.type,
        statut: 'valide',
        motif: prev.motif || undefined,
        heures: prev.heures || undefined
      })
      count++
    }

    await loadEntries(mondayStr)
    if (count > 0) {
      toast.add({ title: `${count} entree(s) copiee(s)`, color: 'success' })
      await createBatch(
        [userId],
        `Votre manager a modifie ${count} demi-journee(s) de votre calendrier`,
        'planning_modifie',
        '/planning'
      )
    }
  } catch {
    toast.add({ title: 'Erreur lors de la copie', color: 'error' })
  } finally {
    copyLoading.value = false
  }
}

// --- Teleport ---
const teleportReady = ref(false)

onMounted(async () => {
  teleportReady.value = !!document.getElementById('page-actions')
  await loadUser()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page actions teleported into the layout tab bar -->
    <Teleport v-if="teleportReady" to="#page-actions">
      <div class="flex items-center gap-1.5">
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          to="/planning"
        />
        <UTooltip v-if="isDirecteur && viewMode === 'week'" text="Copier la semaine precedente">
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
    </Teleport>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- User name -->
      <div class="flex items-center gap-2">
        <UAvatar :alt="userName" size="xs" />
        <span class="text-sm font-semibold text-stone-700 dark:text-stone-300">{{ userName }}</span>
        <span v-if="!isDirecteur" class="text-xs text-stone-400 dark:text-stone-500">(lecture seule)</span>
      </div>

      <!-- Navigation bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-0.5">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" @click="navigatePrev" />
            <UButton label="Aujourd'hui" color="neutral" variant="soft" size="xs" @click="navigateToday" />
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" @click="navigateNext" />
          </div>
          <span v-if="viewMode === 'week'" class="text-sm font-medium text-stone-500 dark:text-stone-400">
            S{{ weekNumber }} <span class="text-stone-300 dark:text-stone-600 mx-0.5">·</span> {{ weekLabel }}
          </span>
          <span v-else class="text-sm font-medium text-stone-500 dark:text-stone-400 capitalize">
            {{ currentMonthLabel }}
          </span>
          <!-- View mode toggle -->
          <div class="flex items-center rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
            <button
              class="flex items-center justify-center size-7 transition-colors"
              :class="viewMode === 'week' ? 'bg-primary/10 text-primary' : 'text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'"
              @click="viewMode = 'week'"
            >
              <UIcon name="i-lucide-rows-3" class="size-3.5" />
            </button>
            <button
              class="flex items-center justify-center size-7 transition-colors"
              :class="viewMode === 'month' ? 'bg-primary/10 text-primary' : 'text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'"
              @click="viewMode = 'month'"
            >
              <UIcon name="i-lucide-grid-3x3" class="size-3.5" />
            </button>
          </div>
        </div>

        <!-- Quick action pills (admin only) -->
        <div v-if="isDirecteur" class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="action in quickActions"
            :key="action.key"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="activeAction === action.key
              ? 'bg-primary text-white'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'"
            @click="activeAction = action.key"
          >
            <UIcon :name="action.icon" class="size-3.5" />
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- Week view -->
      <template v-if="viewMode === 'week'">
        <PlanningWeekView
          ref="weekViewRef"
          :entries="entries"
          :readonly="!isDirecteur"
          :contract-start="contractStart"
          :contract-end="contractEnd"
          hide-nav
          @week-change="loadEntries"
          @add-entry="handleAddEntry"
          @click-entry="handleClickEntry"
        />
      </template>

      <!-- Month view -->
      <template v-else>
        <PlanningMonthView
          ref="monthViewRef"
          :entries="entries"
          :readonly="!isDirecteur"
          :contract-start="contractStart"
          :contract-end="contractEnd"
          @month-change="loadMonthEntries"
          @add-entry="handleAddEntry"
          @click-entry="handleClickEntry"
        />
      </template>
    </div>

    <!-- Motif modal (admin only) -->
    <UModal v-if="isDirecteur" :open="showMotifModal" @update:open="showMotifModal = $event">
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
  </div>
</template>
