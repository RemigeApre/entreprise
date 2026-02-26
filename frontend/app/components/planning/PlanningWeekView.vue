<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { getMonday, addDays, getWeekDays, getWeekNumber, formatDate, isDateInContractPeriod } from '~/utils/dates'

const props = defineProps<{
  entries: PlanningEntry[]
  readonly?: boolean
  contractStart?: string | null
  contractEnd?: string | null
}>()

const emit = defineEmits<{
  addEntry: [date: string, periode: 'matin' | 'apres_midi']
  clickEntry: [entry: PlanningEntry]
  weekChange: [monday: string]
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

defineExpose({ weekNumber })

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

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
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
    <div class="flex items-center mb-4">
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

      <!-- Matin row -->
      <div class="flex items-center pr-2">
        <span class="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Matin</span>
      </div>
      <div v-for="day in weekDays" :key="'am-' + formatDate(day)">
        <PlanningDaySlot
          :entry="getEntry(day, 'matin')"
          periode="matin"
          :readonly="readonly"
          :disabled="getSlotDisabled(day).disabled"
          :disabled-reason="getSlotDisabled(day).reason"
          @click="handleSlotClick(day, 'matin')"
        />
      </div>

      <!-- Apres-midi row -->
      <div class="flex items-center pr-2">
        <span class="text-[11px] font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">Apres-midi</span>
      </div>
      <div v-for="day in weekDays" :key="'pm-' + formatDate(day)">
        <PlanningDaySlot
          :entry="getEntry(day, 'apres_midi')"
          periode="apres_midi"
          :readonly="readonly"
          :disabled="getSlotDisabled(day).disabled"
          :disabled-reason="getSlotDisabled(day).reason"
          @click="handleSlotClick(day, 'apres_midi')"
        />
      </div>
    </div>
  </div>
</template>
