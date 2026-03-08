<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { getMonday, addDays, getWeekDays, getWeekNumber, formatDate, isDateInContractPeriod, isWeekend, getCurrentOrNextMonday, getEffectiveWorkDay } from '~/utils/dates'

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

function getEntry(date: Date, periode: 'matin' | 'apres_midi') {
  const dateStr = formatDate(date)
  return props.entries.find(e => e.date === dateStr && e.periode === periode)
}

function isSlotSelected(date: Date, periode: 'matin' | 'apres_midi'): boolean {
  return props.selectedSlots?.has(`${formatDate(date)}_${periode}`) ?? false
}

function getSlotDisabled(date: Date): { disabled: boolean; reason?: string } {
  const dateStr = formatDate(date)
  const check = isDateInContractPeriod(dateStr, props.contractStart, props.contractEnd)
  if (!check.valid) return { disabled: true, reason: check.reason }
  return { disabled: false }
}

function handleSlotClick(date: Date, periode: 'matin' | 'apres_midi') {
  const { disabled } = getSlotDisabled(date)
  if (disabled) return
  const entry = getEntry(date, periode)
  if (entry) {
    emit('clickEntry', entry)
  } else if (!props.readonly) {
    emit('addEntry', formatDate(date), periode)
  }
}

// Compute ferie dates from entries to skip them in effective day calc
const ferieDates = computed(() => {
  const dates = new Set<string>()
  const grouped = new Map<string, number>()
  for (const e of props.entries) {
    if (e.type === 'ferie') {
      grouped.set(e.date, (grouped.get(e.date) || 0) + 1)
    }
  }
  // A day is fully ferie if both matin + apres_midi are ferie (2 entries)
  for (const [date, count] of grouped) {
    if (count >= 2) dates.add(date)
  }
  return dates
})

const effectiveDay = computed(() => formatDate(getEffectiveWorkDay(new Date(), ferieDates.value)))

function isHighlightedDay(date: Date): boolean {
  return formatDate(date) === effectiveDay.value
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

function getDayNumber(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
})
</script>

<template>
  <div>
    <!-- Navigation -->
    <div v-if="!hideNav" class="flex items-center mb-4">
      <div class="flex items-center gap-1">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="previousWeek"
        />
        <UButton
          label="Aujourd'hui"
          color="neutral"
          variant="soft"
          size="xs"
          @click="goToToday"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="nextWeek"
        />
      </div>
    </div>

    <!-- Grid: row labels left + 5 day columns -->
    <div class="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-x-2 gap-y-1.5">
      <!-- Header row: empty cell + day names -->
      <div />
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="text-center pb-1"
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

      <!-- Matin row -->
      <div class="flex items-center pr-2">
        <span class="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Matin</span>
      </div>
      <div
        v-for="day in weekDays"
        :key="'am-' + formatDate(day)"
        :class="isHighlightedDay(day) ? 'bg-amber-50/60 dark:bg-amber-950/20 rounded-t-lg -mx-0.5 px-0.5' : ''"
      >
        <PlanningDaySlot
          :entry="getEntry(day, 'matin')"
          periode="matin"
          :readonly="readonly"
          :disabled="getSlotDisabled(day).disabled"
          :disabled-reason="getSlotDisabled(day).reason"
          :selected="isSlotSelected(day, 'matin')"
          @click="handleSlotClick(day, 'matin')"
        />
      </div>

      <!-- Apres-midi row -->
      <div class="flex items-center pr-2">
        <span class="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Apres-midi</span>
      </div>
      <div
        v-for="day in weekDays"
        :key="'pm-' + formatDate(day)"
        :class="isHighlightedDay(day) ? 'bg-amber-50/60 dark:bg-amber-950/20 rounded-b-lg -mx-0.5 px-0.5' : ''"
      >
        <PlanningDaySlot
          :entry="getEntry(day, 'apres_midi')"
          periode="apres_midi"
          :readonly="readonly"
          :disabled="getSlotDisabled(day).disabled"
          :disabled-reason="getSlotDisabled(day).reason"
          :selected="isSlotSelected(day, 'apres_midi')"
          @click="handleSlotClick(day, 'apres_midi')"
        />
      </div>
    </div>
  </div>
</template>
