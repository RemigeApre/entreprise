<script setup lang="ts">
import type { OffreEmploi, TypeContrat, Category } from '~/utils/types'
import { CONTRACT_OPTIONS, SALAIRE_OPTIONS, CONTRACT_COLORS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const route = useRoute()
const { getById, update, remove } = useJobListings()
const { getAll: getAllCategories } = useCategories()
const toast = useToast()

const offreId = route.params.id as string

const { data: offre, status, refresh } = useAsyncData(`offre-${offreId}`, () => getById(offreId))
const { data: allCategories } = useAsyncData('categories', getAllCategories)

const selectedCategoryIds = ref<string[]>([])

const categoryOptions = computed(() =>
  (allCategories.value || []).map((c: Category) => ({ label: c.nom, value: c.id }))
)

function getOffreCategories(o: OffreEmploi): Category[] {
  if (!o.categories?.length) return []
  return o.categories
    .map(j => typeof j.categories_id === 'object' ? j.categories_id : null)
    .filter((c): c is Category => c !== null)
}

// ---- Edition ----
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
const showSalaire = ref(false)

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

function startEditing() {
  if (!offre.value) return
  const val = offre.value
  form.titre = val.titre
  form.duree = val.duree || ''
  form.description = val.description
  form.missions = val.missions || ''
  form.type_contrat = val.type_contrat
  form.localisation = val.localisation
  form.teletravail = val.teletravail || ''
  form.salaire_min = val.salaire_min
  form.salaire_max = val.salaire_max
  form.salaire_periode = val.salaire_periode || 'mois'
  form.competences_requises = val.competences_requises || ''
  form.avantages = val.avantages || ''
  form.conditions = val.conditions || ''
  form.publie = val.publie
  form.date_expiration = val.date_expiration ? val.date_expiration.split('T')[0] : ''
  showSalaire.value = !!(val.salaire_min || val.salaire_max)
  selectedCategoryIds.value = getOffreCategories(val).map(c => c.id)
  isEditing.value = true
}

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
      date_expiration: form.date_expiration || null,
      categories: selectedCategoryIds.value.map(id => ({ categories_id: id }))
    }

    if (form.publie && offre.value && !offre.value.publie) {
      payload.date_publication = new Date().toISOString()
    }

    await update(offreId, payload as Partial<OffreEmploi>)
    toast.add({ title: 'Offre mise a jour', color: 'success' })
    isEditing.value = false
    await refresh()
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

function formatDateLong(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatSalaire(o: OffreEmploi) {
  if (!o.salaire_min && !o.salaire_max) return null
  const periodeLabel = SALAIRE_OPTIONS.find(p => p.value === o.salaire_periode)?.label?.toLowerCase() || ''
  if (o.salaire_min && o.salaire_max) {
    return `${o.salaire_min.toLocaleString('fr-FR')} - ${o.salaire_max.toLocaleString('fr-FR')} EUR ${periodeLabel}`
  }
  if (o.salaire_min) return `A partir de ${o.salaire_min.toLocaleString('fr-FR')} EUR ${periodeLabel}`
  return `Jusqu'a ${o.salaire_max!.toLocaleString('fr-FR')} EUR ${periodeLabel}`
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="offre?.titre || 'Offre'">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/offres" />
      </template>
      <template #right>
        <template v-if="!isEditing && offre">
          <UButton label="Modifier" icon="i-lucide-pencil" size="sm" variant="subtle" @click="startEditing" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="showDeleteModal = true" />
        </template>
        <template v-if="isEditing">
          <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="isEditing = false" />
          <UButton label="Enregistrer" icon="i-lucide-check" size="sm" :loading="submitting" @click="handleSubmit" />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- ==================== MODE LECTURE ==================== -->
      <div v-else-if="offre && !isEditing" class="max-w-2xl mx-auto space-y-6">
        <!-- En-tete -->
        <UCard>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-bold text-stone-900">{{ offre.titre }}</h2>
              <UBadge :color="CONTRACT_COLORS[offre.type_contrat] || 'neutral'" variant="subtle">
                {{ offre.type_contrat }}
              </UBadge>
              <UBadge :color="offre.publie ? 'green' : 'neutral'" variant="subtle" size="sm">
                {{ offre.publie ? 'Publiee' : 'Brouillon' }}
              </UBadge>
              <UBadge
                v-for="cat in getOffreCategories(offre)"
                :key="cat.id"
                variant="outline"
                size="sm"
                :style="cat.couleur ? { borderColor: cat.couleur + '80', color: cat.couleur } : {}"
              >
                {{ cat.nom }}
              </UBadge>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-sm text-stone-500">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-map-pin" class="size-3.5" />
                {{ offre.localisation }}
              </span>
              <span v-if="offre.duree" class="flex items-center gap-1.5">
                <UIcon name="i-lucide-timer" class="size-3.5" />
                {{ offre.duree }}
              </span>
              <span v-if="offre.teletravail" class="flex items-center gap-1.5">
                <UIcon name="i-lucide-laptop" class="size-3.5" />
                Teletravail {{ offre.teletravail }}
              </span>
              <span v-if="formatSalaire(offre)" class="flex items-center gap-1.5">
                <UIcon name="i-lucide-banknote" class="size-3.5" />
                {{ formatSalaire(offre) }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-xs text-stone-400">
              <span>Creee le {{ formatDateLong(offre.date_created) }}</span>
              <span v-if="offre.date_publication">Publiee le {{ formatDateLong(offre.date_publication) }}</span>
              <span v-if="offre.date_expiration">Expire le {{ formatDateLong(offre.date_expiration) }}</span>
            </div>
          </div>
        </UCard>

        <UCard v-if="offre.description">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Presentation de l'entreprise</h3>
          </template>
          <p class="text-sm text-stone-700 whitespace-pre-line">{{ offre.description }}</p>
        </UCard>

        <UCard v-if="offre.missions">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Missions</h3>
          </template>
          <p class="text-sm text-stone-700 whitespace-pre-line">{{ offre.missions }}</p>
        </UCard>

        <UCard v-if="offre.competences_requises">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Attendus</h3>
          </template>
          <p class="text-sm text-stone-700 whitespace-pre-line">{{ offre.competences_requises }}</p>
        </UCard>

        <UCard v-if="offre.avantages">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Ce que vous gagnez</h3>
          </template>
          <p class="text-sm text-stone-700 whitespace-pre-line">{{ offre.avantages }}</p>
        </UCard>

        <UCard v-if="formatSalaire(offre) || offre.conditions">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Conditions</h3>
          </template>
          <div class="space-y-3 text-sm text-stone-700">
            <p v-if="formatSalaire(offre)" class="flex items-center gap-2">
              <UIcon name="i-lucide-banknote" class="size-4 text-stone-400" />
              {{ formatSalaire(offre) }}
            </p>
            <p v-if="offre.conditions" class="whitespace-pre-line">{{ offre.conditions }}</p>
          </div>
        </UCard>

        <div class="p-3 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-500">
          Contact : <strong class="text-stone-700">administration@legeai-editions.com</strong>
        </div>
      </div>

      <!-- ==================== MODE EDITION ==================== -->
      <div v-else-if="offre && isEditing" class="max-w-2xl mx-auto space-y-6">

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
          <UTextarea v-model="form.description" placeholder="Presentez le groupe Le Geai, ses valeurs, son activite..." :rows="5" class="w-full" />
        </UCard>

        <!-- Missions -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Missions</h3>
          </template>
          <UTextarea v-model="form.missions" placeholder="Decrivez les missions confiees au poste..." :rows="5" class="w-full" />
        </UCard>

        <!-- Attendus -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Attendus</h3>
          </template>
          <UTextarea v-model="form.competences_requises" placeholder="Profil recherche, competences, experiences..." :rows="4" class="w-full" />
        </UCard>

        <!-- Ce que vous gagnez -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Ce que vous gagnez</h3>
          </template>
          <UTextarea v-model="form.avantages" placeholder="Avantages, ambiance, perspectives, teletravail..." :rows="4" class="w-full" />
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
            <UTextarea v-model="form.conditions" placeholder="Conditions particulieres, prise de poste, modalites..." :rows="3" class="w-full" />
            <UFormField label="Date d'expiration de l'offre">
              <UInput v-model="form.date_expiration" type="date" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <div class="flex items-center gap-3">
          <USwitch v-model="form.publie" />
          <span class="text-sm text-stone-700">{{ form.publie ? 'Publiee' : 'Brouillon' }}</span>
        </div>
      </div>

      <!-- Not found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-file-x" class="size-10 text-stone-300 mx-auto mb-3" />
        <p class="text-stone-500">Offre introuvable</p>
        <UButton label="Retour aux offres" icon="i-lucide-arrow-left" class="mt-4" variant="subtle" to="/offres" />
      </div>
    </div>

    <!-- Modal suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900">Supprimer cette offre</h3>
          </div>
          <p class="text-sm text-stone-500">
            Etes-vous sur de vouloir supprimer <strong>{{ offre?.titre }}</strong> ?
            Cette action est irreversible.
          </p>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="subtle" @click="showDeleteModal = false" />
            <UButton label="Supprimer" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
