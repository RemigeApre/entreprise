<script setup lang="ts">
import type { ScheduleEntry } from '~/utils/types'
import { getMonday, addDays, getWeekDays, getWeekNumber, formatDate, getCurrentOrNextMonday, getEffectiveWorkDay } from '~/utils/dates'
import { SCHEDULE_COLORS } from '~/utils/constants'

const props = defineProps<{
  entries: ScheduleEntry[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  weekChange: [monday: string]
  addEntry: [date: string, heure: string]
  clickEntry: [entry: ScheduleEntry]
}>()

const currentMonday = ref(getCurrentOrNextMonday(new Date()))
const weekDays = computed(() => getWeekDays(currentMonday.value))
const weekNumber = computed(() => getWeekNumber(currentMonday.value))

const weekLabel = computed(() => {
  const start = weekDays.value[0]
  const end = weekDays.value[4]
  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} - ${endStr}`
})

// --- Grid config ---
const START_HOUR = 7
const END_HOUR = 20
const HOUR_HEIGHT = 60
const HALF_HOUR = HOUR_HEIGHT / 2
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT
const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

// Work zone boundaries
const WORK_START_Y = (8 - START_HOUR) * HOUR_HEIGHT
const WORK_END_Y = (18 - START_HOUR) * HOUR_HEIGHT
const LUNCH_START_Y = (12 - START_HOUR) * HOUR_HEIGHT
const LUNCH_END_Y = (14 - START_HOUR) * HOUR_HEIGHT
const LEGAL_PM_END_Y = (17.5 - START_HOUR) * HOUR_HEIGHT

function hourToY(h: number, m: number = 0): number {
  return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
}

// --- Effective day ---
const effectiveDay = computed(() => formatDate(getEffectiveWorkDay(new Date())))

function isHighlightedDay(date: Date): boolean {
  return formatDate(date) === effectiveDay.value
}

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

const isCurrentWeek = computed(() => {
  const todayMonday = getMonday(new Date())
  return formatDate(todayMonday) === formatDate(currentMonday.value)
})

// --- Navigation ---
function previousWeek() {
  currentMonday.value = addDays(currentMonday.value, -7)
  emit('weekChange', formatDate(currentMonday.value))
}

function nextWeek() {
  currentMonday.value = addDays(currentMonday.value, 7)
  emit('weekChange', formatDate(currentMonday.value))
}

function goToToday() {
  const effective = getEffectiveWorkDay(new Date())
  currentMonday.value = getMonday(effective)
  emit('weekChange', formatDate(currentMonday.value))
}

defineExpose({ weekNumber, weekLabel, previousWeek, nextWeek, goToToday })

// --- Display ---
function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long' })
}

function getDayNumber(date: Date): number {
  return date.getDate()
}

function getDayMonth(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short' })
}

function getEntriesForDay(date: Date): ScheduleEntry[] {
  const dateStr = formatDate(date)
  return props.entries.filter(e => e.date === dateStr)
}

function getEntryStyle(entry: ScheduleEntry): Record<string, string> {
  const [sh, sm] = entry.heure_debut.split(':').map(Number)
  const [eh, em] = entry.heure_fin.split(':').map(Number)
  const top = hourToY(sh, sm)
  const bottom = hourToY(eh, em)
  const height = Math.max(bottom - top, 24)
  return { top: `${top}px`, height: `${height}px` }
}

function getEntryColors(entry: ScheduleEntry) {
  return SCHEDULE_COLORS[entry.categorie] || SCHEDULE_COLORS.autre
}

function formatTime(time: string): string {
  return time.substring(0, 5)
}

function handleGridClick(day: Date, event: MouseEvent) {
  if (props.readonly) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = event.clientY - rect.top
  const minutesFromStart = (y / HOUR_HEIGHT) * 60
  const totalMinutes = START_HOUR * 60 + minutesFromStart
  const snapped = Math.round(totalMinutes / 15) * 15
  const h = Math.floor(snapped / 60)
  const m = snapped % 60
  if (h >= START_HOUR && h < END_HOUR) {
    emit('addEntry', formatDate(day), `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
}

// --- Live time ---
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const currentTimeY = computed(() => {
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  const y = hourToY(h, m)
  if (y < 0 || y > TOTAL_HEIGHT) return null
  return y
})

// Auto-scroll to ~8h on mount
const gridRef = ref<HTMLElement | null>(null)

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
  timer = setInterval(() => { now.value = new Date() }, 30000)
  nextTick(() => {
    if (gridRef.value) {
      gridRef.value.scrollTop = WORK_START_Y - 12
    }
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- Fixed header -->
    <div class="grid grid-cols-[56px_repeat(5,1fr)] border-b border-stone-200 dark:border-stone-700 shrink-0">
      <div class="py-2.5" />
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="py-2.5 text-center border-l border-stone-200/60 dark:border-stone-700/40"
        :class="isHighlightedDay(day) ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''"
      >
        <p
          class="text-xs font-medium uppercase tracking-wide"
          :class="isHighlightedDay(day) ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'"
        >
          {{ getDayName(day) }}
        </p>
        <div class="flex items-center justify-center gap-1 mt-1">
          <span
            class="inline-flex items-center justify-center rounded-full text-sm font-bold leading-none"
            :class="isHighlightedDay(day)
              ? 'size-7 bg-amber-500 text-white'
              : 'text-stone-700 dark:text-stone-300'"
          >
            {{ getDayNumber(day) }}
          </span>
          <span
            v-if="!isHighlightedDay(day)"
            class="text-[11px] text-stone-400 dark:text-stone-500"
          >
            {{ getDayMonth(day) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Scrollable grid (only this part scrolls) -->
    <div ref="gridRef" class="flex-1 overflow-y-auto min-h-0">
      <div class="grid grid-cols-[56px_repeat(5,1fr)] relative" :style="{ height: TOTAL_HEIGHT + 'px' }">
        <!-- Hour labels -->
        <div class="relative">
          <div
            v-for="h in hours"
            :key="h"
            class="absolute right-0 left-0"
            :style="{ top: hourToY(h) + 'px', height: HOUR_HEIGHT + 'px' }"
          >
            <span
              class="absolute -top-2.5 right-2 text-[11px] font-medium select-none"
              :class="(h >= 8 && h <= 18) ? 'text-stone-500 dark:text-stone-400' : 'text-stone-300 dark:text-stone-600'"
            >
              {{ String(h).padStart(2, '0') }}:00
            </span>
            <span
              class="absolute right-2 text-[10px] text-stone-300 dark:text-stone-600 select-none"
              :style="{ top: HALF_HOUR - 6 + 'px' }"
            >
              {{ String(h).padStart(2, '0') }}:30
            </span>
          </div>
        </div>

        <!-- Day columns -->
        <div
          v-for="day in weekDays"
          :key="'col-' + formatDate(day)"
          class="relative border-l border-stone-200/60 dark:border-stone-700/40"
          @click="handleGridClick(day, $event)"
        >
          <!-- Grey zone: before 8h -->
          <div
            class="absolute inset-x-0 top-0 bg-stone-100/60 dark:bg-stone-800/30"
            :style="{ height: WORK_START_Y + 'px' }"
          />
          <!-- Grey zone: after 18h -->
          <div
            class="absolute inset-x-0 bg-stone-100/60 dark:bg-stone-800/30"
            :style="{ top: WORK_END_Y + 'px', bottom: '0' }"
          />

          <!-- Highlighted day bg -->
          <div
            v-if="isHighlightedDay(day)"
            class="absolute inset-x-0 bg-amber-50/50 dark:bg-amber-950/15"
            :style="{ top: WORK_START_Y + 'px', height: (WORK_END_Y - WORK_START_Y) + 'px' }"
          />

          <!-- Lunch zone -->
          <div
            class="absolute inset-x-0"
            :style="{ top: LUNCH_START_Y + 'px', height: (LUNCH_END_Y - LUNCH_START_Y) + 'px' }"
          >
            <div class="absolute inset-0 bg-stone-50/60 dark:bg-stone-800/20" />
            <div class="absolute inset-x-0 top-0 border-t border-dashed border-stone-300/50 dark:border-stone-600/30" />
            <div class="absolute inset-x-0 bottom-0 border-t border-dashed border-stone-300/50 dark:border-stone-600/30" />
            <span class="absolute inset-0 flex items-center justify-center text-[10px] text-stone-300 dark:text-stone-600 select-none tracking-wider uppercase">
              Pause
            </span>
          </div>

          <!-- Hour lines -->
          <template v-for="h in hours" :key="'line-' + h">
            <div
              class="absolute inset-x-0 border-t"
              :class="h === 8 || h === 18
                ? 'border-stone-300/80 dark:border-stone-600/50'
                : h >= 8 && h < 18
                  ? 'border-stone-200/60 dark:border-stone-700/30'
                  : 'border-stone-200/30 dark:border-stone-700/20'"
              :style="{ top: hourToY(h) + 'px' }"
            />
            <div
              class="absolute inset-x-0 border-t border-dotted border-stone-200/30 dark:border-stone-700/15"
              :style="{ top: hourToY(h, 30) + 'px' }"
            />
          </template>

          <!-- Legal time marker: 17h30 only -->
          <div
            class="absolute inset-x-0 border-t-2 border-dashed border-amber-400/30 dark:border-amber-600/25"
            :style="{ top: LEGAL_PM_END_Y + 'px' }"
          />
          <span
            class="absolute right-1 text-[9px] font-medium text-amber-500/60 dark:text-amber-500/40 select-none z-[1]"
            :style="{ top: LEGAL_PM_END_Y - 13 + 'px' }"
          >17h30</span>

          <!-- Current time red line -->
          <template v-if="isCurrentWeek && isToday(day) && currentTimeY !== null">
            <div
              class="absolute inset-x-0 z-20 pointer-events-none"
              :style="{ top: currentTimeY + 'px' }"
            >
              <div class="relative h-0">
                <div class="absolute -left-[5px] -top-[5px] size-[11px] rounded-full bg-red-500 shadow-sm" />
                <div class="absolute left-0 right-0 h-[2px] bg-red-500 shadow-sm" />
              </div>
            </div>
          </template>

          <!-- Entries -->
          <button
            v-for="entry in getEntriesForDay(day)"
            :key="entry.id"
            class="absolute left-1 right-1 z-10 rounded-lg border-l-[3px] px-2.5 py-1 overflow-hidden text-left transition-opacity hover:opacity-90 cursor-pointer"
            :class="[getEntryColors(entry).bg, getEntryColors(entry).text, getEntryColors(entry).border]"
            :style="getEntryStyle(entry)"
            @click.stop="emit('clickEntry', entry)"
          >
            <p class="text-xs font-semibold truncate leading-tight">{{ entry.titre }}</p>
            <p class="text-[10px] opacity-60 leading-tight mt-0.5">{{ formatTime(entry.heure_debut) }} — {{ formatTime(entry.heure_fin) }}</p>
          </button>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 border-t border-stone-200/60 dark:border-stone-700/40 shrink-0">
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-1 border-t-2 border-dashed border-amber-400/60" />
        <span class="text-[10px] text-stone-400 dark:text-stone-500">Horaires legaux (7h/jour)</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block w-3 h-[2px] bg-red-500 rounded" />
        <span class="text-[10px] text-stone-400 dark:text-stone-500">Heure actuelle</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block size-3 rounded bg-stone-100 dark:bg-stone-800/40" />
        <span class="text-[10px] text-stone-400 dark:text-stone-500">Hors horaires</span>
      </div>
    </div>
  </div>
</template>
