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

// --- Grid constants ---
const START_HOUR = 7
const END_HOUR = 20
const HOUR_HEIGHT = 48 // px per hour
const HALF_HOUR = HOUR_HEIGHT / 2

// Generate hour labels 7h -> 19h
const hourLabels = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

function hourToY(h: number, m: number = 0): number {
  return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT
}

// Work zone boundaries (px)
const WORK_START = hourToY(8, 0)
const WORK_END = hourToY(18, 0)
const LEGAL_AM_START = hourToY(8, 30)
const LEGAL_AM_END = hourToY(12, 0)
const LUNCH_START = hourToY(12, 0)
const LUNCH_END = hourToY(14, 0)
const LEGAL_PM_START = hourToY(14, 0)
const LEGAL_PM_END = hourToY(17, 30)
const GRID_HEIGHT = hourToY(END_HOUR, 0)

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

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

// --- Current week check ---
const isCurrentWeek = computed(() => {
  const todayMonday = getMonday(new Date())
  return formatDate(todayMonday) === formatDate(currentMonday.value)
})

// --- Live time ---
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const currentTimeY = computed(() => {
  const h = now.value.getHours()
  const m = now.value.getMinutes()
  const y = hourToY(h, m)
  if (y < 0 || y > GRID_HEIGHT) return null
  return y
})

// --- Mobile: single day view ---
const mobileDay = ref(0)

function initMobileDay() {
  const idx = weekDays.value.findIndex(d => isHighlightedDay(d))
  mobileDay.value = idx >= 0 ? idx : 0
}

const mobileDayDate = computed(() => weekDays.value[mobileDay.value])

// --- Navigation ---
function previousWeek() {
  currentMonday.value = addDays(currentMonday.value, -7)
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
}

function nextWeek() {
  currentMonday.value = addDays(currentMonday.value, 7)
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
}

function goToToday() {
  const effective = getEffectiveWorkDay(new Date(), ferieDates.value)
  currentMonday.value = getMonday(effective)
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
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

// --- Display ---
function getDisplayKey(entry: PlanningEntry) {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
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

function getBlockBg(entry: PlanningEntry) {
  const key = getDisplayKey(entry)
  const c = PLANNING_COLORS[key] || PLANNING_COLORS[entry.type]
  return c ? `${c.bg} ${c.border} ${c.text}` : 'bg-stone-100 border-stone-300 text-stone-600'
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long' })
}

function getDayShortName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
}

function getDayNumber(date: Date): string {
  return date.getDate().toString()
}

function getDayMonth(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short' })
}

// Scroll to ~8h on mount
const gridRef = ref<HTMLElement | null>(null)
const mobileGridRef = ref<HTMLElement | null>(null)

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
  timer = setInterval(() => { now.value = new Date() }, 30000)
  nextTick(() => {
    if (gridRef.value) gridRef.value.scrollTop = WORK_START - 12
    if (mobileGridRef.value) mobileGridRef.value.scrollTop = WORK_START - 12
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Navigation -->
    <div v-if="!hideNav" class="flex items-center mb-3">
      <div class="flex items-center gap-1">
        <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" @click="previousWeek" />
        <UButton label="Aujourd'hui" color="neutral" variant="soft" size="xs" @click="goToToday" />
        <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" @click="nextWeek" />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         MOBILE: Single-day view (< 640px)
         ═══════════════════════════════════════════════ -->
    <div class="mobile-timetable">
      <!-- Day selector strip -->
      <div class="mobile-day-strip">
        <button
          v-for="(day, i) in weekDays"
          :key="formatDate(day)"
          class="mobile-day-btn"
          :class="{
            'is-selected': mobileDay === i,
            'is-today': isHighlightedDay(day)
          }"
          @click="mobileDay = i"
        >
          <span class="mobile-day-name">{{ getDayShortName(day) }}</span>
          <span class="mobile-day-num">{{ getDayNumber(day) }}</span>
        </button>
      </div>

      <!-- Single day grid -->
      <div ref="mobileGridRef" class="mobile-grid-scroll">
        <div class="mobile-grid" :style="{ height: GRID_HEIGHT + 'px' }">
          <!-- Hour labels -->
          <div class="relative">
            <div
              v-for="h in hourLabels"
              :key="h"
              class="absolute right-0 left-0"
              :style="{ top: hourToY(h) + 'px', height: HOUR_HEIGHT + 'px' }"
            >
              <span
                class="absolute -top-2 right-2 text-[10px] font-medium select-none"
                :class="(h >= 8 && h <= 18) ? 'text-stone-500' : 'text-stone-300'"
              >
                {{ String(h).padStart(2, '0') }}h
              </span>
            </div>
          </div>

          <!-- Day column -->
          <div class="relative border-l border-stone-200/60">
            <!-- Grey zones -->
            <div class="absolute inset-x-0 top-0 bg-stone-100/60" :style="{ height: WORK_START + 'px' }" />
            <div class="absolute inset-x-0 bottom-0 bg-stone-100/60" :style="{ top: WORK_END + 'px' }" />

            <!-- Highlighted day bg -->
            <div
              v-if="isHighlightedDay(mobileDayDate)"
              class="absolute inset-x-0 bg-amber-50/50"
              :style="{ top: WORK_START + 'px', height: (WORK_END - WORK_START) + 'px' }"
            />

            <!-- Lunch zone -->
            <div class="absolute inset-x-0" :style="{ top: LUNCH_START + 'px', height: (LUNCH_END - LUNCH_START) + 'px' }">
              <div class="absolute inset-0 bg-stone-50/60" />
              <div class="absolute inset-x-0 top-0 border-t border-dashed border-stone-300/50" />
              <div class="absolute inset-x-0 bottom-0 border-t border-dashed border-stone-300/50" />
              <span class="absolute inset-0 flex items-center justify-center text-[10px] text-stone-300 select-none tracking-wider uppercase">Pause</span>
            </div>

            <!-- Hour grid lines -->
            <template v-for="h in hourLabels" :key="'mline-' + h">
              <div
                class="absolute inset-x-0 border-t"
                :class="h === 8 || h === 18 ? 'border-stone-300/80' : h >= 8 && h < 18 ? 'border-stone-200/60' : 'border-stone-200/30'"
                :style="{ top: hourToY(h) + 'px' }"
              />
            </template>

            <!-- Legal time markers -->
            <div class="absolute inset-x-0 border-t-2 border-dashed border-amber-400/30" :style="{ top: LEGAL_AM_START + 'px' }" />
            <div class="absolute inset-x-0 border-t-2 border-dashed border-amber-400/30" :style="{ top: LEGAL_PM_END + 'px' }" />
            <span class="absolute left-1 text-[8px] font-medium text-amber-500/60 select-none" :style="{ top: LEGAL_AM_START + 2 + 'px' }">8h30</span>
            <span class="absolute right-1 text-[8px] font-medium text-amber-500/60 select-none" :style="{ top: LEGAL_PM_END - 12 + 'px' }">17h30</span>

            <!-- MATIN block -->
            <button
              class="absolute left-1 right-1 rounded-lg border-l-[3px] transition-all flex flex-col items-start justify-center px-3 z-[2]"
              :class="[
                getEntry(mobileDayDate, 'matin')
                  ? getBlockBg(getEntry(mobileDayDate, 'matin')!) + (getEntry(mobileDayDate, 'matin')!.statut === 'en_attente' ? ' opacity-60 border-dashed' : '')
                  : getSlotDisabled(mobileDayDate)
                    ? 'bg-stone-100/30 border-stone-200 cursor-not-allowed'
                    : readonly
                      ? 'border-transparent'
                      : 'border-transparent hover:bg-amber-50/40 hover:border-amber-300 cursor-pointer group',
                isSlotSelected(mobileDayDate, 'matin') ? 'ring-2 ring-primary ring-offset-1' : ''
              ]"
              :style="{ top: LEGAL_AM_START + 1 + 'px', height: (LEGAL_AM_END - LEGAL_AM_START) - 2 + 'px' }"
              :disabled="(readonly && !getEntry(mobileDayDate, 'matin')) || getSlotDisabled(mobileDayDate)"
              @click="handleBlockClick(mobileDayDate, 'matin')"
            >
              <template v-if="getEntry(mobileDayDate, 'matin')">
                <div class="flex items-center gap-1.5">
                  <UIcon v-if="getBlockIcon(getEntry(mobileDayDate, 'matin')!)" :name="getBlockIcon(getEntry(mobileDayDate, 'matin')!)" class="size-4 shrink-0" />
                  <span class="text-sm font-semibold truncate">{{ getBlockLabel(getEntry(mobileDayDate, 'matin')!) }}</span>
                </div>
                <span class="text-xs opacity-50 mt-0.5">8h30 — 12h00</span>
              </template>
              <template v-else-if="!readonly && !getSlotDisabled(mobileDayDate)">
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIcon name="i-lucide-plus" class="size-3 text-stone-400" />
                  <span class="text-xs text-stone-400">Matin</span>
                </div>
              </template>
            </button>

            <!-- APRES-MIDI block -->
            <button
              class="absolute left-1 right-1 rounded-lg border-l-[3px] transition-all flex flex-col items-start justify-center px-3 z-[2]"
              :class="[
                getEntry(mobileDayDate, 'apres_midi')
                  ? getBlockBg(getEntry(mobileDayDate, 'apres_midi')!) + (getEntry(mobileDayDate, 'apres_midi')!.statut === 'en_attente' ? ' opacity-60 border-dashed' : '')
                  : getSlotDisabled(mobileDayDate)
                    ? 'bg-stone-100/30 border-stone-200 cursor-not-allowed'
                    : readonly
                      ? 'border-transparent'
                      : 'border-transparent hover:bg-amber-50/40 hover:border-amber-300 cursor-pointer group',
                isSlotSelected(mobileDayDate, 'apres_midi') ? 'ring-2 ring-primary ring-offset-1' : ''
              ]"
              :style="{ top: LEGAL_PM_START + 1 + 'px', height: (LEGAL_PM_END - LEGAL_PM_START) - 2 + 'px' }"
              :disabled="(readonly && !getEntry(mobileDayDate, 'apres_midi')) || getSlotDisabled(mobileDayDate)"
              @click="handleBlockClick(mobileDayDate, 'apres_midi')"
            >
              <template v-if="getEntry(mobileDayDate, 'apres_midi')">
                <div class="flex items-center gap-1.5">
                  <UIcon v-if="getBlockIcon(getEntry(mobileDayDate, 'apres_midi')!)" :name="getBlockIcon(getEntry(mobileDayDate, 'apres_midi')!)" class="size-4 shrink-0" />
                  <span class="text-sm font-semibold truncate">{{ getBlockLabel(getEntry(mobileDayDate, 'apres_midi')!) }}</span>
                </div>
                <span class="text-xs opacity-50 mt-0.5">14h00 — 17h30</span>
              </template>
              <template v-else-if="!readonly && !getSlotDisabled(mobileDayDate)">
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIcon name="i-lucide-plus" class="size-3 text-stone-400" />
                  <span class="text-xs text-stone-400">Apres-midi</span>
                </div>
              </template>
            </button>

            <!-- Current time line -->
            <template v-if="isCurrentWeek && isToday(mobileDayDate) && currentTimeY !== null">
              <div class="absolute inset-x-0 z-20 pointer-events-none" :style="{ top: currentTimeY + 'px' }">
                <div class="relative h-0">
                  <div class="absolute -left-[5px] -top-[4px] size-[9px] rounded-full bg-red-500 shadow-sm" />
                  <div class="absolute left-0 right-0 h-[2px] bg-red-500 shadow-sm" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         DESKTOP: Full week grid (>= 640px)
         ═══════════════════════════════════════════════ -->
    <div class="desktop-timetable">
      <!-- Header row -->
      <div class="grid grid-cols-[52px_repeat(5,1fr)] border-b border-stone-200">
        <div class="py-2" />
        <div
          v-for="day in weekDays"
          :key="formatDate(day)"
          class="py-2 text-center border-l border-stone-200/60"
          :class="isHighlightedDay(day) ? 'bg-amber-50/50' : ''"
        >
          <p
            class="text-[11px] font-medium uppercase tracking-wide"
            :class="isHighlightedDay(day) ? 'text-amber-600' : 'text-stone-400'"
          >
            {{ getDayName(day) }}
          </p>
          <div class="flex items-center justify-center gap-1 mt-0.5">
            <span
              class="inline-flex items-center justify-center rounded-full text-sm font-bold leading-none"
              :class="isHighlightedDay(day)
                ? 'size-7 bg-amber-500 text-white'
                : 'text-stone-700'"
            >
              {{ getDayNumber(day) }}
            </span>
            <span
              v-if="!isHighlightedDay(day)"
              class="text-[10px] text-stone-400"
            >
              {{ getDayMonth(day) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Scrollable time grid -->
      <div ref="gridRef" class="overflow-y-auto" style="max-height: min(560px, calc(100svh - 260px)); min-height: 280px;">
        <div class="grid grid-cols-[52px_repeat(5,1fr)] relative" :style="{ height: GRID_HEIGHT + 'px' }">

          <!-- Hour labels column -->
          <div class="relative">
            <div
              v-for="h in hourLabels"
              :key="h"
              class="absolute right-0 left-0"
              :style="{ top: hourToY(h) + 'px', height: HOUR_HEIGHT + 'px' }"
            >
              <span
                class="absolute -top-2 right-2 text-[10px] font-medium select-none"
                :class="(h >= 8 && h <= 18)
                  ? 'text-stone-500'
                  : 'text-stone-300'"
              >
                {{ String(h).padStart(2, '0') }}:00
              </span>
              <!-- Half-hour tick -->
              <span
                class="absolute right-2 text-[9px] text-stone-300 select-none"
                :style="{ top: HALF_HOUR - 6 + 'px' }"
              >
                {{ String(h).padStart(2, '0') }}:30
              </span>
            </div>
          </div>

          <!-- Day columns -->
          <div
            v-for="(day, dayIdx) in weekDays"
            :key="'col-' + formatDate(day)"
            class="relative border-l border-stone-200/60"
          >
            <!-- Full column background -->
            <!-- Grey zone: before 8h -->
            <div
              class="absolute inset-x-0 top-0 bg-stone-100/60"
              :style="{ height: WORK_START + 'px' }"
            />
            <!-- Grey zone: after 18h -->
            <div
              class="absolute inset-x-0 bottom-0 bg-stone-100/60"
              :style="{ top: WORK_END + 'px' }"
            />

            <!-- Highlighted day bg (within work zone) -->
            <div
              v-if="isHighlightedDay(day)"
              class="absolute inset-x-0 bg-amber-50/50"
              :style="{ top: WORK_START + 'px', height: (WORK_END - WORK_START) + 'px' }"
            />

            <!-- Lunch zone marker -->
            <div
              class="absolute inset-x-0"
              :style="{ top: LUNCH_START + 'px', height: (LUNCH_END - LUNCH_START) + 'px' }"
            >
              <div class="absolute inset-0 bg-stone-50/60" />
              <div class="absolute inset-x-0 top-0 border-t border-dashed border-stone-300/50" />
              <div class="absolute inset-x-0 bottom-0 border-t border-dashed border-stone-300/50" />
              <span class="absolute inset-0 flex items-center justify-center text-[9px] text-stone-300 select-none tracking-wider uppercase">
                Pause
              </span>
            </div>

            <!-- Hour grid lines -->
            <template v-for="h in hourLabels" :key="'line-' + dayIdx + '-' + h">
              <div
                class="absolute inset-x-0 border-t"
                :class="h === 8 || h === 18
                  ? 'border-stone-300/80'
                  : h >= 8 && h < 18
                    ? 'border-stone-200/60'
                    : 'border-stone-200/30'"
                :style="{ top: hourToY(h) + 'px' }"
              />
              <!-- Half-hour line -->
              <div
                class="absolute inset-x-0 border-t border-dotted border-stone-200/30"
                :style="{ top: hourToY(h, 30) + 'px' }"
              />
            </template>

            <!-- Legal time markers: 8h30 and 17h30 -->
            <div
              class="absolute inset-x-0 border-t-2 border-dashed border-amber-400/30"
              :style="{ top: LEGAL_AM_START + 'px' }"
            />
            <div
              class="absolute inset-x-0 border-t-2 border-dashed border-amber-400/30"
              :style="{ top: LEGAL_PM_END + 'px' }"
            />

            <!-- Legal time label badges -->
            <span
              class="absolute left-1 text-[8px] font-medium text-amber-500/60 select-none"
              :style="{ top: LEGAL_AM_START + 2 + 'px' }"
            >
              8h30
            </span>
            <span
              class="absolute right-1 text-[8px] font-medium text-amber-500/60 select-none"
              :style="{ top: LEGAL_PM_END - 12 + 'px' }"
            >
              17h30
            </span>

            <!-- MATIN entry block (8h30 - 12h) -->
            <button
              class="absolute left-1 right-1 rounded-lg border-l-[3px] transition-all flex flex-col items-start justify-center px-2 z-[2]"
              :class="[
                getEntry(day, 'matin')
                  ? getBlockBg(getEntry(day, 'matin')!) + (getEntry(day, 'matin')!.statut === 'en_attente' ? ' opacity-60 border-dashed' : '')
                  : getSlotDisabled(day)
                    ? 'bg-stone-100/30 border-stone-200 cursor-not-allowed'
                    : readonly
                      ? 'border-transparent'
                      : 'border-transparent hover:bg-amber-50/40 hover:border-amber-300 cursor-pointer group',
                isSlotSelected(day, 'matin') ? 'ring-2 ring-primary ring-offset-1' : ''
              ]"
              :style="{ top: LEGAL_AM_START + 1 + 'px', height: (LEGAL_AM_END - LEGAL_AM_START) - 2 + 'px' }"
              :disabled="(readonly && !getEntry(day, 'matin')) || getSlotDisabled(day)"
              @click="handleBlockClick(day, 'matin')"
            >
              <template v-if="getEntry(day, 'matin')">
                <div class="flex items-center gap-1.5">
                  <UIcon v-if="getBlockIcon(getEntry(day, 'matin')!)" :name="getBlockIcon(getEntry(day, 'matin')!)" class="size-3.5 shrink-0" />
                  <span class="text-xs font-semibold truncate">{{ getBlockLabel(getEntry(day, 'matin')!) }}</span>
                </div>
                <span class="text-[10px] opacity-50 mt-0.5">8h30 — 12h00</span>
              </template>
              <template v-else-if="!readonly && !getSlotDisabled(day)">
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIcon name="i-lucide-plus" class="size-3 text-stone-400" />
                  <span class="text-[10px] text-stone-400">Matin</span>
                </div>
              </template>
            </button>

            <!-- APRES-MIDI entry block (14h - 17h30) -->
            <button
              class="absolute left-1 right-1 rounded-lg border-l-[3px] transition-all flex flex-col items-start justify-center px-2 z-[2]"
              :class="[
                getEntry(day, 'apres_midi')
                  ? getBlockBg(getEntry(day, 'apres_midi')!) + (getEntry(day, 'apres_midi')!.statut === 'en_attente' ? ' opacity-60 border-dashed' : '')
                  : getSlotDisabled(day)
                    ? 'bg-stone-100/30 border-stone-200 cursor-not-allowed'
                    : readonly
                      ? 'border-transparent'
                      : 'border-transparent hover:bg-amber-50/40 hover:border-amber-300 cursor-pointer group',
                isSlotSelected(day, 'apres_midi') ? 'ring-2 ring-primary ring-offset-1' : ''
              ]"
              :style="{ top: LEGAL_PM_START + 1 + 'px', height: (LEGAL_PM_END - LEGAL_PM_START) - 2 + 'px' }"
              :disabled="(readonly && !getEntry(day, 'apres_midi')) || getSlotDisabled(day)"
              @click="handleBlockClick(day, 'apres_midi')"
            >
              <template v-if="getEntry(day, 'apres_midi')">
                <div class="flex items-center gap-1.5">
                  <UIcon v-if="getBlockIcon(getEntry(day, 'apres_midi')!)" :name="getBlockIcon(getEntry(day, 'apres_midi')!)" class="size-3.5 shrink-0" />
                  <span class="text-xs font-semibold truncate">{{ getBlockLabel(getEntry(day, 'apres_midi')!) }}</span>
                </div>
                <span class="text-[10px] opacity-50 mt-0.5">14h00 — 17h30</span>
              </template>
              <template v-else-if="!readonly && !getSlotDisabled(day)">
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UIcon name="i-lucide-plus" class="size-3 text-stone-400" />
                  <span class="text-[10px] text-stone-400">Apres-midi</span>
                </div>
              </template>
            </button>

            <!-- Current time red line (on today's column, only current week) -->
            <template v-if="isCurrentWeek && isToday(day) && currentTimeY !== null">
              <div
                class="absolute inset-x-0 z-20 pointer-events-none"
                :style="{ top: currentTimeY + 'px' }"
              >
                <div class="relative h-0">
                  <div class="absolute -left-[5px] -top-[4px] size-[9px] rounded-full bg-red-500 shadow-sm" />
                  <div class="absolute left-0 right-0 h-[2px] bg-red-500 shadow-sm" />
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-stone-200/60">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-1 border-t-2 border-dashed border-amber-400/60" />
          <span class="text-[10px] text-stone-400">Horaires legaux (7h/jour)</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-[2px] bg-red-500 rounded" />
          <span class="text-[10px] text-stone-400">Heure actuelle</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block size-3 rounded bg-stone-100" />
          <span class="text-[10px] text-stone-400">Hors horaires</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ MOBILE / DESKTOP toggle ═══ */
.mobile-timetable { display: block; }
.desktop-timetable { display: none; }

@media (min-width: 640px) {
  .mobile-timetable { display: none; }
  .desktop-timetable { display: block; }
}

/* ═══ MOBILE DAY STRIP ═══ */
.mobile-day-strip {
  display: flex;
  border-bottom: 1px solid rgba(175, 143, 60, 0.15);
  background: rgba(237, 228, 204, 0.3);
}
.mobile-day-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  min-height: 56px;
  transition: background 0.15s;
  position: relative;
}
.mobile-day-btn.is-selected {
  background: rgba(175, 143, 60, 0.1);
}
.mobile-day-btn.is-selected::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #AF8F3C;
  border-radius: 1px;
}
.mobile-day-name {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(44, 36, 25, 0.5);
}
.mobile-day-btn.is-selected .mobile-day-name,
.mobile-day-btn.is-today .mobile-day-name {
  color: #AF8F3C;
}
.mobile-day-num {
  font-size: 16px;
  font-weight: 700;
  color: #2c2419;
  line-height: 1;
}
.mobile-day-btn.is-today .mobile-day-num {
  background: #AF8F3C;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* ═══ MOBILE GRID ═══ */
.mobile-grid-scroll {
  overflow-y: auto;
  max-height: 480px;
  -webkit-overflow-scrolling: touch;
}
.mobile-grid {
  display: grid;
  grid-template-columns: 40px 1fr;
  position: relative;
}
</style>
