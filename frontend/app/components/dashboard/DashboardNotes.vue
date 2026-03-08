<script setup lang="ts">
// Placeholder — les notes seront connectees a Directus prochainement
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sticky-note" class="size-3.5 text-[#AF8F3C]/60" />
          <h3 class="text-xs font-semibold">Notes</h3>
        </div>
        <UBadge variant="subtle" color="amber" size="xs">Bientot</UBadge>
      </div>
    </template>

    <div class="py-3 text-center">
      <p class="text-xs text-stone-400 dark:text-stone-500 leading-relaxed">
        Notes rapides et rappels
      </p>
    </div>
  </UCard>
</template>
