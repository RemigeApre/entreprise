<script setup lang="ts">
import type { Candidat, CandidatStatut } from '~/utils/types'
import { CANDIDAT_STATUTS } from '~/utils/constants'
import { downloadCsv } from '~/utils/csv'

definePageMeta({ middleware: ['directeur'] })

const { getAll } = useCandidats()
const { getAll: getAllOffers } = useJobListings()

const { data: candidats, status } = useAsyncData('candidats', getAll)
const { data: offres } = useAsyncData('candidat-offres-list', getAllOffers)

// Filters
const search = ref('')
const filterStatut = ref<CandidatStatut | ''>('')
const filterOffre = ref('')
const viewMode = ref<'list' | 'pipeline'>('list')

const statutOptions = Object.entries(CANDIDAT_STATUTS).map(([value, config]) => ({ label: config.label, value }))

const offreOptions = computed(() =>
  (offres.value || []).map(o => ({ label: o.titre, value: o.id }))
)

// Sort
const { sort, toggleSort, sortItems } = useListSort<Candidat>('date_created', 'desc')

const sortOptions = [
  { label: 'Date', key: 'date_created' },
  { label: 'Nom', key: 'nom' },
  { label: 'Statut', key: 'statut' },
  { label: 'Source', key: 'source' }
]

function candidatAccessor(c: Candidat, key: string): string | number | null {
  if (key === 'nom') return `${c.nom} ${c.prenom}`
  return (c as any)[key] ?? null
}

const filteredCandidats = computed(() => {
  if (!candidats.value) return []
  const filtered = candidats.value.filter((c: Candidat) => {
    const q = search.value.toLowerCase()
    const matchesSearch = !q || [
      c.prenom, c.nom, c.email, c.telephone, c.source,
      `${c.prenom} ${c.nom}`
    ].some(field => field?.toLowerCase().includes(q))
    const matchesStatut = !filterStatut.value || c.statut === filterStatut.value
    const matchesOffre = !filterOffre.value || (typeof c.offre === 'object' && c.offre?.id === filterOffre.value)
    return matchesSearch && matchesStatut && matchesOffre
  })
  return sortItems(filtered, candidatAccessor)
})

// Pagination
const { paginatedItems: pagedCandidats, page, totalPages, showPagination, next, prev } = usePagination(filteredCandidats, 24)

// Pipeline columns (active statuts only, exclude archive)
const pipelineStatuts = Object.entries(CANDIDAT_STATUTS).filter(([key]) => key !== 'archive')

function pipelineCandidats(statut: string) {
  return filteredCandidats.value.filter(c => c.statut === statut)
}

// Stats
const stats = computed(() => {
  if (!candidats.value) return { total: 0, actifs: 0 }
  const actifs = candidats.value.filter((c: Candidat) => !['refuse', 'archive'].includes(c.statut)).length
  return { total: candidats.value.length, actifs }
})

function getStatutConfig(statut: string) {
  return (CANDIDAT_STATUTS as any)[statut] || { label: statut, color: 'neutral', icon: 'i-lucide-user' }
}

function getOffreTitre(c: Candidat): string {
  if (!c.offre || typeof c.offre === 'string') return ''
  return c.offre.titre
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function exportCsv() {
  const data = filteredCandidats.value
  if (!data.length) return
  const rows = data.map(c => ({
    'Prenom': c.prenom,
    'Nom': c.nom,
    'Email': c.email || '',
    'Telephone': c.telephone || '',
    'LinkedIn': c.linkedin || '',
    'Source': c.source || '',
    'Statut': CANDIDAT_STATUTS[c.statut]?.label || c.statut,
    'Offre': getOffreTitre(c),
    'Notes': c.notes || '',
    'Date creation': c.date_created.split('T')[0]
  }))
  downloadCsv(rows, `candidats_${new Date().toISOString().split('T')[0]}.csv`)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Candidats">
      <template #right>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!filteredCandidats.length"
            @click="exportCsv"
          />
          <UButton
            :icon="viewMode === 'list' ? 'i-lucide-columns-3' : 'i-lucide-list'"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="viewMode = viewMode === 'list' ? 'pipeline' : 'list'"
          />
          <UButton
            label="Nouveau"
            icon="i-lucide-plus"
            size="sm"
            to="/candidats/nouveau"
          />
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-6xl mx-auto space-y-4">

        <!-- Stats -->
        <div class="flex items-center gap-4 text-sm">
          <span class="text-stone-500 dark:text-stone-400">
            <strong class="text-stone-900 dark:text-white">{{ stats.total }}</strong> candidat{{ stats.total > 1 ? 's' : '' }}
          </span>
          <span class="text-stone-500 dark:text-stone-400">
            <strong class="text-emerald-600 dark:text-emerald-400">{{ stats.actifs }}</strong> actif{{ stats.actifs > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center gap-3">
          <UInput
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            class="w-full sm:w-64"
            size="sm"
          />
          <USelect v-model="filterStatut" :items="statutOptions" value-key="value" size="sm" class="w-[calc(50%-6px)] sm:w-48" placeholder="Tous les statuts" />
          <USelect v-model="filterOffre" :items="offreOptions" value-key="value" size="sm" class="w-[calc(50%-6px)] sm:w-48" placeholder="Toutes les offres" />
          <div class="flex items-center gap-1 w-full sm:w-auto sm:ml-auto">
            <button
              v-for="opt in sortOptions"
              :key="opt.key"
              class="px-2 py-1 text-xs rounded transition-colors"
              :class="sort.key === opt.key ? 'text-primary font-semibold bg-primary/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'"
              @click="toggleSort(opt.key)"
            >
              {{ opt.label }}
              <span v-if="sort.key === opt.key" class="ml-0.5">{{ sort.dir === 'asc' ? '&uarr;' : '&darr;' }}</span>
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex items-center justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="!filteredCandidats.length" class="flex flex-col items-center py-16 text-center">
          <UIcon name="i-lucide-user-search" class="size-12 text-stone-300 dark:text-stone-600 mb-3" />
          <p class="text-sm text-stone-500 dark:text-stone-400">
            {{ candidats?.length ? 'Aucun candidat ne correspond aux filtres' : 'Aucun candidat pour le moment' }}
          </p>
          <UButton v-if="!candidats?.length" label="Ajouter un candidat" icon="i-lucide-plus" size="sm" class="mt-3" to="/candidats/nouveau" />
        </div>

        <!-- List View -->
        <div v-else-if="viewMode === 'list'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NuxtLink
            v-for="c in pagedCandidats"
            :key="c.id"
            :to="`/candidats/${c.id}`"
            class="block"
          >
            <UCard class="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer h-full">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="text-sm font-semibold text-stone-900 dark:text-white truncate">
                    {{ c.prenom }} {{ c.nom }}
                  </h3>
                  <UBadge :color="getStatutConfig(c.statut).color" variant="subtle" size="xs">
                    {{ getStatutConfig(c.statut).label }}
                  </UBadge>
                </div>

                <div v-if="getOffreTitre(c)" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-megaphone" class="size-3.5 text-stone-400" />
                  <span class="text-xs text-stone-500 dark:text-stone-400 truncate">{{ getOffreTitre(c) }}</span>
                </div>

                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 dark:text-stone-500">
                  <span v-if="c.email" class="flex items-center gap-1">
                    <UIcon name="i-lucide-mail" class="size-3" /> {{ c.email }}
                  </span>
                  <span v-if="c.telephone" class="flex items-center gap-1">
                    <UIcon name="i-lucide-phone" class="size-3" /> {{ c.telephone }}
                  </span>
                </div>

                <div class="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                  <span v-if="c.source">{{ c.source }}</span>
                  <span>{{ formatDate(c.date_created) }}</span>
                </div>
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Pagination (list view only) -->
        <div v-if="viewMode === 'list' && showPagination" class="flex items-center justify-center gap-2 pt-4">
          <UButton icon="i-lucide-chevron-left" size="xs" color="neutral" variant="ghost" :disabled="page <= 1" @click="prev" />
          <span class="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            {{ page }} / {{ totalPages }}
          </span>
          <UButton icon="i-lucide-chevron-right" size="xs" color="neutral" variant="ghost" :disabled="page >= totalPages" @click="next" />
        </div>

        <!-- Pipeline View -->
        <div v-else class="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
          <div
            v-for="[statut, config] in pipelineStatuts"
            :key="statut"
            class="flex-shrink-0 w-48 sm:w-64"
          >
            <div class="flex items-center gap-2 mb-2 px-1">
              <UIcon :name="config.icon" class="size-4 text-stone-500" />
              <span class="text-xs font-semibold text-stone-700 dark:text-stone-300">{{ config.label }}</span>
              <UBadge :color="config.color" variant="subtle" size="xs">
                {{ pipelineCandidats(statut).length }}
              </UBadge>
            </div>
            <div class="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              <NuxtLink
                v-for="c in pipelineCandidats(statut)"
                :key="c.id"
                :to="`/candidats/${c.id}`"
                class="block"
              >
                <UCard class="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer" :ui="{ body: 'p-3' }">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-stone-900 dark:text-white truncate">
                      {{ c.prenom }} {{ c.nom }}
                    </p>
                    <p v-if="getOffreTitre(c)" class="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {{ getOffreTitre(c) }}
                    </p>
                    <p class="text-xs text-stone-400 dark:text-stone-500">
                      {{ formatDate(c.date_created) }}
                    </p>
                  </div>
                </UCard>
              </NuxtLink>
              <div v-if="!pipelineCandidats(statut).length" class="text-center py-4">
                <p class="text-xs text-stone-400 dark:text-stone-500">Aucun</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
