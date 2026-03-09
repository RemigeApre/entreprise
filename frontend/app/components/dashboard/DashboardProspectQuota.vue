<script setup lang="ts">
const { hasQuota, objectifJour, objectifSemaine, weekContacts, todayContacts, progressSemaine, progressJour, loading, loadWeekContacts } = useProspectQuota()

onMounted(loadWeekContacts)
</script>

<template>
  <UCard v-if="hasQuota">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Objectif prospection</h3>
        <UButton label="Prospection" variant="link" size="xs" to="/prospection" trailing-icon="i-lucide-arrow-right" />
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-16">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
    </div>

    <div v-else class="space-y-4">
      <!-- Aujourd'hui -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-stone-500 dark:text-stone-400">Aujourd'hui</span>
          <span class="text-xs font-semibold tabular-nums" :class="todayContacts >= objectifJour! ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'">
            {{ todayContacts }} / {{ objectifJour }}
          </span>
        </div>
        <div class="h-2 bg-[rgba(175,143,60,0.06)] dark:bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressJour >= 100 ? 'bg-emerald-500' : progressJour >= 60 ? 'bg-amber-500' : 'bg-primary'"
            :style="{ width: progressJour + '%' }"
          />
        </div>
      </div>

      <!-- Semaine -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-stone-500 dark:text-stone-400">Cette semaine</span>
          <span class="text-xs font-semibold tabular-nums" :class="weekContacts >= objectifSemaine! ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-700 dark:text-stone-300'">
            {{ weekContacts }} / {{ objectifSemaine }}
          </span>
        </div>
        <div class="h-2 bg-[rgba(175,143,60,0.06)] dark:bg-[rgba(175,143,60,0.06)] rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progressSemaine >= 100 ? 'bg-emerald-500' : progressSemaine >= 60 ? 'bg-amber-500' : 'bg-primary'"
            :style="{ width: progressSemaine + '%' }"
          />
        </div>
      </div>

      <!-- Encouragement -->
      <p v-if="progressSemaine >= 100" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">
        Objectif atteint cette semaine !
      </p>
    </div>
  </UCard>
</template>
