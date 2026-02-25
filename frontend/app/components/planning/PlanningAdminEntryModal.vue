<script setup lang="ts">
import type { PlanningEntry, PlanningPeriode, PlanningType } from '~/utils/types'
import { PLANNING_TYPES } from '~/utils/constants'

const props = defineProps<{
  open: boolean
  entry?: PlanningEntry | null
  defaultDate?: string
  defaultPeriode?: 'matin' | 'apres_midi'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [data: { date: string, periode: PlanningPeriode, type: PlanningType, motif?: string, heures?: number }]
  delete: [id: string]
}>()

const typeOptions = Object.entries(PLANNING_TYPES).map(([value, config]) => ({
  label: config.label,
  value
}))

const periodeOptions = [
  { label: 'Matin', value: 'matin' },
  { label: 'Apres-midi', value: 'apres_midi' }
]

const formType = ref<PlanningType>('travail')
const formDate = ref('')
const formPeriode = ref<PlanningPeriode>('matin')
const formMotif = ref('')
const formHeures = ref<number | undefined>(undefined)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.entry) {
      formType.value = props.entry.type
      formDate.value = props.entry.date
      formPeriode.value = props.entry.periode
      formMotif.value = props.entry.motif || ''
      formHeures.value = props.entry.heures || undefined
    } else {
      formType.value = 'travail'
      formDate.value = props.defaultDate || ''
      formPeriode.value = props.defaultPeriode || 'matin'
      formMotif.value = ''
      formHeures.value = undefined
    }
  }
})

function handleSubmit() {
  if (!formDate.value || !formPeriode.value || !formType.value) return

  const data: { date: string, periode: PlanningPeriode, type: PlanningType, motif?: string, heures?: number } = {
    date: formDate.value,
    periode: formPeriode.value,
    type: formType.value
  }

  if (formMotif.value) data.motif = formMotif.value
  if (formHeures.value !== undefined && formHeures.value > 0) data.heures = formHeures.value

  emit('save', data)
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-4">
          {{ entry ? 'Modifier l\'entree' : 'Ajouter une entree' }}
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UFormField label="Type">
            <USelectMenu
              v-model="formType"
              :items="typeOptions"
              value-key="value"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date">
              <UInput v-model="formDate" type="date" required />
            </UFormField>
            <UFormField label="Periode">
              <USelectMenu
                v-model="formPeriode"
                :items="periodeOptions"
                value-key="value"
              />
            </UFormField>
          </div>

          <UFormField label="Motif (optionnel)">
            <UTextarea v-model="formMotif" placeholder="Motif ou commentaire..." />
          </UFormField>

          <UFormField label="Heures (optionnel)">
            <UInput v-model.number="formHeures" type="number" step="0.5" min="0" max="8" placeholder="Ex: 3.5" />
          </UFormField>

          <div class="flex justify-between pt-2">
            <UButton
              v-if="entry"
              label="Supprimer"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="emit('delete', entry.id)"
            />
            <div v-else />
            <div class="flex gap-2">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                @click="emit('update:open', false)"
              />
              <UButton
                type="submit"
                :label="entry ? 'Modifier' : 'Ajouter'"
                icon="i-lucide-check"
              />
            </div>
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
