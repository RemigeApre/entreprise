<script setup lang="ts">
import type { OffreEmploi, TypeContrat } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const route = useRoute()
const { getById, update, remove, togglePublish } = useJobListings()
const toast = useToast()

const offreId = route.params.id as string

const { data: offre, status } = useAsyncData(`offre-${offreId}`, () => getById(offreId))

const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

const contractOptions = [
  { label: 'CDI', value: 'CDI' },
  { label: 'CDD', value: 'CDD' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Alternance', value: 'Alternance' },
  { label: 'Stage', value: 'Stage' }
]

const salaireOptions = [
  { label: 'Par heure', value: 'heure' },
  { label: 'Par mois', value: 'mois' },
  { label: 'Par annee', value: 'annee' }
]

const form = reactive({
  titre: '',
  description: '',
  type_contrat: 'CDI' as TypeContrat,
  localisation: '',
  salaire_min: null as number | null,
  salaire_max: null as number | null,
  salaire_periode: 'mois' as 'heure' | 'mois' | 'annee',
  competences_requises: '',
  avantages: '',
  publie: false,
  date_expiration: ''
})

watch(offre, (val) => {
  if (val) {
    form.titre = val.titre
    form.description = val.description
    form.type_contrat = val.type_contrat
    form.localisation = val.localisation
    form.salaire_min = val.salaire_min
    form.salaire_max = val.salaire_max
    form.salaire_periode = val.salaire_periode || 'mois'
    form.competences_requises = val.competences_requises || ''
    form.avantages = val.avantages || ''
    form.publie = val.publie
    form.date_expiration = val.date_expiration ? val.date_expiration.split('T')[0] : ''
  }
}, { immediate: true })

async function handleSubmit() {
  if (!form.titre || !form.description || !form.localisation) {
    toast.add({ title: 'Veuillez remplir tous les champs obligatoires', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const payload: Partial<OffreEmploi> = {
      titre: form.titre,
      description: form.description,
      type_contrat: form.type_contrat,
      localisation: form.localisation,
      salaire_min: form.salaire_min,
      salaire_max: form.salaire_max,
      salaire_periode: form.salaire_periode,
      competences_requises: form.competences_requises || null,
      avantages: form.avantages || null,
      publie: form.publie,
      date_expiration: form.date_expiration || null
    }

    // If toggling to published and wasn't published before
    if (form.publie && offre.value && !offre.value.publie) {
      payload.date_publication = new Date().toISOString()
    }

    await update(offreId, payload)
    toast.add({ title: 'Offre mise a jour avec succes', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await remove(offreId)
    toast.add({ title: 'Offre supprimee', color: 'success' })
    navigateTo('/offres')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Modifier l'offre">
      <template #right>
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/offres"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="offre" class="max-w-2xl space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Informations generales</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Titre" required>
              <UInput
                v-model="form.titre"
                placeholder="Ex: Developpeur Full Stack"
              />
            </UFormField>

            <UFormField label="Description" required>
              <UTextarea
                v-model="form.description"
                placeholder="Decrivez le poste en detail..."
                :rows="6"
              />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Type de contrat" required>
                <USelectMenu
                  v-model="form.type_contrat"
                  :items="contractOptions"
                  value-key="value"
                />
              </UFormField>

              <UFormField label="Localisation" required>
                <UInput
                  v-model="form.localisation"
                  placeholder="Ex: Paris, France"
                  icon="i-lucide-map-pin"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Remuneration</h3>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormField label="Salaire minimum">
                <UInput
                  v-model.number="form.salaire_min"
                  type="number"
                  placeholder="Ex: 35000"
                />
              </UFormField>

              <UFormField label="Salaire maximum">
                <UInput
                  v-model.number="form.salaire_max"
                  type="number"
                  placeholder="Ex: 45000"
                />
              </UFormField>

              <UFormField label="Periode">
                <USelectMenu
                  v-model="form.salaire_periode"
                  :items="salaireOptions"
                  value-key="value"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Details complementaires</h3>
          </template>

          <div class="space-y-4">
            <UFormField label="Competences requises">
              <UTextarea
                v-model="form.competences_requises"
                placeholder="Listez les competences attendues..."
                :rows="4"
              />
            </UFormField>

            <UFormField label="Avantages">
              <UTextarea
                v-model="form.avantages"
                placeholder="Ex: Teletravail, tickets restaurant, mutuelle..."
                :rows="3"
              />
            </UFormField>

            <UFormField label="Date d'expiration">
              <UInput
                v-model="form.date_expiration"
                type="date"
              />
            </UFormField>
          </div>
        </UCard>

        <USeparator />

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <USwitch v-model="form.publie" />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              {{ form.publie ? 'Publiee' : 'Brouillon' }}
            </span>
          </div>

          <div class="flex gap-3">
            <UButton
              label="Supprimer"
              icon="i-lucide-trash-2"
              color="red"
              variant="subtle"
              @click="showDeleteModal = true"
            />
            <UButton
              label="Enregistrer"
              icon="i-lucide-check"
              :loading="submitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-file-x" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Offre introuvable</p>
        <UButton
          label="Retour aux offres"
          icon="i-lucide-arrow-left"
          class="mt-4"
          variant="subtle"
          to="/offres"
        />
      </div>
    </div>

    <!-- Confirmation de suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Supprimer cette offre</h3>
          </div>

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Etes-vous sur de vouloir supprimer l'offre <strong>{{ offre?.titre }}</strong> ?
            Cette action est irreversible.
          </p>

          <div class="flex justify-end gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              @click="showDeleteModal = false"
            />
            <UButton
              label="Supprimer"
              icon="i-lucide-trash-2"
              color="red"
              :loading="deleting"
              @click="handleDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
