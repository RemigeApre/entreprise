<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getMonday, getWeekDays, formatDate, formatDateShortFr, formatDateFr, addDays, getNextWorkingDay } from '~/utils/dates'

const { user } = useAuth()
const { getEntries } = usePlanning()
const { planningMode } = useDashboardPreferences()

const loading = ref(true)
const entries = ref<PlanningEntry[]>([])

const today = new Date()
const currentMonday = getMonday(today)

// Jours a afficher selon le mode
const displayDays = computed(() => {
  if (planningMode.value === 'week') {
    return getWeekDays(currentMonday)
  }
  if (planningMode.value === 'today') {
    return [today]
  }
  // todayNext
  return [today, getNextWorkingDay(today)]
})

const headerLabel = computed(() => {
  if (planningMode.value === 'week') return 'Ma semaine'
  if (planningMode.value === 'today') return 'Mon planning'
  return 'Mon planning'
})

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    // Toujours charger la semaine entiere (on filtre cote client)
    const friday = addDays(currentMonday, 4)
    entries.value = await getEntries(user.value.id, formatDate(currentMonday), formatDate(friday))
  } finally {
    loading.value = false
  }
}

function getEntry(date: Date, periode: 'matin' | 'apres_midi') {
  const dateStr = formatDate(date)
  return entries.value.find(e => e.date === dateStr && e.periode === periode)
}

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

function getDisplayKey(entry: PlanningEntry | undefined): string | null {
  if (!entry) return null
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function getSlotClasses(entry: PlanningEntry | undefined) {
  if (!entry) return 'bg-stone-50 dark:bg-stone-800/30 text-stone-300 dark:text-stone-600'
  const key = getDisplayKey(entry)
  const c = key ? PLANNING_COLORS[key] : PLANNING_COLORS[entry.type]
  return c ? `${c.bg} ${c.text}` : ''
}

function getSlotIcon(entry: PlanningEntry | undefined): string {
  if (!entry) return ''
  const key = getDisplayKey(entry)
  if (key && PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]) {
    return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES].icon
  }
  return PLANNING_TYPES[entry.type]?.icon || ''
}

function getSlotLabel(entry: PlanningEntry | undefined): string {
  if (!entry) return 'Non renseigne'
  const key = getDisplayKey(entry)
  if (key && PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]) {
    return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES].label
  }
  return PLANNING_TYPES[entry.type]?.label || ''
}

// Format jour pour les modes compact
function getDayLabel(date: Date): string {
  if (isToday(date)) return 'Aujourd\'hui'
  // Check si c'est demain ou lundi prochain, etc.
  const tomorrow = getNextWorkingDay(new Date())
  if (formatDate(date) === formatDate(tomorrow)) {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
    return dayName.charAt(0).toUpperCase() + dayName.slice(1)
  }
  return formatDateShortFr(date)
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">{{ headerLabel }}</h3>
        <UButton
          label="Voir le calendrier"
          variant="link"
          size="xs"
          to="/planning"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <!-- Mode semaine : grille 5 colonnes -->
    <div v-else-if="planningMode === 'week'" class="grid grid-cols-5 gap-2">
      <div
        v-for="day in displayDays"
        :key="formatDate(day)"
        class="text-center"
      >
        <p
          class="text-[11px] font-medium uppercase mb-1.5"
          :class="isToday(day) ? 'text-primary font-bold' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ formatDateShortFr(day) }}
        </p>
        <!-- AM -->
        <div
          class="h-7 rounded-md text-[10px] flex items-center justify-center mb-1 font-medium"
          :class="getSlotClasses(getEntry(day, 'matin'))"
        >
          <UIcon
            v-if="getEntry(day, 'matin')"
            :name="getSlotIcon(getEntry(day, 'matin'))"
            class="size-3.5"
          />
          <span v-else class="text-[10px]">-</span>
        </div>
        <!-- PM -->
        <div
          class="h-7 rounded-md text-[10px] flex items-center justify-center font-medium"
          :class="getSlotClasses(getEntry(day, 'apres_midi'))"
        >
          <UIcon
            v-if="getEntry(day, 'apres_midi')"
            :name="getSlotIcon(getEntry(day, 'apres_midi'))"
            class="size-3.5"
          />
          <span v-else class="text-[10px]">-</span>
        </div>
      </div>
    </div>

    <!-- Mode today / todayNext : affichage compact horizontal -->
    <div v-else class="space-y-3">
      <div
        v-for="day in displayDays"
        :key="formatDate(day)"
        class="flex items-center gap-3"
      >
        <p
          class="text-xs font-medium w-24 shrink-0"
          :class="isToday(day) ? 'text-primary font-bold' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ getDayLabel(day) }}
        </p>
        <div class="flex gap-2 flex-1">
          <!-- Matin -->
          <div
            class="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium"
            :class="getSlotClasses(getEntry(day, 'matin'))"
          >
            <UIcon
              v-if="getEntry(day, 'matin')"
              :name="getSlotIcon(getEntry(day, 'matin'))"
              class="size-3.5"
            />
            <span>{{ getEntry(day, 'matin') ? getSlotLabel(getEntry(day, 'matin')) : '-' }}</span>
          </div>
          <!-- Apres-midi -->
          <div
            class="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium"
            :class="getSlotClasses(getEntry(day, 'apres_midi'))"
          >
            <UIcon
              v-if="getEntry(day, 'apres_midi')"
              :name="getSlotIcon(getEntry(day, 'apres_midi'))"
              class="size-3.5"
            />
            <span>{{ getEntry(day, 'apres_midi') ? getSlotLabel(getEntry(day, 'apres_midi')) : '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
