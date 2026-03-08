<script setup lang="ts">
// Placeholder — les tickets seront connectes a Directus prochainement
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Mes tickets</h3>
        <UBadge variant="subtle" color="amber" size="xs">Bientot</UBadge>
      </div>
    </template>

    <div class="py-6 text-center">
      <div class="size-10 rounded-xl bg-[rgba(175,143,60,0.06)] flex items-center justify-center mx-auto mb-3">
        <UIcon name="i-lucide-ticket" class="size-5 text-[#AF8F3C]/40" />
      </div>
      <p class="text-sm text-stone-500 dark:text-stone-400">
        Demandes, bugs et taches assignees
      </p>
      <p class="text-xs text-stone-400 dark:text-stone-600 mt-1">
        Fonctionnalite a venir
      </p>
    </div>
  </UCard>
</template>
