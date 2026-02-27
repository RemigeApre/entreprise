<script setup lang="ts">
import type { ScheduleEntry, ScheduleCategorie } from '~/utils/types'
import { getMonday, addDays, getWeekDays, getWeekNumber, formatDate } from '~/utils/dates'
import { SCHEDULE_COLORS, SCHEDULE_CATEGORIES } from '~/utils/constants'

const props = defineProps<{
  entries: ScheduleEntry[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  weekChange: [monday: string]
  addEntry: [date: string, heure: string]
  clickEntry: [entry: ScheduleEntry]
}>()

const currentMonday = ref(getMonday(new Date()))
const weekDays = computed(() => getWeekDays(currentMonday.value))
const weekNumber = computed(() => getWeekNumber(currentMonday.value))

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[4]
  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} - ${endStr}`
})

function previousWeek() {
  currentMonday.value = addDays(currentMonday.value, -7)
  emit('weekChange', formatDate(currentMonday.value))
}

function nextWeek() {
  currentMonday.value = addDays(currentMonday.value, 7)
  emit('weekChange', formatDate(currentMonday.value))
}

function goToToday() {
  currentMonday.value = getMonday(new Date())
  emit('weekChange', formatDate(currentMonday.value))
}

defineExpose({ weekNumber, weekLabel, previousWeek, nextWeek, goToToday })

// Time grid: 8h to 20h, each row = 1 hour
const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8, 9, 10, ..., 20
const HOUR_HEIGHT = 60 // px per hour
const START_HOUR = 8
const END_HOUR = 20

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function getDayNumber(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Get entries for a specific day
function getEntriesForDay(date: Date): ScheduleEntry[] {
  const dateStr = formatDate(date)
  return props.entries.filter(e => e.date === dateStr)
}

// Calculate position and height of an entry
function getEntryStyle(entry: ScheduleEntry): Record<string, string> {
  const [sh, sm] = entry.heure_debut.split(':').map(Number)
  const [eh, em] = entry.heure_fin.split(':').map(Number)
  const startMinutes = (sh - START_HOUR) * 60 + sm
  const endMinutes = (eh - START_HOUR) * 60 + em
  const top = (startMinutes / 60) * HOUR_HEIGHT
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20)
  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

function getEntryColors(entry: ScheduleEntry) {
  return SCHEDULE_COLORS[entry.categorie] || SCHEDULE_COLORS.autre
}

function formatTime(time: string): string {
  return time.substring(0, 5)
}

// Click on empty area to add entry
function handleGridClick(day: Date, event: MouseEvent) {
  if (props.readonly) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = event.clientY - rect.top
  const minutesFromStart = (y / HOUR_HEIGHT) * 60
  const totalMinutes = START_HOUR * 60 + minutesFromStart
  // Snap to 15-minute intervals
  const snapped = Math.round(totalMinutes / 15) * 15
  const h = Math.floor(snapped / 60)
  const m = snapped % 60
  if (h >= START_HOUR && h < END_HOUR) {
    emit('addEntry', formatDate(day), `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

// Current time indicator
const now = ref(new Date())
let interval: ReturnType<typeof setInterval> | null = null

const currentTimeTop = computed(() => {
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  if (h < START_HOUR || h >= END_HOUR) return null
  const minutes = (h - START_HOUR) * 60 + m
  return (minutes / 60) * HOUR_HEIGHT
})

const todayIndex = computed(() => {
  const todayStr = formatDate(new Date())
  return weekDays.value.findIndex(d => formatDate(d) === todayStr)
})

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
  interval = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="overflow-x-auto">
    <!-- Header: day names -->
    <div class="grid grid-cols-[56px_repeat(5,1fr)] gap-px bg-stone-200 dark:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-t-lg overflow-hidden">
      <div class="bg-white dark:bg-stone-950 p-1.5" />
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="bg-white dark:bg-stone-950 text-center py-1.5 px-1"
      >
        <p
          class="text-[11px] font-medium uppercase"
          :class="isToday(day) ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ getDayName(day) }}
        </p>
        <p
          class="text-xs"
          :class="isToday(day) ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-stone-400 dark:text-stone-500'"
        >
          {{ getDayNumber(day) }}
        </p>
      </div>
    </div>

    <!-- Time grid -->
    <div
      class="grid grid-cols-[56px_repeat(5,1fr)] gap-px bg-stone-200 dark:bg-stone-700 border-x border-b border-stone-200 dark:border-stone-700 rounded-b-lg overflow-hidden"
    >
      <!-- Hours column + day columns -->
      <div class="bg-white dark:bg-stone-950 relative" :style="{ height: `${hours.length * HOUR_HEIGHT}px` }">
        <div
          v-for="hour in hours"
          :key="hour"
          class="absolute left-0 right-0 flex items-start justify-end pr-2"
          :style="{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }"
        >
          <span class="text-[10px] text-stone-400 dark:text-stone-500 -mt-1.5">{{ hour }}h</span>
        </div>
      </div>

      <!-- Day columns -->
      <div
        v-for="(day, dayIdx) in weekDays"
        :key="'col-' + formatDate(day)"
        class="bg-white dark:bg-stone-950 relative"
        :style="{ height: `${hours.length * HOUR_HEIGHT}px` }"
        @click="handleGridClick(day, $event)"
      >
        <!-- Hour lines -->
        <div
          v-for="hour in hours"
          :key="'line-' + hour"
          class="absolute left-0 right-0 border-t border-stone-100 dark:border-stone-800/50"
          :style="{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }"
        />
        <!-- Half-hour lines -->
        <div
          v-for="hour in hours.slice(0, -1)"
          :key="'half-' + hour"
          class="absolute left-0 right-0 border-t border-dashed border-stone-100/60 dark:border-stone-800/30"
          :style="{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }"
        />

        <!-- Current time indicator -->
        <div
          v-if="dayIdx === todayIndex && currentTimeTop !== null"
          class="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
          :style="{ top: `${currentTimeTop}px` }"
        >
          <span class="size-2 rounded-full bg-red-500 -ml-1 shrink-0" />
          <div class="flex-1 h-px bg-red-500" />
        </div>

        <!-- Entries -->
        <button
          v-for="entry in getEntriesForDay(day)"
          :key="entry.id"
          class="absolute left-0.5 right-0.5 z-10 rounded-md border-l-3 px-1.5 py-0.5 overflow-hidden text-left transition-opacity hover:opacity-90 cursor-pointer"
          :class="[getEntryColors(entry).bg, getEntryColors(entry).text, getEntryColors(entry).border]"
          :style="getEntryStyle(entry)"
          @click.stop="emit('clickEntry', entry)"
        >
          <p class="text-[10px] font-semibold truncate leading-tight">{{ entry.titre }}</p>
          <p class="text-[9px] opacity-70 leading-tight">{{ formatTime(entry.heure_debut) }} - {{ formatTime(entry.heure_fin) }}</p>
        </button>
      </div>
    </div>
  </div>
</template>
