<script setup lang="ts">
import type { PlanningEntry } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'

const props = defineProps<{
  entry?: PlanningEntry
  periode: 'matin' | 'apres_midi'
  readonly?: boolean
  disabled?: boolean
  disabledReason?: string
  selected?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const displayKey = computed(() => {
  if (!props.entry) return null
  if (props.entry.type === 'travail' && props.entry.motif === 'Teletravail') return 'teletravail'
  return props.entry.type
})

const typeConfig = computed(() => {
  if (!displayKey.value) return null
  return PLANNING_TYPES[displayKey.value as keyof typeof PLANNING_TYPES] || PLANNING_TYPES[props.entry!.type]
})

const colorConfig = computed(() => {
  if (!displayKey.value) return null
  return PLANNING_COLORS[displayKey.value] || PLANNING_COLORS[props.entry!.type]
})

const isPending = computed(() => props.entry?.statut === 'en_attente')

const displayLabel = computed(() => {
  if (!props.entry) return ''
  if (displayKey.value === 'teletravail') return 'Teletravail'
  return props.entry.motif || typeConfig.value?.label || ''
})

const hasFill = computed(() => !!props.entry && !!colorConfig.value)

const selectedRing = 'ring-2 ring-primary ring-offset-1 dark:ring-offset-stone-900'

const slotClasses = computed(() => {
  const sel = props.selected ? ` ${selectedRing}` : ''
  if (props.disabled) {
    return 'border-dashed border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 text-stone-300 dark:text-stone-600 cursor-not-allowed'
  }
  if (hasFill.value) {
    const c = colorConfig.value!
    const base = `${c.border} ${c.bg} ${c.text}`
    return (isPending.value ? `${base} border-dashed opacity-60` : `${base} border-solid`) + sel
  }
  if (!props.readonly) {
    return 'border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-400 dark:hover:border-amber-600 text-stone-500 dark:text-stone-400 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/30' + sel
  }
  return 'border-dashed border-stone-300 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-default' + sel
})
</script>

<template>
  <UTooltip v-if="disabled && disabledReason" :text="disabledReason">
    <button
      class="w-full h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
      :class="slotClasses"
      disabled
    >
      <UIcon name="i-lucide-lock" class="size-3.5 shrink-0" />
    </button>
  </UTooltip>
  <button
    v-else
    class="w-full h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 text-xs font-medium"
    :class="slotClasses"
    :disabled="(readonly && !entry) || disabled"
    @click="emit('click')"
  >
    <template v-if="entry">
      <UIcon v-if="typeConfig?.icon" :name="typeConfig.icon" class="size-3.5 shrink-0" />
      <span class="truncate">{{ displayLabel }}</span>
      <UBadge v-if="isPending" size="xs" variant="subtle" color="yellow">
        ?
      </UBadge>
    </template>
    <template v-else-if="!readonly && !disabled">
      <UIcon name="i-lucide-plus" class="size-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
    </template>
  </button>
</template>
