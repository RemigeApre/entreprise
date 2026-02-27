<script setup lang="ts">
import type { OffreEmploi, TypeContrat } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const { create } = useJobListings()
const toast = useToast()

const submitting = ref(false)

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

const showSalaire = ref(false)

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
      salaire_min: showSalaire.value ? form.salaire_min : null,
      salaire_max: showSalaire.value ? form.salaire_max : null,
      salaire_periode: showSalaire.value ? form.salaire_periode : null,
      competences_requises: form.competences_requises || null,
      avantages: form.avantages || null,
      publie: form.publie,
      date_expiration: form.date_expiration || null
    }

    if (form.publie) {
      payload.date_publication = new Date().toISOString()
    }

    const result = await create(payload)
    toast.add({ title: 'Offre creee avec succes', color: 'success' })
    navigateTo(`/offres/${result.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouvelle offre d'emploi">
      <template #right>
        <UButton
          label="Annuler"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/offres"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl space-y-6">
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
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Remuneration</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500 dark:text-stone-400">{{ showSalaire ? 'Affiche' : 'Non affiche' }}</span>
                <USwitch v-model="showSalaire" size="sm" />
              </div>
            </div>
          </template>

          <div v-if="showSalaire" class="space-y-4">
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
          <p v-else class="text-sm text-stone-500 dark:text-stone-400">
            Le salaire ne sera pas affiche sur l'offre.
          </p>
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
              Publier immediatement
            </span>
          </div>

          <div class="flex gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="subtle"
              to="/offres"
            />
            <UButton
              label="Creer l'offre"
              icon="i-lucide-check"
              :loading="submitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
