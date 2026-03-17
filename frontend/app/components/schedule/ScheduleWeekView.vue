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

// --- Mobile: single day view ---
const mobileDay = ref(0)

// Auto-select today or effective day on mobile
function initMobileDay() {
  const idx = weekDays.value.findIndex(d => isHighlightedDay(d))
  mobileDay.value = idx >= 0 ? idx : 0
}

const mobileDayDate = computed(() => weekDays.value[mobileDay.value])

function mobilePrevDay() {
  if (mobileDay.value > 0) mobileDay.value--
}
function mobileNextDay() {
  if (mobileDay.value < 4) mobileDay.value++
}

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
  const effective = getEffectiveWorkDay(new Date())
  currentMonday.value = getMonday(effective)
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
}

defineExpose({ weekNumber, weekLabel, previousWeek, nextWeek, goToToday })

// --- Display ---
function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long' })
}

function getDayShortName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')
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
const mobileGridRef = ref<HTMLElement | null>(null)

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
  initMobileDay()
  timer = setInterval(() => { now.value = new Date() }, 30000)
  nextTick(() => {
    if (gridRef.value) {
      gridRef.value.scrollTop = WORK_START_Y - 12
    }
    if (mobileGridRef.value) {
      mobileGridRef.value.scrollTop = WORK_START_Y - 12
    }
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- ═══════════════════════════════════════════════
         MOBILE: Single-day view (< 640px)
         ═══════════════════════════════════════════════ -->
    <div class="mobile-schedule">
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
        <div class="mobile-grid" :style="{ height: TOTAL_HEIGHT + 'px' }">
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
                :class="(h >= 8 && h <= 18) ? 'text-[#2c2419]/80' : 'text-[#2c2419]/35'"
              >
                {{ String(h).padStart(2, '0') }}h
              </span>
            </div>
          </div>

          <!-- Day column -->
          <div
            class="relative border-l border-[#af8f3c]/25"
            @click="handleGridClick(mobileDayDate, $event)"
          >
            <!-- Grey zone: before 8h -->
            <div
              class="absolute inset-x-0 top-0 bg-stone-200/70"
              :style="{ height: WORK_START_Y + 'px' }"
            />
            <!-- Grey zone: after 18h -->
            <div
              class="absolute inset-x-0 bg-stone-200/70"
              :style="{ top: WORK_END_Y + 'px', bottom: '0' }"
            />

            <!-- Highlighted day bg -->
            <div
              v-if="isHighlightedDay(mobileDayDate)"
              class="absolute inset-x-0 bg-[#af8f3c]/[0.06]"
              :style="{ top: WORK_START_Y + 'px', height: (WORK_END_Y - WORK_START_Y) + 'px' }"
            />

            <!-- Lunch zone -->
            <div
              class="absolute inset-x-0"
              :style="{ top: LUNCH_START_Y + 'px', height: (LUNCH_END_Y - LUNCH_START_Y) + 'px' }"
            >
              <div class="absolute inset-0 bg-stone-100/70" />
              <div class="absolute inset-x-0 top-0 border-t border-dashed border-[#af8f3c]/30" />
              <div class="absolute inset-x-0 bottom-0 border-t border-dashed border-[#af8f3c]/30" />
              <span class="absolute inset-0 flex items-center justify-center text-[11px] text-[#2c2419]/40 select-none tracking-wider uppercase font-medium">
                Pause
              </span>
            </div>

            <!-- Hour lines -->
            <template v-for="h in hours" :key="'mline-' + h">
              <div
                class="absolute inset-x-0 border-t"
                :class="h === 8 || h === 18
                  ? 'border-[#af8f3c]/40'
                  : h >= 8 && h < 18
                    ? 'border-[#af8f3c]/20'
                    : 'border-stone-300/50'"
                :style="{ top: hourToY(h) + 'px' }"
              />
            </template>

            <!-- Current time red line -->
            <template v-if="isCurrentWeek && isToday(mobileDayDate) && currentTimeY !== null">
              <div
                class="absolute inset-x-0 z-20 pointer-events-none"
                :style="{ top: currentTimeY + 'px' }"
              >
                <div class="relative h-0">
                  <div class="absolute -left-[5px] -top-[5px] size-[11px] rounded-full bg-[#b74d34] shadow-sm" />
                  <div class="absolute left-0 right-0 h-[2px] bg-[#b74d34] shadow-sm" />
                </div>
              </div>
            </template>

            <!-- Entries -->
            <button
              v-for="entry in getEntriesForDay(mobileDayDate)"
              :key="entry.id"
              class="absolute left-1 right-1 z-10 rounded-lg border-l-[3px] px-3 py-1.5 overflow-hidden text-left transition-opacity hover:opacity-90 cursor-pointer"
              :class="[getEntryColors(entry).bg, getEntryColors(entry).text, getEntryColors(entry).border]"
              :style="getEntryStyle(entry)"
              @click.stop="emit('clickEntry', entry)"
            >
              <p class="text-sm font-semibold truncate leading-tight">{{ entry.titre }}</p>
              <p class="text-xs opacity-60 leading-tight mt-0.5">{{ formatTime(entry.heure_debut) }} — {{ formatTime(entry.heure_fin) }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         DESKTOP: Full week grid (>= 640px)
         ═══════════════════════════════════════════════ -->
    <div class="desktop-schedule">
      <!-- Fixed header -->
      <div class="grid grid-cols-[56px_repeat(5,1fr)] border-b border-[#af8f3c]/30 shrink-0 bg-[#ede4cc]/40">
        <div class="py-2.5" />
        <div
          v-for="day in weekDays"
          :key="formatDate(day)"
          class="py-2.5 text-center border-l border-[#af8f3c]/20"
          :class="isHighlightedDay(day) ? 'bg-[#af8f3c]/10' : ''"
        >
          <p
            class="text-xs font-semibold uppercase tracking-wide"
            :class="isHighlightedDay(day) ? 'text-[#af8f3c]' : 'text-[#2c2419]/60'"
          >
            {{ getDayName(day) }}
          </p>
          <div class="flex items-center justify-center gap-1 mt-1">
            <span
              class="inline-flex items-center justify-center rounded-full text-sm font-bold leading-none"
              :class="isHighlightedDay(day)
                ? 'size-7 bg-[#af8f3c] text-white'
                : 'text-[#2c2419]'"
            >
              {{ getDayNumber(day) }}
            </span>
            <span
              v-if="!isHighlightedDay(day)"
              class="text-[11px] text-[#2c2419]/50"
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
                :class="(h >= 8 && h <= 18) ? 'text-[#2c2419]/80' : 'text-[#2c2419]/35'"
              >
                {{ String(h).padStart(2, '0') }}:00
              </span>
              <span
                class="absolute right-2 text-[10px] select-none"
                :class="(h >= 8 && h < 18) ? 'text-[#2c2419]/45' : 'text-[#2c2419]/25'"
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
            class="relative border-l border-[#af8f3c]/25"
            @click="handleGridClick(day, $event)"
          >
            <!-- Grey zone: before 8h -->
            <div
              class="absolute inset-x-0 top-0 bg-stone-200/70"
              :style="{ height: WORK_START_Y + 'px' }"
            />
            <!-- Grey zone: after 18h -->
            <div
              class="absolute inset-x-0 bg-stone-200/70"
              :style="{ top: WORK_END_Y + 'px', bottom: '0' }"
            />

            <!-- Highlighted day bg -->
            <div
              v-if="isHighlightedDay(day)"
              class="absolute inset-x-0 bg-[#af8f3c]/[0.06]"
              :style="{ top: WORK_START_Y + 'px', height: (WORK_END_Y - WORK_START_Y) + 'px' }"
            />

            <!-- Lunch zone -->
            <div
              class="absolute inset-x-0"
              :style="{ top: LUNCH_START_Y + 'px', height: (LUNCH_END_Y - LUNCH_START_Y) + 'px' }"
            >
              <div class="absolute inset-0 bg-stone-100/70" />
              <div class="absolute inset-x-0 top-0 border-t border-dashed border-[#af8f3c]/30" />
              <div class="absolute inset-x-0 bottom-0 border-t border-dashed border-[#af8f3c]/30" />
              <span class="absolute inset-0 flex items-center justify-center text-[11px] text-[#2c2419]/40 select-none tracking-wider uppercase font-medium">
                Pause
              </span>
            </div>

            <!-- Hour lines -->
            <template v-for="h in hours" :key="'line-' + h">
              <div
                class="absolute inset-x-0 border-t"
                :class="h === 8 || h === 18
                  ? 'border-[#af8f3c]/40'
                  : h >= 8 && h < 18
                    ? 'border-[#af8f3c]/20'
                    : 'border-stone-300/50'"
                :style="{ top: hourToY(h) + 'px' }"
              />
              <div
                class="absolute inset-x-0 border-t border-dotted"
                :class="(h >= 8 && h < 18)
                  ? 'border-[#af8f3c]/15'
                  : 'border-stone-300/30'"
                :style="{ top: hourToY(h, 30) + 'px' }"
              />
            </template>

            <!-- Current time red line -->
            <template v-if="isCurrentWeek && isToday(day) && currentTimeY !== null">
              <div
                class="absolute inset-x-0 z-20 pointer-events-none"
                :style="{ top: currentTimeY + 'px' }"
              >
                <div class="relative h-0">
                  <div class="absolute -left-[5px] -top-[5px] size-[11px] rounded-full bg-[#b74d34] shadow-sm" />
                  <div class="absolute left-0 right-0 h-[2px] bg-[#b74d34] shadow-sm" />
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
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 border-t border-[#af8f3c]/20 shrink-0">
        <div class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-[2px] bg-[#b74d34] rounded" />
          <span class="text-[11px] text-[#2c2419]/60">Heure actuelle</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="inline-block size-3 rounded bg-stone-200" />
          <span class="text-[11px] text-[#2c2419]/60">Hors horaires</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ MOBILE / DESKTOP toggle ═══ */
.mobile-schedule { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.desktop-schedule { display: none; }

@media (min-width: 640px) {
  .mobile-schedule { display: none; }
  .desktop-schedule { display: flex; flex-direction: column; flex: 1; min-height: 0; }
}

/* ═══ MOBILE DAY STRIP ═══ */
.mobile-day-strip {
  display: flex;
  border-bottom: 1px solid rgba(175, 143, 60, 0.2);
  background: rgba(237, 228, 204, 0.4);
  flex-shrink: 0;
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
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}
.mobile-grid {
  display: grid;
  grid-template-columns: 40px 1fr;
  position: relative;
}
</style>
