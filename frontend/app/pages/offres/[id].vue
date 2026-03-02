<script setup lang="ts">
import type { OffreEmploi, TypeContrat } from '~/utils/types'
import { CONTRACT_OPTIONS, SALAIRE_OPTIONS, CONTRACT_COLORS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const route = useRoute()
const { getById, update, remove } = useJobListings()
const toast = useToast()

const offreId = route.params.id as string

const { data: offre, status, refresh } = useAsyncData(`offre-${offreId}`, () => getById(offreId))

// ---- Edition ----
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)
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

function startEditing() {
  if (!offre.value) return
  const val = offre.value
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
  showSalaire.value = !!(val.salaire_min || val.salaire_max)
  isEditing.value = true
}

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

    if (form.publie && offre.value && !offre.value.publie) {
      payload.date_publication = new Date().toISOString()
    }

    await update(offreId, payload)
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
    day: 'numeric',
    month: 'long',
    year: 'numeric'
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
              <h2 class="text-xl font-bold text-stone-900 dark:text-white">{{ offre.titre }}</h2>
              <UBadge :color="CONTRACT_COLORS[offre.type_contrat] || 'neutral'" variant="subtle">
                {{ offre.type_contrat }}
              </UBadge>
              <UBadge :color="offre.publie ? 'green' : 'neutral'" variant="subtle" size="sm">
                {{ offre.publie ? 'Publiee' : 'Brouillon' }}
              </UBadge>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-map-pin" class="size-3.5" />
                {{ offre.localisation }}
              </span>
              <span v-if="formatSalaire(offre)" class="flex items-center gap-1.5">
                <UIcon name="i-lucide-banknote" class="size-3.5" />
                {{ formatSalaire(offre) }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-xs text-stone-400 dark:text-stone-500">
              <span>Creee le {{ formatDateLong(offre.date_created) }}</span>
              <span v-if="offre.date_publication">Publiee le {{ formatDateLong(offre.date_publication) }}</span>
              <span v-if="offre.date_expiration">Expire le {{ formatDateLong(offre.date_expiration) }}</span>
            </div>
          </div>
        </UCard>

        <!-- Description -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Description</h3>
          </template>
          <p class="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">{{ offre.description }}</p>
        </UCard>

        <!-- Competences & Avantages -->
        <UCard v-if="offre.competences_requises || offre.avantages">
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Details complementaires</h3>
          </template>
          <div class="space-y-4">
            <div v-if="offre.competences_requises">
              <span class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Competences requises</span>
              <p class="mt-1 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">{{ offre.competences_requises }}</p>
            </div>
            <div v-if="offre.avantages">
              <span class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Avantages</span>
              <p class="mt-1 text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">{{ offre.avantages }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- ==================== MODE EDITION ==================== -->
      <div v-else-if="offre && isEditing" class="max-w-2xl mx-auto space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Informations generales</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Titre *">
              <UInput v-model="form.titre" placeholder="Ex: Developpeur Full Stack" class="w-full" />
            </UFormField>
            <UFormField label="Description *">
              <UTextarea v-model="form.description" placeholder="Decrivez le poste en detail..." :rows="6" class="w-full" />
            </UFormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Type de contrat *">
                <USelectMenu v-model="form.type_contrat" :items="CONTRACT_OPTIONS" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Localisation *">
                <UInput v-model="form.localisation" placeholder="Ex: Lyon, France" icon="i-lucide-map-pin" class="w-full" />
              </UFormField>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Remuneration</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500 dark:text-stone-400">{{ showSalaire ? 'Affiche' : 'Non affiche' }}</span>
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
          <p v-else class="text-sm text-stone-500 dark:text-stone-400">
            Le salaire ne sera pas affiche sur l'offre.
          </p>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Details complementaires</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Competences requises">
              <UTextarea v-model="form.competences_requises" placeholder="Listez les competences attendues..." :rows="4" class="w-full" />
            </UFormField>
            <UFormField label="Avantages">
              <UTextarea v-model="form.avantages" placeholder="Ex: Teletravail, tickets restaurant, mutuelle..." :rows="3" class="w-full" />
            </UFormField>
            <UFormField label="Date d'expiration">
              <UInput v-model="form.date_expiration" type="date" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <div class="flex items-center gap-3">
          <USwitch v-model="form.publie" />
          <span class="text-sm text-stone-700 dark:text-stone-300">
            {{ form.publie ? 'Publiee' : 'Brouillon' }}
          </span>
        </div>
      </div>

      <!-- Not found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-file-x" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p class="text-stone-500 dark:text-stone-400">Offre introuvable</p>
        <UButton label="Retour aux offres" icon="i-lucide-arrow-left" class="mt-4" variant="subtle" to="/offres" />
      </div>
    </div>

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900 dark:text-white">Supprimer cette offre</h3>
          </div>
          <p class="text-sm text-stone-500 dark:text-stone-400">
            Etes-vous sur de vouloir supprimer l'offre <strong>{{ offre?.titre }}</strong> ?
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
