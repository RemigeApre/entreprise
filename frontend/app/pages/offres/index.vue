<script setup lang="ts">
import type { OffreEmploi } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const { getAll, togglePublish } = useJobListings()
const toast = useToast()

const { data: offres, status, refresh } = useAsyncData('offres-emploi', getAll)

const search = ref('')
const togglingId = ref<string | null>(null)

const filteredOffres = computed(() => {
  if (!offres.value) return []
  if (!search.value) return offres.value
  const q = search.value.toLowerCase()
  return offres.value.filter((o: OffreEmploi) =>
    o.titre.toLowerCase().includes(q)
    || o.localisation.toLowerCase().includes(q)
    || o.type_contrat.toLowerCase().includes(q)
  )
})

const columns = [
  { key: 'titre', label: 'Titre' },
  { key: 'type_contrat', label: 'Type de contrat' },
  { key: 'localisation', label: 'Localisation' },
  { key: 'publie', label: 'Publie' },
  { key: 'date_created', label: 'Date de creation' }
]

async function handleTogglePublish(offre: OffreEmploi) {
  togglingId.value = offre.id
  try {
    await togglePublish(offre.id, !offre.publie)
    toast.add({
      title: offre.publie ? 'Offre depubliee' : 'Offre publiee',
      color: 'success'
    })
    refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    togglingId.value = null
  }
}

function formatDateFr(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getContractColor(type: string) {
  const colors: Record<string, string> = {
    CDI: 'green',
    CDD: 'blue',
    Freelance: 'orange',
    Alternance: 'purple',
    Stage: 'yellow'
  }
  return colors[type] || 'neutral'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Offres d'emploi">
      <template #right>
        <UInput
          v-model="search"
          placeholder="Rechercher..."
          icon="i-lucide-search"
          class="w-64"
        />
        <UButton
          label="Nouvelle offre"
          icon="i-lucide-plus"
          to="/offres/nouveau"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredOffres.length" class="text-center py-12">
        <UIcon name="i-lucide-megaphone" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Aucune offre d'emploi trouvee</p>
        <UButton
          label="Creer une offre"
          icon="i-lucide-plus"
          class="mt-4"
          to="/offres/nouveau"
        />
      </div>

      <UTable
        v-else
        :data="filteredOffres"
        :columns="columns"
        class="w-full"
      >
        <template #titre-cell="{ row }">
          <NuxtLink
            :to="`/offres/${row.original.id}`"
            class="font-medium text-primary hover:underline"
          >
            {{ row.original.titre }}
          </NuxtLink>
        </template>

        <template #type_contrat-cell="{ row }">
          <UBadge
            :color="getContractColor(row.original.type_contrat)"
            variant="subtle"
            size="sm"
          >
            {{ row.original.type_contrat }}
          </UBadge>
        </template>

        <template #localisation-cell="{ row }">
          <span class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <UIcon name="i-lucide-map-pin" class="size-4" />
            {{ row.original.localisation }}
          </span>
        </template>

        <template #publie-cell="{ row }">
          <USwitch
            :model-value="row.original.publie"
            :loading="togglingId === row.original.id"
            @update:model-value="handleTogglePublish(row.original)"
          />
        </template>

        <template #date_created-cell="{ row }">
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateFr(row.original.date_created) }}
          </span>
        </template>
      </UTable>
    </div>
  </div>
</template>
