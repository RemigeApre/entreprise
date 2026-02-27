<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="relative h-12 flex items-center justify-between px-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
    <!-- Left slot -->
    <div class="flex items-center gap-2 z-10">
      <slot name="left" />
    </div>

    <!-- Centered title (absolute so it's always perfectly centered) -->
    <span
      v-if="title"
      class="absolute inset-0 flex items-center justify-center pointer-events-none font-heading font-bold text-lg tracking-tight text-stone-900 dark:text-white"
    >
      {{ title }}
    </span>

    <!-- Right slot -->
    <div class="flex items-center gap-2 z-10">
      <slot name="right" />
    </div>
  </div>
</template>
