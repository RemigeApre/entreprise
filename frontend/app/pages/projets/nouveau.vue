<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { ProjectStatut, Category, Prospect } from '~/utils/types'
import { PROJECT_STATUTS } from '~/utils/constants'

const { $directus } = useNuxtApp()
const { create } = useProjects()
const { getAll: getAllProspects } = useProspects()
const toast = useToast()

const loading = ref(false)

const form = reactive({
  nom: '',
  description: '',
  statut: 'brouillon' as ProjectStatut,
  date_debut: '',
  date_fin: '',
  budget: null as number | null,
  categorie: null as string | null,
  client: null as string | null
})

// Fetch categories from Directus
const { data: categories } = useAsyncData('categories', async () => {
  return await $directus.request(readItems('categories', {
    fields: ['id', 'nom', 'couleur'],
    sort: ['nom'],
    limit: -1
  })) as Category[]
})

// Fetch prospects for client selection
const { data: prospects } = useAsyncData('prospects-list', getAllProspects)

const statutOptions = computed(() => {
  return Object.entries(PROJECT_STATUTS).map(([key, val]) => ({
    label: val.label,
    value: key
  }))
})

const categorieOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c: Category) => ({
    label: c.nom,
    value: c.id
  }))
})

const clientOptions = computed(() => {
  if (!prospects.value) return []
  return [
    { label: 'Aucun client', value: '' },
    ...prospects.value.map((p: Prospect) => ({
      label: p.nom_entreprise,
      value: p.id
    }))
  ]
})

async function handleSubmit() {
  if (!form.nom.trim()) {
    toast.add({ title: 'Le nom du projet est requis', color: 'error' })
    return
  }

  loading.value = true
  try {
    const data: Record<string, any> = {
      nom: form.nom.trim(),
      statut: form.statut
    }

    if (form.description.trim()) data.description = form.description.trim()
    if (form.date_debut) data.date_debut = form.date_debut
    if (form.date_fin) data.date_fin = form.date_fin
    if (form.budget !== null && form.budget > 0) data.budget = form.budget
    if (form.categorie) data.categorie = form.categorie
    if (form.client) data.client = form.client

    const project = await create(data)
    toast.add({ title: 'Projet cree avec succes', color: 'success' })
    await navigateTo(`/projets/${project.id}`)
  } catch (e) {
    toast.add({ title: 'Erreur lors de la creation du projet', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <UDashboardNavbar title="Nouveau projet">
      <template #right>
        <UButton
          label="Annuler"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/projets"
        />
      </template>
    </UDashboardNavbar>

    <div class="p-4 sm:p-6">
      <div class="max-w-2xl">
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Creer un nouveau projet
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Remplissez les informations du projet. Les champs marques d'un * sont obligatoires.
            </p>
          </template>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Nom -->
            <UFormField label="Nom du projet *">
              <UInput
                v-model="form.nom"
                placeholder="Nom du projet"
                icon="i-lucide-folder"
                class="w-full"
                required
              />
            </UFormField>

            <!-- Description -->
            <UFormField label="Description">
              <UTextarea
                v-model="form.description"
                placeholder="Description du projet..."
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <!-- Statut -->
            <UFormField label="Statut">
              <USelectMenu
                v-model="form.statut"
                :items="statutOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <!-- Dates -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Date de debut">
                <UInput
                  v-model="form.date_debut"
                  type="date"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Date de fin">
                <UInput
                  v-model="form.date_fin"
                  type="date"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Budget -->
            <UFormField label="Budget">
              <UInput
                v-model.number="form.budget"
                type="number"
                placeholder="0"
                icon="i-lucide-euro"
                :min="0"
                :step="100"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <!-- Categorie -->
            <UFormField label="Categorie">
              <USelectMenu
                v-model="form.categorie"
                :items="categorieOptions"
                value-key="value"
                placeholder="Selectionner une categorie"
                class="w-full"
              />
            </UFormField>

            <!-- Client -->
            <UFormField label="Client (prospect)">
              <USelectMenu
                v-model="form.client"
                :items="clientOptions"
                value-key="value"
                placeholder="Selectionner un client"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <!-- Actions -->
            <div class="flex items-center justify-end gap-3">
              <UButton
                label="Annuler"
                color="neutral"
                variant="ghost"
                to="/projets"
              />
              <UButton
                type="submit"
                label="Creer le projet"
                icon="i-lucide-plus"
                :loading="loading"
              />
            </div>
          </form>
        </UCard>
      </div>
    </div>
  </div>
</template>
