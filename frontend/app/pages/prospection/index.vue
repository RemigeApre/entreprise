<script setup lang="ts">
import type { Prospect, ProspectStatut, UserProfile } from '~/utils/types'

const { getAll } = useProspects()

const { data: prospects, status } = useAsyncData('prospects', getAll)

const search = ref('')
const statusFilter = ref<ProspectStatut | ''>('')

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  ...Object.entries(PROSPECT_STATUTS).map(([value, config]) => ({
    label: config.label,
    value
  }))
]

const filteredProspects = computed(() => {
  if (!prospects.value) return []
  return prospects.value.filter((p: Prospect) => {
    const q = search.value.toLowerCase()
    const matchesSearch = !q || [
      p.nom_entreprise,
      p.secteur,
      getProspecteurName(p)
    ].some(field => field?.toLowerCase().includes(q))

    const matchesStatus = !statusFilter.value || p.statut === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return ''
  const { first_name, last_name } = p.prospecteur
  return [first_name, last_name].filter(Boolean).join(' ')
}

function formatDateFr(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const columns = [
  { key: 'nom_entreprise', label: 'Entreprise' },
  { key: 'secteur', label: 'Secteur' },
  { key: 'statut', label: 'Statut' },
  { key: 'prospecteur', label: 'Prospecteur' },
  { key: 'date_premier_contact', label: 'Premier contact' }
]
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Prospection">
      <template #right>
        <div class="flex items-center gap-2">
          <UInput
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            class="w-64"
          />
          <USelectMenu
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            class="w-48"
          />
          <UButton
            label="Nouveau prospect"
            icon="i-lucide-plus"
            to="/prospection/nouveau"
          />
        </div>
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredProspects.length" class="text-center py-12">
        <UIcon name="i-lucide-target" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Aucun prospect trouve</p>
        <UButton
          label="Creer un prospect"
          icon="i-lucide-plus"
          variant="subtle"
          class="mt-4"
          to="/prospection/nouveau"
        />
      </div>

      <UTable
        v-else
        :data="filteredProspects"
        :columns="columns"
        class="cursor-pointer"
        @select="(row: Prospect) => navigateTo(`/prospection/${row.id}`)"
      >
        <template #nom_entreprise-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.original.nom_entreprise }}
          </span>
        </template>

        <template #secteur-cell="{ row }">
          <span class="text-gray-600 dark:text-gray-400">
            {{ row.original.secteur || '-' }}
          </span>
        </template>

        <template #statut-cell="{ row }">
          <UBadge
            :color="PROSPECT_STATUTS[row.original.statut]?.color"
            variant="subtle"
            size="sm"
          >
            {{ PROSPECT_STATUTS[row.original.statut]?.label }}
          </UBadge>
        </template>

        <template #prospecteur-cell="{ row }">
          {{ getProspecteurName(row.original) || '-' }}
        </template>

        <template #date_premier_contact-cell="{ row }">
          {{ formatDateFr(row.original.date_premier_contact) }}
        </template>
      </UTable>
    </div>
  </div>
</template>
