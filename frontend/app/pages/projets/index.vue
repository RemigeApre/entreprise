<script setup lang="ts">
import type { Project, ProjectStatut, UserProfile } from '~/utils/types'
import { PROJECT_STATUTS } from '~/utils/constants'
import { downloadCsv } from '~/utils/csv'

const { getAll } = useProjects()

const { data: projects, status } = useAsyncData('projects', getAll)

const search = ref('')
const filterStatut = ref<ProjectStatut | ''>('')

const statutOptions = computed(() => {
  return [
    { label: 'Tous les statuts', value: '' },
    ...Object.entries(PROJECT_STATUTS).map(([key, val]) => ({
      label: val.label,
      value: key
    }))
  ]
})

// Sort
const { sort, toggleSort, sortItems } = useListSort<Project>('nom', 'asc')

const sortOptions = [
  { label: 'Nom', key: 'nom' },
  { label: 'Statut', key: 'statut' },
  { label: 'Date debut', key: 'date_debut' },
  { label: 'Budget', key: 'budget' }
]

function projectAccessor(p: Project, key: string): string | number | null {
  return (p as any)[key] ?? null
}

const filteredProjects = computed(() => {
  if (!projects.value) return []
  let list = projects.value

  if (filterStatut.value) {
    list = list.filter((p: Project) => p.statut === filterStatut.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((p: Project) => p.nom.toLowerCase().includes(q))
  }

  return sortItems(list, projectAccessor)
})

const { paginatedItems: pagedProjects, page, totalPages, showPagination, next, prev } = usePagination(filteredProjects, 24)

function formatDateRange(project: Project) {
  if (!project.date_debut && !project.date_fin) return null
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const debut = project.date_debut
    ? new Date(project.date_debut).toLocaleDateString('fr-FR', opts)
    : '...'
  const fin = project.date_fin
    ? new Date(project.date_fin).toLocaleDateString('fr-FR', opts)
    : '...'
  return `${debut} - ${fin}`
}

function formatBudget(budget: number | null) {
  if (!budget) return null
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(budget)
}

function getCategoryName(project: Project) {
  if (!project.categorie || typeof project.categorie === 'string') return null
  return project.categorie.nom
}

function getCategoryColor(project: Project) {
  if (!project.categorie || typeof project.categorie === 'string') return null
  return project.categorie.couleur
}

function getClientName(project: Project) {
  if (!project.client || typeof project.client === 'string') return null
  return project.client.nom_entreprise
}

function getMembers(project: Project) {
  return project.membres || []
}

function getMemberName(member: { utilisateur: UserProfile | string }) {
  if (typeof member.utilisateur === 'string') return ''
  return [member.utilisateur.first_name, member.utilisateur.last_name].filter(Boolean).join(' ')
}

function exportCsv() {
  const data = filteredProjects.value
  if (!data.length) return
  const rows = data.map(p => ({
    'Nom': p.nom,
    'Statut': PROJECT_STATUTS[p.statut]?.label || p.statut,
    'Categorie': getCategoryName(p) || '',
    'Client': getClientName(p) || '',
    'Date debut': p.date_debut || '',
    'Date fin': p.date_fin || '',
    'Budget': p.budget ?? '',
    'Membres': getMembers(p).map(m => getMemberName(m)).filter(Boolean).join(', ')
  }))
  downloadCsv(rows, `projets_${new Date().toISOString().split('T')[0]}.csv`)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Projets">
      <template #right>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <USelectMenu
            v-model="filterStatut"
            :items="statutOptions"
            value-key="value"
            class="w-full sm:w-48"
            placeholder="Filtrer par statut"
          />
          <UInput
            v-model="search"
            placeholder="Rechercher un projet..."
            icon="i-lucide-search"
            class="w-full sm:w-64"
          />
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            :disabled="!filteredProjects.length"
            @click="exportCsv"
          />
          <UButton
            label="Nouveau projet"
            icon="i-lucide-plus"
            to="/projets/nouveau"
          />
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Sort -->
      <div v-if="filteredProjects.length" class="flex items-center gap-1 mb-3 text-xs">
        <span class="text-stone-400 mr-1">Trier :</span>
        <button
          v-for="opt in sortOptions"
          :key="opt.key"
          class="px-2 py-1 rounded transition-colors"
          :class="sort.key === opt.key ? 'text-primary font-semibold bg-primary/10' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'"
          @click="toggleSort(opt.key)"
        >
          {{ opt.label }}
          <span v-if="sort.key === opt.key">{{ sort.dir === 'asc' ? '&uarr;' : '&darr;' }}</span>
        </button>
      </div>

      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <div v-else-if="!filteredProjects.length" class="text-center py-12">
        <UIcon name="i-lucide-folder-kanban" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p class="text-stone-500 dark:text-stone-400">Aucun projet trouve</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="project in pagedProjects"
          :key="project.id"
          class="card-hover-warm cursor-pointer"
          @click="navigateTo(`/projets/${project.id}`)"
        >
          <div class="space-y-3">
            <!-- Header: nom + statut -->
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold text-stone-900 dark:text-white truncate">
                {{ project.nom }}
              </h3>
              <UBadge
                :color="PROJECT_STATUTS[project.statut]?.color || 'neutral'"
                variant="subtle"
                size="xs"
                class="shrink-0"
              >
                {{ PROJECT_STATUTS[project.statut]?.label || project.statut }}
              </UBadge>
            </div>

            <!-- Category + Client -->
            <div class="flex flex-wrap items-center gap-1.5">
              <UBadge
                v-if="getCategoryName(project)"
                variant="outline"
                color="neutral"
                size="xs"
              >
                {{ getCategoryName(project) }}
              </UBadge>
              <UBadge
                v-if="getClientName(project)"
                variant="outline"
                color="neutral"
                size="xs"
              >
                <UIcon name="i-lucide-building-2" class="size-3 mr-1" />
                {{ getClientName(project) }}
              </UBadge>
            </div>

            <!-- Dates -->
            <div v-if="formatDateRange(project)" class="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <UIcon name="i-lucide-calendar" class="size-3.5" />
              <span>{{ formatDateRange(project) }}</span>
            </div>

            <!-- Budget -->
            <div v-if="formatBudget(project.budget)" class="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <UIcon name="i-lucide-euro" class="size-3.5" />
              <span>{{ formatBudget(project.budget) }}</span>
            </div>

            <USeparator />

            <!-- Members -->
            <div class="flex items-center justify-between">
              <div class="flex items-center -space-x-2">
                <UAvatar
                  v-for="member in getMembers(project).slice(0, 3)"
                  :key="member.id"
                  :alt="getMemberName(member)"
                  size="xs"
                  class="ring-2 ring-[#f7f0de] dark:ring-[#1a2520]"
                />
                <span
                  v-if="getMembers(project).length > 3"
                  class="inline-flex items-center justify-center size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300 ring-2 ring-[#f7f0de] dark:ring-[#1a2520]"
                >
                  +{{ getMembers(project).length - 3 }}
                </span>
                <span
                  v-if="!getMembers(project).length"
                  class="text-xs text-stone-400 dark:text-stone-500"
                >
                  Aucun membre
                </span>
              </div>
              <UIcon name="i-lucide-arrow-right" class="size-4 text-stone-400" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Pagination -->
      <div v-if="showPagination" class="flex items-center justify-center gap-2 pt-4">
        <UButton icon="i-lucide-chevron-left" size="xs" color="neutral" variant="ghost" :disabled="page <= 1" @click="prev" />
        <span class="text-xs text-stone-500 dark:text-stone-400 tabular-nums">{{ page }} / {{ totalPages }}</span>
        <UButton icon="i-lucide-chevron-right" size="xs" color="neutral" variant="ghost" :disabled="page >= totalPages" @click="next" />
      </div>
    </div>
  </div>
</template>
