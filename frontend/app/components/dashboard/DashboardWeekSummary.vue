<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getMonday, getWeekDays, formatDate, formatDateShortFr, addDays, getNextWorkingDay, isWeekend, isFriday, getCurrentOrNextMonday, getTodayOrNextWorkingDay } from '~/utils/dates'

const { user } = useAuth()
const { getEntries } = usePlanning()
const { planningMode } = useDashboardPreferences()

const loading = ref(true)
const entries = ref<PlanningEntry[]>([])

const now = new Date()
const isWeekendNow = isWeekend(now)

// Si weekend, on affiche la semaine prochaine
const currentMonday = getCurrentOrNextMonday(now)
const effectiveToday = getTodayOrNextWorkingDay(now)

const displayDays = computed(() => {
  if (planningMode.value === 'week') return getWeekDays(currentMonday)
  if (planningMode.value === 'today') return [effectiveToday]
  // todayNext : si vendredi -> vendredi + lundi, si weekend -> lundi + mardi
  return [effectiveToday, getNextWorkingDay(effectiveToday)]
})

const headerLabel = computed(() => {
  if (isWeekendNow) return 'Semaine prochaine'
  if (planningMode.value === 'week') return 'Ma semaine'
  if (isFriday(now)) return 'Fin de semaine'
  return 'Mon planning'
})

async function load() {
  if (!user.value) return
  loading.value = true
  try {
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

function isTodayDate(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

function isNextWorkDay(date: Date): boolean {
  if (isWeekendNow) {
    // Premier jour ouvre de la semaine prochaine
    return formatDate(date) === formatDate(effectiveToday)
  }
  return false
}

function getDisplayKey(entry: PlanningEntry | undefined): string | null {
  if (!entry) return null
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function getSlotClasses(entry: PlanningEntry | undefined) {
  if (!entry) return 'bg-[rgba(175,143,60,0.03)] text-stone-300'
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
  if (!entry) return '-'
  const key = getDisplayKey(entry)
  if (key && PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]) {
    return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES].label
  }
  return PLANNING_TYPES[entry.type]?.label || ''
}

function getDayLabel(date: Date): string {
  if (isTodayDate(date)) return 'Aujourd\'hui'
  if (isNextWorkDay(date)) return 'Lundi'
  const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' })
  return dayName.charAt(0).toUpperCase() + dayName.slice(1)
}

function getDayHighlight(date: Date): string {
  if (isTodayDate(date)) return 'text-primary font-bold'
  if (isNextWorkDay(date)) return 'text-primary'
  return 'text-stone-400'
}

// Nombre de jours remplis cette semaine
const filledCount = computed(() => {
  const weekDays = getWeekDays(currentMonday)
  let count = 0
  for (const day of weekDays) {
    const am = getEntry(day, 'matin')
    const pm = getEntry(day, 'apres_midi')
    if (am || pm) count++
  }
  return count
})

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold">{{ headerLabel }}</h3>
          <span v-if="!loading && planningMode === 'week'" class="text-[10px] text-stone-400">{{ filledCount }}/5 jours</span>
        </div>
        <UButton label="Calendrier" variant="link" size="xs" to="/planning" trailing-icon="i-lucide-arrow-right" />
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-16">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
    </div>

    <!-- Mode semaine -->
    <div v-else-if="planningMode === 'week'" class="grid grid-cols-5 gap-1">
      <div v-for="day in displayDays" :key="formatDate(day)" class="text-center">
        <p class="text-[10px] font-medium uppercase mb-1" :class="getDayHighlight(day)">
          {{ formatDateShortFr(day) }}
        </p>
        <div class="h-7 rounded text-[10px] flex items-center justify-center mb-1" :class="getSlotClasses(getEntry(day, 'matin'))">
          <UIcon v-if="getEntry(day, 'matin')" :name="getSlotIcon(getEntry(day, 'matin'))" class="size-3" />
          <span v-else>-</span>
        </div>
        <div class="h-7 rounded text-[10px] flex items-center justify-center" :class="getSlotClasses(getEntry(day, 'apres_midi'))">
          <UIcon v-if="getEntry(day, 'apres_midi')" :name="getSlotIcon(getEntry(day, 'apres_midi'))" class="size-3" />
          <span v-else>-</span>
        </div>
      </div>
    </div>

    <!-- Mode today / todayNext -->
    <div v-else class="space-y-2">
      <div v-for="day in displayDays" :key="formatDate(day)" class="flex items-center gap-3">
        <p class="text-xs font-medium w-20 shrink-0" :class="getDayHighlight(day)">
          {{ getDayLabel(day) }}
        </p>
        <div class="flex gap-1.5 flex-1">
          <div class="flex-1 h-8 rounded flex items-center justify-center gap-1 text-[11px] font-medium" :class="getSlotClasses(getEntry(day, 'matin'))">
            <UIcon v-if="getEntry(day, 'matin')" :name="getSlotIcon(getEntry(day, 'matin'))" class="size-3" />
            <span>{{ getSlotLabel(getEntry(day, 'matin')) }}</span>
          </div>
          <div class="flex-1 h-8 rounded flex items-center justify-center gap-1 text-[11px] font-medium" :class="getSlotClasses(getEntry(day, 'apres_midi'))">
            <UIcon v-if="getEntry(day, 'apres_midi')" :name="getSlotIcon(getEntry(day, 'apres_midi'))" class="size-3" />
            <span>{{ getSlotLabel(getEntry(day, 'apres_midi')) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicateur weekend -->
    <p v-if="isWeekendNow && !loading" class="text-[10px] text-stone-400 text-center mt-2 italic">Prevision pour la semaine prochaine</p>
  </UCard>
</template>
