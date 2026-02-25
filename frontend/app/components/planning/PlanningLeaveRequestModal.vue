<script setup lang="ts">
import type { CongeType, PlanningPeriode } from '~/utils/types'
import { isDateInContractPeriod } from '~/utils/dates'

const props = defineProps<{
  open: boolean
  contractStart?: string | null
  contractEnd?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: {
    date_debut: string
    date_fin: string
    periode_debut: PlanningPeriode
    periode_fin: PlanningPeriode
    motif: string
    type_conge: CongeType
  }]
}>()

const dateDebut = ref('')
const dateFin = ref('')
const periodeDebut = ref<PlanningPeriode>('matin')
const periodeFin = ref<PlanningPeriode>('apres_midi')
const motif = ref('')
const typeConge = ref<CongeType>('conge_paye')
const loading = ref(false)

const congeTypeOptions = [
  { label: 'Conge paye', value: 'conge_paye' },
  { label: 'RTT', value: 'rtt' },
  { label: 'Maladie', value: 'maladie' },
  { label: 'Arret maladie', value: 'arret_maladie' },
  { label: 'Sans solde', value: 'sans_solde' },
  { label: 'Autre', value: 'autre' }
]

const periodeOptions = [
  { label: 'Matin', value: 'matin' },
  { label: 'Apres-midi', value: 'apres_midi' }
]

const contractError = computed(() => {
  if (!dateDebut.value) return null
  const checkStart = isDateInContractPeriod(dateDebut.value, props.contractStart, props.contractEnd)
  if (!checkStart.valid) return checkStart.reason
  if (dateFin.value) {
    const checkEnd = isDateInContractPeriod(dateFin.value, props.contractStart, props.contractEnd)
    if (!checkEnd.valid) return checkEnd.reason
  }
  return null
})

const halfDayCount = computed(() => {
  if (!dateDebut.value || !dateFin.value || dateDebut.value > dateFin.value) return 0
  const start = new Date(dateDebut.value)
  const end = new Date(dateFin.value)
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      const isFirst = current.getTime() === start.getTime()
      const isLast = current.getTime() === end.getTime()
      const includeMatin = !isFirst || periodeDebut.value === 'matin'
      const includePM = !isLast || periodeFin.value === 'apres_midi'
      if (includeMatin) count++
      if (includePM) count++
    }
    current.setDate(current.getDate() + 1)
  }
  return count
})

const isValid = computed(() => {
  return dateDebut.value && dateFin.value && motif.value && dateDebut.value <= dateFin.value && !contractError.value && halfDayCount.value > 0
})

function handleSubmit() {
  if (!isValid.value) return
  loading.value = true
  emit('submit', {
    date_debut: dateDebut.value,
    date_fin: dateFin.value,
    periode_debut: periodeDebut.value,
    periode_fin: periodeFin.value,
    motif: motif.value,
    type_conge: typeConge.value
  })
  loading.value = false
  dateDebut.value = ''
  dateFin.value = ''
  periodeDebut.value = 'matin'
  periodeFin.value = 'apres_midi'
  motif.value = ''
  typeConge.value = 'conge_paye'
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-4">
          Demander un conge
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <UFormField label="Type de conge">
            <USelectMenu
              v-model="typeConge"
              :items="congeTypeOptions"
              value-key="value"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date de debut">
              <UInput v-model="dateDebut" type="date" required />
            </UFormField>
            <UFormField label="A partir de">
              <USelectMenu
                v-model="periodeDebut"
                :items="periodeOptions"
                value-key="value"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Date de fin">
              <UInput v-model="dateFin" type="date" required />
            </UFormField>
            <UFormField label="Jusqu'a">
              <USelectMenu
                v-model="periodeFin"
                :items="periodeOptions"
                value-key="value"
              />
            </UFormField>
          </div>

          <p v-if="contractError" class="text-sm text-red-500 flex items-center gap-1.5">
            <UIcon name="i-lucide-alert-triangle" class="size-4" />
            {{ contractError }}
          </p>

          <p v-if="halfDayCount > 0" class="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <UIcon name="i-lucide-calendar-days" class="size-4" />
            {{ halfDayCount }} demi-journee{{ halfDayCount > 1 ? 's' : '' }} de conge
          </p>

          <UFormField label="Motif">
            <UTextarea v-model="motif" placeholder="Raison de la demande..." required />
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
              label="Envoyer la demande"
              icon="i-lucide-send"
              :loading="loading"
              :disabled="!isValid"
            />
          </div>
        </form>
      </div>
    </template>
  </UModal>
</template>
