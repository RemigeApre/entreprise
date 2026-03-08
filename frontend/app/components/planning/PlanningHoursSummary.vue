<script setup lang="ts">
const props = defineProps<{
  totalHours: number
  totalDays: number
  totalHalfDays: number
}>()

const currentYear = new Date().getFullYear()

// Estimation jours ouvrés restants dans l'année
const remainingWorkDays = computed(() => {
  const now = new Date()
  const endOfYear = new Date(currentYear, 11, 31)
  let count = 0
  const d = new Date(now)
  d.setDate(d.getDate() + 1)
  while (d <= endOfYear) {
    if (d.getDay() !== 0 && d.getDay() !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
})
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-semibold">Bilan {{ currentYear }}</h3>
    </template>

    <div class="space-y-2.5">
      <div>
        <p class="text-[11px] text-stone-400 uppercase tracking-wide">Heures</p>
        <p class="text-lg font-bold tabular-nums">{{ totalHours.toFixed(1) }}<span class="text-sm font-normal text-stone-400">h</span></p>
      </div>
      <div class="border-t border-stone-100 dark:border-stone-800 pt-2.5 grid grid-cols-2 gap-3">
        <div>
          <p class="text-[11px] text-stone-400">Jours</p>
          <p class="text-sm font-semibold tabular-nums">{{ totalDays }}<span class="text-xs font-normal text-stone-400">j</span></p>
        </div>
        <div>
          <p class="text-[11px] text-stone-400">Demi-j.</p>
          <p class="text-sm font-semibold tabular-nums">{{ totalHalfDays }}</p>
        </div>
      </div>
      <div class="border-t border-stone-100 dark:border-stone-800 pt-2">
        <p class="text-[10px] text-stone-400">{{ remainingWorkDays }} jours ouvres restants</p>
      </div>
    </div>
  </UCard>
</template>
