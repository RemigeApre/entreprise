<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'

const props = defineProps<{
  entry?: PlanningEntry
  periode: 'matin' | 'apres_midi'
  readonly?: boolean
  disabled?: boolean
  disabledReason?: string
}>()

const emit = defineEmits<{
  click: []
}>()

const typeConfig = computed(() => {
  if (!props.entry) return null
  return PLANNING_TYPES[props.entry.type]
})

const colorConfig = computed(() => {
  if (!props.entry) return null
  return PLANNING_COLORS[props.entry.type]
})

const isPending = computed(() => props.entry?.statut === 'en_attente')

const slotClasses = computed(() => {
  if (props.disabled) {
    return 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900/50 text-stone-300 dark:text-stone-600 cursor-not-allowed'
  }
  if (props.entry && colorConfig.value) {
    const c = colorConfig.value
    return `${c.border} ${c.bg} ${c.text}${isPending.value ? ' opacity-60 border-dashed' : ''}`
  }
  if (!props.readonly) {
    return 'border-stone-200 dark:border-stone-800 hover:border-primary-300 dark:hover:border-primary-700 text-stone-400 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-950'
  }
  return 'border-stone-200 dark:border-stone-800 text-stone-400 cursor-default'
})
</script>

<template>
  <UTooltip v-if="disabled && disabledReason" :text="disabledReason">
    <button
      class="w-full h-12 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
      :class="slotClasses"
      disabled
    >
      <UIcon name="i-lucide-lock" class="size-3.5" />
    </button>
  </UTooltip>
  <button
    v-else
    class="w-full h-12 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
    :class="slotClasses"
    :disabled="(readonly && !entry) || disabled"
    @click="emit('click')"
  >
    <template v-if="entry">
      <UIcon v-if="typeConfig?.icon" :name="typeConfig.icon" class="size-3.5" />
      <span>{{ entry.motif || typeConfig?.label }}</span>
      <UBadge v-if="isPending" size="xs" variant="subtle" color="yellow">
        ?
      </UBadge>
    </template>
    <template v-else-if="!readonly && !disabled">
      <UIcon name="i-lucide-plus" class="size-3.5" />
    </template>
  </button>
</template>
