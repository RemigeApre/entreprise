<script setup lang="ts">
import type { OffreEmploi, TypeContrat, Category } from '~/utils/types'
import { CONTRACT_OPTIONS, SALAIRE_OPTIONS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const { create } = useJobListings()
const { getAll: getAllCategories } = useCategories()
const toast = useToast()

const submitting = ref(false)
const showSalaire = ref(false)

const { data: allCategories } = useAsyncData('categories-offre-nouveau', getAllCategories)
const selectedCategoryIds = ref<string[]>([])

const categoryOptions = computed(() =>
  (allCategories.value || []).map((c: Category) => ({ label: c.nom, value: c.id }))
)

const form = reactive({
  titre: '',
  duree: '',
  description: '',
  missions: '',
  type_contrat: 'CDI' as TypeContrat,
  localisation: '',
  teletravail: '',
  salaire_min: null as number | null,
  salaire_max: null as number | null,
  salaire_periode: 'mois' as 'heure' | 'mois' | 'annee',
  competences_requises: '',
  avantages: '',
  conditions: '',
  publie: false,
  date_expiration: ''
})

async function handleSubmit() {
  if (!form.titre || !form.localisation) {
    toast.add({ title: 'Titre et lieu sont obligatoires', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      titre: form.titre,
      duree: form.duree || null,
      description: form.description || null,
      missions: form.missions || null,
      type_contrat: form.type_contrat,
      localisation: form.localisation,
      teletravail: form.teletravail || null,
      salaire_min: showSalaire.value ? form.salaire_min : null,
      salaire_max: showSalaire.value ? form.salaire_max : null,
      salaire_periode: showSalaire.value ? form.salaire_periode : null,
      competences_requises: form.competences_requises || null,
      avantages: form.avantages || null,
      conditions: form.conditions || null,
      publie: form.publie,
      date_expiration: form.date_expiration || null
    }

    if (form.publie) {
      payload.date_publication = new Date().toISOString()
    }

    if (selectedCategoryIds.value.length) {
      payload.categories = selectedCategoryIds.value.map(id => ({ categories_id: id }))
    }

    const result = await create(payload as Partial<OffreEmploi>)
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
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/offres" />
      </template>
      <template #right>
        <UButton
          label="Creer"
          icon="i-lucide-check"
          size="sm"
          :loading="submitting"
          @click="handleSubmit"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">

        <!-- Informations générales -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Informations generales</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Titre *">
              <UInput v-model="form.titre" placeholder="Ex: Developpeur Full Stack" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Type de contrat *">
                <USelectMenu v-model="form.type_contrat" :items="CONTRACT_OPTIONS" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Duree">
                <UInput v-model="form.duree" placeholder="Ex: 6 mois, 1 an, 2 ans" class="w-full" />
              </UFormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Lieu *">
                <UInput v-model="form.localisation" placeholder="Ex: Lyon, France" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>
              <UFormField label="Teletravail">
                <UInput v-model="form.teletravail" placeholder="Ex: 2j/sem, 100%, Non" icon="i-lucide-laptop" class="w-full" />
              </UFormField>
            </div>

            <UFormField label="Categories">
              <USelectMenu
                v-model="selectedCategoryIds"
                :items="categoryOptions"
                value-key="value"
                multiple
                placeholder="Selectionner des categories..."
                class="w-full"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Présentation de l'entreprise -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Presentation de l'entreprise</h3>
          </template>
          <UTextarea
            v-model="form.description"
            placeholder="Presentez le groupe Le Geai, ses valeurs, son activite..."
            :rows="5"
            class="w-full"
          />
        </UCard>

        <!-- Missions -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Missions</h3>
          </template>
          <UTextarea
            v-model="form.missions"
            placeholder="Decrivez les missions confiees au poste..."
            :rows="5"
            class="w-full"
          />
        </UCard>

        <!-- Attendus -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Attendus</h3>
          </template>
          <UTextarea
            v-model="form.competences_requises"
            placeholder="Profil recherche, competences, experiences..."
            :rows="4"
            class="w-full"
          />
        </UCard>

        <!-- Ce que vous gagnez -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Ce que vous gagnez</h3>
          </template>
          <UTextarea
            v-model="form.avantages"
            placeholder="Avantages, ambiance, perspectives, teletravail..."
            :rows="4"
            class="w-full"
          />
        </UCard>

        <!-- Rémunération -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-stone-900">Remuneration</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500">{{ showSalaire ? 'Affiche' : 'Non affiche' }}</span>
                <USwitch v-model="showSalaire" size="sm" />
              </div>
            </div>
          </template>
          <div v-if="showSalaire" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormField label="Salaire minimum">
                <UInput v-model.number="form.salaire_min" type="number" placeholder="Ex: 35000" class="w-full" />
              </UFormField>
              <UFormField label="Salaire maximum">
                <UInput v-model.number="form.salaire_max" type="number" placeholder="Ex: 45000" class="w-full" />
              </UFormField>
              <UFormField label="Periode">
                <USelectMenu v-model="form.salaire_periode" :items="SALAIRE_OPTIONS" value-key="value" class="w-full" />
              </UFormField>
            </div>
          </div>
          <p v-else class="text-sm text-stone-500">La remuneration ne sera pas affichee sur l'offre.</p>
        </UCard>

        <!-- Conditions -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Conditions</h3>
          </template>
          <div class="space-y-4">
            <UTextarea
              v-model="form.conditions"
              placeholder="Conditions particulieres, prise de poste, modalites..."
              :rows="3"
              class="w-full"
            />
            <UFormField label="Date d'expiration de l'offre">
              <UInput v-model="form.date_expiration" type="date" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <div class="flex items-center gap-3">
          <USwitch v-model="form.publie" />
          <span class="text-sm text-stone-700">Publier immediatement</span>
        </div>
      </div>
    </div>
  </div>
</template>
