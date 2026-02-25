<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: { date: string, periode: 'matin' | 'apres_midi' | 'journee' }]
}>()

const date = ref('')
const periode = ref<'matin' | 'apres_midi' | 'journee'>('journee')
const loading = ref(false)

const periodeOptions = [
  { label: 'Journee complete', value: 'journee' },
  { label: 'Matin', value: 'matin' },
  { label: 'Apres-midi', value: 'apres_midi' }
]

async function handleSubmit() {
  if (!date.value) return
  loading.value = true
  emit('submit', {
    date: date.value,
    periode: periode.value
  })
  loading.value = false
  date.value = ''
  periode.value = 'journee'
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ajouter un jour d'ecole
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UFormField label="Date">
            <UInput v-model="date" type="date" required />
          </UFormField>

          <UFormField label="Periode">
            <USelectMenu
              v-model="periode"
              :items="periodeOptions"
              value-key="value"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              label="Annuler"
              color="neutral"
              variant="ghost"
              @click="emit('update:open', false)"
            />
            <UButton
              type="submit"
              label="Ajouter"
              icon="i-lucide-graduation-cap"
              :loading="loading"
              :disabled="!date"
            />
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
