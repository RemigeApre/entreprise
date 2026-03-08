<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getMonday, addDays, getWeekDays, getWeekNumber, formatDate, isDateInContractPeriod, getCurrentOrNextMonday, getEffectiveWorkDay } from '~/utils/dates'

const props = defineProps<{
  entries: PlanningEntry[]
  readonly?: boolean
  contractStart?: string | null
  contractEnd?: string | null
  selectedSlots?: Set<string>
  hideNav?: boolean
}>()

const emit = defineEmits<{
  addEntry: [date: string, periode: 'matin' | 'apres_midi']
  clickEntry: [entry: PlanningEntry]
  weekChange: [monday: string]
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

defineExpose({ weekNumber, weekLabel, previousWeek, nextWeek, goToToday })

// --- Time grid config ---
// Full display range: 7h-19h (12 hours)
// Normal zone: 8h-18h
// Legal work: matin 8h30-12h, après-midi 14h-17h30
// Lunch: 12h-14h
const START_HOUR = 7
const END_HOUR = 19
const TOTAL_HOURS = END_HOUR - START_HOUR // 12
const HOUR_HEIGHT = 40 // px per hour
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT // 480px

const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

function hourToY(hour: number): number {
  return (hour - START_HOUR) * HOUR_HEIGHT
}

// Zone definitions (y positions in px)
const zones = {
  greyTop: { top: 0, height: hourToY(8) },                          // 7h-8h
  bufferMorning: { top: hourToY(8), height: hourToY(8.5) - hourToY(8) },  // 8h-8h30
  matin: { top: hourToY(8.5), height: hourToY(12) - hourToY(8.5) },       // 8h30-12h
  lunch: { top: hourToY(12), height: hourToY(14) - hourToY(12) },         // 12h-14h
  apresMidi: { top: hourToY(14), height: hourToY(17.5) - hourToY(14) },   // 14h-17h30
  bufferEvening: { top: hourToY(17.5), height: hourToY(18) - hourToY(17.5) }, // 17h30-18h
  greyBottom: { top: hourToY(18), height: TOTAL_HEIGHT - hourToY(18) }     // 18h-19h
}

// --- Ferie + effective day ---
const ferieDates = computed(() => {
  const dates = new Set<string>()
  const grouped = new Map<string, number>()
  for (const e of props.entries) {
    if (e.type === 'ferie') {
      grouped.set(e.date, (grouped.get(e.date) || 0) + 1)
    }
  }
  for (const [date, count] of grouped) {
    if (count >= 2) dates.add(date)
  }
  return dates
})

const effectiveDay = computed(() => formatDate(getEffectiveWorkDay(new Date(), ferieDates.value)))

function isHighlightedDay(date: Date): boolean {
  return formatDate(date) === effectiveDay.value
}

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
  const effective = getEffectiveWorkDay(new Date(), ferieDates.value)
  currentMonday.value = getMonday(effective)
  emit('weekChange', formatDate(currentMonday.value))
}

// --- Entries ---
function getEntry(date: Date, periode: 'matin' | 'apres_midi') {
  const dateStr = formatDate(date)
  return props.entries.find(e => e.date === dateStr && e.periode === periode)
}

function getSlotDisabled(date: Date): boolean {
  const dateStr = formatDate(date)
  return !isDateInContractPeriod(dateStr, props.contractStart, props.contractEnd).valid
}

function isSlotSelected(date: Date, periode: 'matin' | 'apres_midi'): boolean {
  return props.selectedSlots?.has(`${formatDate(date)}_${periode}`) ?? false
}

function handleBlockClick(date: Date, periode: 'matin' | 'apres_midi') {
  if (getSlotDisabled(date)) return
  const entry = getEntry(date, periode)
  if (entry) {
    emit('clickEntry', entry)
  } else if (!props.readonly) {
    emit('addEntry', formatDate(date), periode)
  }
}

// --- Display helpers ---
function getDisplayKey(entry: PlanningEntry) {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function getBlockClasses(entry: PlanningEntry | undefined, date: Date, periode: 'matin' | 'apres_midi') {
  const selected = isSlotSelected(date, periode)
  const selRing = selected ? ' ring-2 ring-primary ring-offset-1 dark:ring-offset-stone-900' : ''

  if (getSlotDisabled(date)) {
    return 'bg-stone-100/50 dark:bg-stone-800/30 border-dashed border border-stone-200 dark:border-stone-700 cursor-not-allowed' + selRing
  }

  if (!entry) {
    if (props.readonly) return 'border border-dashed border-stone-200 dark:border-stone-700/50' + selRing
    return 'border border-dashed border-stone-200 dark:border-stone-700/50 hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer hover:bg-amber-50/30 dark:hover:bg-amber-950/20 group' + selRing
  }

  const key = getDisplayKey(entry)
  const c = PLANNING_COLORS[key] || PLANNING_COLORS[entry.type]
  if (!c) return 'bg-stone-100 dark:bg-stone-800' + selRing

  const pending = entry.statut === 'en_attente'
  return `${c.bg} ${c.border} ${c.text} border ${pending ? 'border-dashed opacity-70' : 'border-solid'} cursor-pointer` + selRing
}

function getBlockLabel(entry: PlanningEntry) {
  const key = getDisplayKey(entry)
  if (key === 'teletravail') return 'Teletravail'
  return entry.motif || PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]?.label || entry.type
}

function getBlockIcon(entry: PlanningEntry) {
  const key = getDisplayKey(entry)
  return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]?.icon || ''
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function getDayNumber(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Current time indicator
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const currentTimeY = computed(() => {
  const h = now.value.getHours() + now.value.getMinutes() / 60
  if (h < START_HOUR || h > END_HOUR) return null
  return hourToY(h)
})

const isCurrentWeek = computed(() => {
  const todayMonday = getMonday(new Date())
  return formatDate(todayMonday) === formatDate(currentMonday.value)
})

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
  timer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div>
    <!-- Navigation -->
    <div v-if="!hideNav" class="flex items-center mb-4">
      <div class="flex items-center gap-1">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" @click="previousWeek" />
        <UButton label="Aujourd'hui" color="neutral" variant="soft" size="xs" @click="goToToday" />
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" @click="nextWeek" />
      </div>
    </div>

    <!-- Timetable grid -->
    <div class="grid grid-cols-[48px_1fr_1fr_1fr_1fr_1fr] gap-x-0">
      <!-- Header: empty + day names -->
      <div />
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="text-center pb-2 border-l border-stone-200/60 dark:border-stone-700/40"
      >
        <p
          class="text-[11px] font-medium uppercase"
          :class="isHighlightedDay(day) ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ getDayName(day) }}
        </p>
        <p
          class="text-xs"
          :class="isHighlightedDay(day) ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-stone-400 dark:text-stone-500'"
        >
          {{ getDayNumber(day) }}
        </p>
      </div>

      <!-- Time grid body -->
      <div class="relative" :style="{ height: TOTAL_HEIGHT + 'px' }">
        <!-- Hour labels -->
        <div
          v-for="h in hours"
          :key="h"
          class="absolute left-0 right-0 flex items-start"
          :style="{ top: hourToY(h) + 'px' }"
        >
          <span class="text-[10px] text-stone-400 dark:text-stone-500 -mt-1.5 pr-2 w-full text-right select-none">
            {{ h }}h
          </span>
        </div>
      </div>

      <!-- Day columns -->
      <div
        v-for="day in weekDays"
        :key="'col-' + formatDate(day)"
        class="relative border-l border-stone-200/60 dark:border-stone-700/40"
        :style="{ height: TOTAL_HEIGHT + 'px' }"
      >
        <!-- Highlighted day background -->
        <div
          v-if="isHighlightedDay(day)"
          class="absolute inset-0 bg-amber-50/40 dark:bg-amber-950/15"
        />

        <!-- Grey zones (before 8h, after 18h) -->
        <div
          class="absolute inset-x-0 bg-stone-100/70 dark:bg-stone-800/40"
          :style="{ top: zones.greyTop.top + 'px', height: zones.greyTop.height + 'px' }"
        />
        <div
          class="absolute inset-x-0 bg-stone-100/70 dark:bg-stone-800/40"
          :style="{ top: zones.greyBottom.top + 'px', height: zones.greyBottom.height + 'px' }"
        />

        <!-- Lunch zone -->
        <div
          class="absolute inset-x-0 bg-stone-50/80 dark:bg-stone-800/25"
          :style="{ top: zones.lunch.top + 'px', height: zones.lunch.height + 'px' }"
        >
          <span class="absolute inset-0 flex items-center justify-center text-[10px] text-stone-300 dark:text-stone-600 select-none">
            Pause
          </span>
        </div>

        <!-- Hour grid lines -->
        <template v-for="h in hours" :key="'line-' + h">
          <div
            class="absolute inset-x-0 border-t"
            :class="h === 8 || h === 18
              ? 'border-stone-300/60 dark:border-stone-600/40'
              : 'border-stone-200/40 dark:border-stone-700/30'"
            :style="{ top: hourToY(h) + 'px' }"
          />
        </template>

        <!-- Legal time markers (8h30, 12h, 14h, 17h30) -->
        <div
          class="absolute inset-x-0 border-t border-dashed border-amber-300/40 dark:border-amber-700/30"
          :style="{ top: hourToY(8.5) + 'px' }"
        />
        <div
          class="absolute inset-x-0 border-t border-dashed border-amber-300/40 dark:border-amber-700/30"
          :style="{ top: hourToY(17.5) + 'px' }"
        />

        <!-- Matin entry block (8h30-12h) -->
        <button
          class="absolute inset-x-1 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 text-xs font-medium"
          :class="getBlockClasses(getEntry(day, 'matin'), day, 'matin')"
          :style="{ top: zones.matin.top + 1 + 'px', height: zones.matin.height - 2 + 'px' }"
          :disabled="readonly && !getEntry(day, 'matin')"
          @click="handleBlockClick(day, 'matin')"
        >
          <template v-if="getEntry(day, 'matin')">
            <UIcon v-if="getBlockIcon(getEntry(day, 'matin')!)" :name="getBlockIcon(getEntry(day, 'matin')!)" class="size-4 shrink-0" />
            <span class="truncate max-w-full px-1 text-[11px]">{{ getBlockLabel(getEntry(day, 'matin')!) }}</span>
            <span class="text-[9px] opacity-60">8h30 - 12h</span>
          </template>
          <template v-else-if="!readonly && !getSlotDisabled(day)">
            <UIcon name="i-lucide-plus" class="size-3.5 text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </template>
        </button>

        <!-- Apres-midi entry block (14h-17h30) -->
        <button
          class="absolute inset-x-1 rounded-md transition-all flex flex-col items-center justify-center gap-0.5 text-xs font-medium"
          :class="getBlockClasses(getEntry(day, 'apres_midi'), day, 'apres_midi')"
          :style="{ top: zones.apresMidi.top + 1 + 'px', height: zones.apresMidi.height - 2 + 'px' }"
          :disabled="readonly && !getEntry(day, 'apres_midi')"
          @click="handleBlockClick(day, 'apres_midi')"
        >
          <template v-if="getEntry(day, 'apres_midi')">
            <UIcon v-if="getBlockIcon(getEntry(day, 'apres_midi')!)" :name="getBlockIcon(getEntry(day, 'apres_midi')!)" class="size-4 shrink-0" />
            <span class="truncate max-w-full px-1 text-[11px]">{{ getBlockLabel(getEntry(day, 'apres_midi')!) }}</span>
            <span class="text-[9px] opacity-60">14h - 17h30</span>
          </template>
          <template v-else-if="!readonly && !getSlotDisabled(day)">
            <UIcon name="i-lucide-plus" class="size-3.5 text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </template>
        </button>

        <!-- Current time indicator -->
        <div
          v-if="isCurrentWeek && isHighlightedDay(day) && currentTimeY !== null"
          class="absolute inset-x-0 z-10 pointer-events-none"
          :style="{ top: currentTimeY + 'px' }"
        >
          <div class="relative">
            <div class="absolute -left-1 -top-1 size-2 rounded-full bg-red-500" />
            <div class="h-px bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
