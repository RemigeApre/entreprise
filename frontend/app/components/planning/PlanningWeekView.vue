<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { getMonday, addDays, getWeekDays, formatDate, formatDateShortFr, isDateInContractPeriod } from '~/utils/dates'

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

onMounted(() => {
  emit('weekChange', formatDate(currentMonday.value))
})
</script>

<template>
  <div>
    <!-- Week navigation -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="previousWeek"
        />
        <UButton
          label="Aujourd'hui"
          color="neutral"
          variant="outline"
          size="sm"
          @click="goToToday"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="nextWeek"
        />
      </div>
      <span class="text-sm font-medium text-stone-700 dark:text-stone-300">
        {{ weekLabel }}
      </span>
    </div>

    <!-- Week grid -->
    <div class="grid grid-cols-5 gap-3">
      <!-- Day headers -->
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="text-center"
      >
        <p
          class="text-xs font-medium uppercase mb-1"
          :class="isToday(day) ? 'text-primary font-bold' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ formatDateShortFr(day) }}
        </p>
      </div>

      <!-- Matin slots -->
      <div
        v-for="day in weekDays"
        :key="'am-' + formatDate(day)"
      >
        <p class="text-[10px] text-stone-400 dark:text-stone-600 mb-1 text-center">Matin</p>
        <PlanningDaySlot
          :entry="getEntry(day, 'matin')"
          periode="matin"
          :readonly="readonly"
          :disabled="getSlotDisabled(day).disabled"
          :disabled-reason="getSlotDisabled(day).reason"
          @click="handleSlotClick(day, 'matin')"
        />
      </div>

      <!-- Apres-midi slots -->
      <div
        v-for="day in weekDays"
        :key="'pm-' + formatDate(day)"
      >
        <p class="text-[10px] text-stone-400 dark:text-stone-600 mb-1 text-center">Apres-midi</p>
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
