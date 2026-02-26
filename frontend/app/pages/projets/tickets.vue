<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Tickets & Erreurs" />

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div class="text-center py-16">
        <div class="inline-flex items-center justify-center size-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
          <UIcon name="i-lucide-ticket" class="size-8 text-stone-400 dark:text-stone-500" />
        </div>
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Suivi des tickets
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          Le systeme de suivi des erreurs et tickets sera disponible prochainement.
        </p>
        <UBadge variant="subtle" color="neutral" class="mt-4">
          En construction
        </UBadge>
      </div>

      <!-- Skeleton preview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-40 pointer-events-none">
        <UCard v-for="i in 3" :key="i">
          <div class="space-y-3">
            <div class="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
            <div class="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2" />
            <div class="h-3 bg-stone-200 dark:bg-stone-700 rounded w-full" />
            <div class="flex gap-2 mt-2">
              <div class="h-5 w-16 bg-stone-200 dark:bg-stone-700 rounded-full" />
              <div class="h-5 w-12 bg-stone-200 dark:bg-stone-700 rounded-full" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
