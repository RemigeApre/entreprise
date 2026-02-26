<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Etat des sites" />

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div class="text-center py-16">
        <div class="inline-flex items-center justify-center size-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
          <UIcon name="i-lucide-activity" class="size-8 text-stone-400 dark:text-stone-500" />
        </div>
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Etat & Indicateurs
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          Le monitoring des sites et les indicateurs de performance seront disponibles prochainement.
        </p>
        <UBadge variant="subtle" color="neutral" class="mt-4">
          En construction
        </UBadge>
      </div>

      <!-- Skeleton preview -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-40 pointer-events-none">
        <UCard v-for="i in 4" :key="i">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="h-4 bg-stone-200 dark:bg-stone-700 rounded w-32" />
              <div class="size-3 rounded-full bg-emerald-300 dark:bg-emerald-700" />
            </div>
            <div class="h-3 bg-stone-200 dark:bg-stone-700 rounded w-48" />
            <div class="grid grid-cols-3 gap-3 mt-2">
              <div class="text-center">
                <div class="h-6 bg-stone-200 dark:bg-stone-700 rounded mb-1" />
                <div class="h-2 bg-stone-200 dark:bg-stone-700 rounded w-8 mx-auto" />
              </div>
              <div class="text-center">
                <div class="h-6 bg-stone-200 dark:bg-stone-700 rounded mb-1" />
                <div class="h-2 bg-stone-200 dark:bg-stone-700 rounded w-8 mx-auto" />
              </div>
              <div class="text-center">
                <div class="h-6 bg-stone-200 dark:bg-stone-700 rounded mb-1" />
                <div class="h-2 bg-stone-200 dark:bg-stone-700 rounded w-8 mx-auto" />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
