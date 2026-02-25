<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES } from '~/utils/constants'
import { getMonday, getWeekDays, formatDate, formatDateShortFr, addDays } from '~/utils/dates'

const { user } = useAuth()
const { getEntries } = usePlanning()

const loading = ref(true)
const entries = ref<PlanningEntry[]>([])

const currentMonday = getMonday(new Date())
const weekDays = getWeekDays(currentMonday)

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

function isToday(date: Date): boolean {
  return formatDate(date) === formatDate(new Date())
}

const slotColors: Record<string, { bg: string, text: string }> = {
  travail: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  ecole: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
  conge: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  absent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' },
  ferie: { bg: 'bg-stone-100 dark:bg-stone-800/50', text: 'text-stone-500 dark:text-stone-400' }
}

function getSlotClasses(entry: PlanningEntry | undefined) {
  if (!entry) return 'bg-stone-50 dark:bg-stone-800/30 text-stone-300 dark:text-stone-600'
  const c = slotColors[entry.type]
  return c ? `${c.bg} ${c.text}` : ''
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Ma semaine</h3>
        <UButton
          label="Voir le planning"
          variant="link"
          size="xs"
          to="/planning"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else class="grid grid-cols-5 gap-2">
      <div
        v-for="day in weekDays"
        :key="formatDate(day)"
        class="text-center"
      >
        <p
          class="text-[11px] font-medium uppercase mb-1.5"
          :class="isToday(day) ? 'text-primary font-bold' : 'text-stone-500 dark:text-stone-400'"
        >
          {{ formatDateShortFr(day) }}
        </p>
        <!-- AM -->
        <div
          class="h-7 rounded-md text-[10px] flex items-center justify-center mb-1 font-medium"
          :class="getSlotClasses(getEntry(day, 'matin'))"
        >
          <UIcon
            v-if="getEntry(day, 'matin')"
            :name="PLANNING_TYPES[getEntry(day, 'matin')!.type]?.icon || ''"
            class="size-3.5"
          />
          <span v-else class="text-[10px]">-</span>
        </div>
        <!-- PM -->
        <div
          class="h-7 rounded-md text-[10px] flex items-center justify-center font-medium"
          :class="getSlotClasses(getEntry(day, 'apres_midi'))"
        >
          <UIcon
            v-if="getEntry(day, 'apres_midi')"
            :name="PLANNING_TYPES[getEntry(day, 'apres_midi')!.type]?.icon || ''"
            class="size-3.5"
          />
          <span v-else class="text-[10px]">-</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
