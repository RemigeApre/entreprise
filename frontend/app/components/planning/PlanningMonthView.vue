<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { formatDate, isDateInContractPeriod } from '~/utils/dates'
import { PLANNING_COLORS } from '~/utils/constants'

const props = defineProps<{
  entries: PlanningEntry[]
  readonly?: boolean
  contractStart?: string | null
  contractEnd?: string | null
  selectedSlots?: Set<string>
}>()

const emit = defineEmits<{
  addEntry: [date: string, periode: 'matin' | 'apres_midi']
  clickEntry: [entry: PlanningEntry]
  monthChange: [year: number, month: number]
}>()

const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthLabel = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

function previousMonth() {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  currentDate.value = d
  emit('monthChange', d.getFullYear(), d.getMonth())
}

function nextMonth() {
  const d = new Date(currentYear.value, currentMonth.value + 1, 1)
  currentDate.value = d
  emit('monthChange', d.getFullYear(), d.getMonth())
}

function goToToday() {
  currentDate.value = new Date()
  const now = new Date()
  emit('monthChange', now.getFullYear(), now.getMonth())
}

defineExpose({ previousMonth, nextMonth, goToToday, monthLabel, currentYear, currentMonth })

// Build calendar weeks (Mon-Fri only)
interface CalendarDay {
  date: Date
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  disabled: boolean
  disabledReason?: string
}

const weeks = computed<CalendarDay[][]>(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const todayStr = formatDate(new Date())

  // Find the Monday of the first week
  let startDay = new Date(firstOfMonth)
  const dow = startDay.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  startDay.setDate(startDay.getDate() + offset)

  const result: CalendarDay[][] = []
  const cursor = new Date(startDay)

  while (true) {
    const week: CalendarDay[] = []
    for (let i = 0; i < 5; i++) {
      const d = new Date(cursor)
      const dateStr = formatDate(d)
      const check = isDateInContractPeriod(dateStr, props.contractStart, props.contractEnd)
      week.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === todayStr,
        disabled: !check.valid,
        disabledReason: check.reason
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    // Skip weekend
    cursor.setDate(cursor.getDate() + 2)
    result.push(week)

    // Stop after we've passed the last day of the month
    if (cursor > lastOfMonth && week[4].date >= lastOfMonth) break
    if (result.length >= 6) break
  }

  return result
})

// Entry lookup helpers
function getEntry(dateStr: string, periode: 'matin' | 'apres_midi'): PlanningEntry | undefined {
  return props.entries.find(e => e.date === dateStr && e.periode === periode)
}

function getDisplayKey(entry: PlanningEntry): string {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function getDotClass(entry: PlanningEntry): string {
  const key = getDisplayKey(entry)
  const colors = PLANNING_COLORS[key] || PLANNING_COLORS[entry.type]
  return colors?.dot || 'bg-stone-400'
}

function getBgClass(entry: PlanningEntry): string {
  const key = getDisplayKey(entry)
  const colors = PLANNING_COLORS[key] || PLANNING_COLORS[entry.type]
  return colors?.bg || ''
}

function isSlotSelected(dateStr: string, periode: 'matin' | 'apres_midi'): boolean {
  return props.selectedSlots?.has(`${dateStr}_${periode}`) ?? false
}

function handleSlotClick(day: CalendarDay, periode: 'matin' | 'apres_midi') {
  if (day.disabled || !day.isCurrentMonth) return
  const entry = getEntry(day.dateStr, periode)
  if (entry) {
    emit('clickEntry', entry)
  } else if (!props.readonly) {
    emit('addEntry', day.dateStr, periode)
  }
}

onMounted(() => {
  emit('monthChange', currentYear.value, currentMonth.value)
})
</script>

<template>
  <div>
    <!-- Day-of-week header -->
    <div class="grid grid-cols-5 gap-1 mb-1">
      <div
        v-for="name in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']"
        :key="name"
        class="text-center text-[11px] font-medium uppercase text-stone-500 dark:text-stone-400 py-1"
      >
        {{ name }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="grid grid-cols-5 gap-1">
      <div
        v-for="(week, wi) in weeks"
        v-bind:key="wi"
        class="contents"
      >
        <div
          v-for="day in week"
          :key="day.dateStr"
          class="min-h-[56px] rounded-lg border transition-colors p-1"
          :class="[
            !day.isCurrentMonth
              ? 'bg-stone-50/50 dark:bg-stone-900/30 border-transparent opacity-40'
              : day.isToday
                ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20'
                : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700',
            day.disabled ? 'opacity-40 cursor-not-allowed' : ''
          ]"
        >
          <!-- Day number -->
          <p
            class="text-[11px] font-medium mb-0.5 px-0.5"
            :class="day.isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : day.isCurrentMonth ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400 dark:text-stone-600'"
          >
            {{ day.dayNumber }}
          </p>

          <!-- AM/PM slots -->
          <div class="flex gap-0.5">
            <button
              v-for="periode in (['matin', 'apres_midi'] as const)"
              :key="periode"
              class="flex-1 h-7 rounded transition-all flex items-center justify-center"
              :class="[
                getEntry(day.dateStr, periode)
                  ? `${getBgClass(getEntry(day.dateStr, periode)!)} ${getEntry(day.dateStr, periode)!.statut === 'en_attente' ? 'opacity-60' : ''}`
                  : day.isCurrentMonth && !day.disabled && !readonly
                    ? 'bg-stone-100 dark:bg-stone-800/50 hover:bg-stone-200 dark:hover:bg-stone-700/50 cursor-pointer'
                    : 'bg-stone-100/50 dark:bg-stone-800/30',
                isSlotSelected(day.dateStr, periode) ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-stone-900' : ''
              ]"
              :disabled="day.disabled || !day.isCurrentMonth"
              @click="handleSlotClick(day, periode)"
            >
              <span
                v-if="getEntry(day.dateStr, periode)"
                class="size-2 rounded-full"
                :class="getDotClass(getEntry(day.dateStr, periode)!)"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend: AM/PM -->
    <div class="flex items-center gap-3 mt-2 text-[10px] text-stone-400 dark:text-stone-500">
      <span>Gauche = Matin</span>
      <span>Droite = Apres-midi</span>
    </div>
  </div>
</template>
