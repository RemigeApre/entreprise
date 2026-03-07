<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="page-header">
    <div class="flex items-center gap-2 z-10">
      <slot name="left" />
    </div>

    <span v-if="title" class="page-header-title">
      {{ title }}
    </span>

    <div class="flex items-center gap-2 z-10">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  position: relative;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(175, 143, 60, 0.08);
  flex-shrink: 0;
}
.page-header-title {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: #2c2419;
  opacity: 0.65;
}
:global(.dark) .page-header-title {
  color: #e8e0d0;
  opacity: 0.55;
}
</style>
