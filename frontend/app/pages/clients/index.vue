<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
</script>

<template>
  <div>
    <UDashboardNavbar title="Liste clients" />

    <div class="p-4 sm:p-6 space-y-6">
      <div class="text-center py-16">
        <div class="inline-flex items-center justify-center size-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
          <UIcon name="i-lucide-building" class="size-8 text-stone-400 dark:text-stone-500" />
        </div>
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Gestion des clients
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          La gestion de la base clients sera disponible prochainement. En attendant, utilisez la section Prospection.
        </p>
        <div class="flex items-center justify-center gap-3 mt-4">
          <UBadge variant="subtle" color="neutral">
            En construction
          </UBadge>
          <UButton
            label="Prospection"
            icon="i-lucide-target"
            variant="soft"
            size="sm"
            to="/prospection"
          />
        </div>
      </div>

      <!-- Skeleton table -->
      <div class="opacity-40 pointer-events-none">
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="h-5 bg-stone-200 dark:bg-stone-700 rounded w-32" />
              <div class="h-8 bg-stone-200 dark:bg-stone-700 rounded w-24" />
            </div>
            <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-3 border-t border-stone-100 dark:border-stone-800">
              <div class="size-8 bg-stone-200 dark:bg-stone-700 rounded-full shrink-0" />
              <div class="flex-1 space-y-1.5">
                <div class="h-3.5 bg-stone-200 dark:bg-stone-700 rounded w-40" />
                <div class="h-2.5 bg-stone-200 dark:bg-stone-700 rounded w-24" />
              </div>
              <div class="h-5 w-16 bg-stone-200 dark:bg-stone-700 rounded-full" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
