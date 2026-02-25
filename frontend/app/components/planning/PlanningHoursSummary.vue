<script setup lang="ts">
const props = defineProps<{
  totalHours: number
  totalDays: number
  totalHalfDays: number
}>()

const currentYear = new Date().getFullYear()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Bilan {{ currentYear }}
      </h3>
    </template>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500 dark:text-gray-400">Heures travaillees</span>
        <span class="font-semibold text-gray-900 dark:text-white">{{ totalHours.toFixed(1) }}h</span>
      </div>
      <USeparator />
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500 dark:text-gray-400">Jours travailles</span>
        <span class="font-semibold text-gray-900 dark:text-white">{{ totalDays }}j</span>
      </div>
      <USeparator />
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500 dark:text-gray-400">Demi-journees</span>
        <span class="font-semibold text-gray-900 dark:text-white">{{ totalHalfDays }}</span>
      </div>
    </div>
  </UCard>
</template>
