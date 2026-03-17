<script setup lang="ts">
import type { OffreEmploi, Category } from '~/utils/types'
import { CONTRACT_OPTIONS, CONTRACT_COLORS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const { getAll, togglePublish } = useJobListings()
const toast = useToast()

const { data: offres, status, refresh } = useAsyncData('offres-emploi', getAll)

const search = ref('')
const filterContrat = ref<string | null>(null)
const filterStatut = ref<string | null>(null)
const togglingId = ref<string | null>(null)

const contratOptions = [
  { label: 'Tous les contrats', value: null },
  ...CONTRACT_OPTIONS
]

const statutOptions = [
  { label: 'Tous les statuts', value: null },
  { label: 'Publiee', value: 'publie' },
  { label: 'Brouillon', value: 'brouillon' }
]

const filteredOffres = computed(() => {
  if (!offres.value) return []
  let list = offres.value

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((o: OffreEmploi) =>
      o.titre.toLowerCase().includes(q)
      || o.localisation.toLowerCase().includes(q)
      || o.type_contrat.toLowerCase().includes(q)
      || (o.description && o.description.toLowerCase().includes(q))
    )
  }

  if (filterContrat.value) {
    list = list.filter((o: OffreEmploi) => o.type_contrat === filterContrat.value)
  }

  if (filterStatut.value) {
    list = list.filter((o: OffreEmploi) =>
      filterStatut.value === 'publie' ? o.publie : !o.publie
    )
  }

  return list
})

const stats = computed(() => {
  if (!offres.value) return { total: 0, publiees: 0, brouillons: 0 }
  const total = offres.value.length
  const publiees = offres.value.filter((o: OffreEmploi) => o.publie).length
  return { total, publiees, brouillons: total - publiees }
})

function getOffreCategories(o: OffreEmploi): Category[] {
  if (!o.categories?.length) return []
  return o.categories
    .map(j => typeof j.categories_id === 'object' ? j.categories_id : null)
    .filter((c): c is Category => c !== null)
}

const hasFilters = computed(() => !!search.value || !!filterContrat.value || !!filterStatut.value)

function clearFilters() {
  search.value = ''
  filterContrat.value = null
  filterStatut.value = null
}

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

function formatSalaire(o: OffreEmploi) {
  if (!o.salaire_min && !o.salaire_max) return null
  const p = o.salaire_periode === 'annee' ? '/an' : o.salaire_periode === 'heure' ? '/h' : '/mois'
  if (o.salaire_min && o.salaire_max) {
    return `${o.salaire_min.toLocaleString('fr-FR')} - ${o.salaire_max.toLocaleString('fr-FR')} EUR${p}`
  }
  if (o.salaire_min) return `${o.salaire_min.toLocaleString('fr-FR')}+ EUR${p}`
  return `< ${o.salaire_max!.toLocaleString('fr-FR')} EUR${p}`
}

function truncate(text: string, max: number) {
  if (!text || text.length <= max) return text
  return text.substring(0, max).trimEnd() + '...'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Offres d'emploi">
      <template #right>
        <UButton
          label="Nouvelle offre"
          icon="i-lucide-plus"
          size="sm"
          to="/offres/nouveau"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Stats -->
      <div v-if="offres && offres.length" class="flex items-center gap-4 text-xs">
        <span class="text-[#2c2419]/60">
          <strong class="text-[#2c2419]">{{ stats.total }}</strong> offre{{ stats.total > 1 ? 's' : '' }}
        </span>
        <span class="flex items-center gap-1 text-emerald-600">
          <span class="size-1.5 rounded-full bg-emerald-500" />
          {{ stats.publiees }} publiee{{ stats.publiees > 1 ? 's' : '' }}
        </span>
        <span class="flex items-center gap-1 text-stone-400">
          <span class="size-1.5 rounded-full bg-stone-300" />
          {{ stats.brouillons }} brouillon{{ stats.brouillons > 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <UInput
          v-model="search"
          placeholder="Rechercher..."
          icon="i-lucide-search"
          size="sm"
          class="w-full sm:w-56"
        />
        <USelect
          v-model="filterContrat"
          :items="contratOptions"
          value-key="value"
          size="sm"
          class="w-[calc(50%-4px)] sm:w-44"
        />
        <USelect
          v-model="filterStatut"
          :items="statutOptions"
          value-key="value"
          size="sm"
          class="w-[calc(50%-4px)] sm:w-40"
        />
        <UButton
          v-if="hasFilters"
          label="Effacer"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="clearFilters"
        />
        <span v-if="hasFilters" class="text-xs text-stone-400 ml-1">
          {{ filteredOffres.length }} resultat{{ filteredOffres.length > 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Empty state -->
        <div v-if="!filteredOffres.length" class="text-center py-12">
          <UIcon name="i-lucide-megaphone" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-stone-500">
            {{ hasFilters ? 'Aucun resultat pour ces filtres' : 'Aucune offre d\'emploi' }}
          </p>
          <UButton
            v-if="hasFilters"
            label="Effacer les filtres"
            icon="i-lucide-x"
            variant="subtle"
            class="mt-3"
            @click="clearFilters"
          />
          <UButton
            v-else
            label="Creer une offre"
            icon="i-lucide-plus"
            class="mt-4"
            to="/offres/nouveau"
          />
        </div>

        <!-- Cards -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <NuxtLink
            v-for="offre in filteredOffres"
            :key="offre.id"
            :to="`/offres/${offre.id}`"
            class="block group"
          >
            <div
              class="relative flex flex-col gap-3 rounded-xl border p-4 transition-all h-full"
              :class="offre.publie
                ? 'border-emerald-200/60 hover:border-emerald-300 hover:bg-emerald-50/30'
                : 'border-stone-200 hover:border-[#af8f3c]/30 hover:bg-[#af8f3c]/[0.03]'"
            >
              <!-- Top row -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1.5">
                    <h3 class="text-sm font-semibold text-[#2c2419] truncate group-hover:text-[#af8f3c] transition-colors">
                      {{ offre.titre }}
                    </h3>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      :color="CONTRACT_COLORS[offre.type_contrat] || 'neutral'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ offre.type_contrat }}
                    </UBadge>
                    <UBadge
                      v-for="cat in getOffreCategories(offre)"
                      :key="cat.id"
                      variant="outline"
                      size="xs"
                      :style="cat.couleur ? { borderColor: cat.couleur + '60', color: cat.couleur } : {}"
                    >
                      {{ cat.nom }}
                    </UBadge>
                    <span class="flex items-center gap-1 text-xs text-stone-500">
                      <UIcon name="i-lucide-map-pin" class="size-3" />
                      {{ offre.localisation }}
                    </span>
                    <span v-if="offre.teletravail" class="flex items-center gap-1 text-xs text-stone-500">
                      <UIcon name="i-lucide-laptop" class="size-3" />
                      Teletravail {{ offre.teletravail }}
                    </span>
                    <span v-if="formatSalaire(offre)" class="flex items-center gap-1 text-xs text-stone-500">
                      <UIcon name="i-lucide-banknote" class="size-3" />
                      {{ formatSalaire(offre) }}
                    </span>
                  </div>
                </div>

                <!-- Toggle -->
                <div class="flex items-center gap-2 shrink-0" @click.prevent.stop>
                  <span class="text-[11px] font-medium" :class="offre.publie ? 'text-emerald-600' : 'text-stone-400'">
                    {{ offre.publie ? 'Publiee' : 'Brouillon' }}
                  </span>
                  <USwitch
                    :model-value="offre.publie"
                    :loading="togglingId === offre.id"
                    size="sm"
                    @update:model-value="handleTogglePublish(offre)"
                  />
                </div>
              </div>

              <!-- Description preview -->
              <p v-if="offre.description" class="text-xs text-stone-500 leading-relaxed line-clamp-2">
                {{ truncate(offre.description, 160) }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between text-[11px] text-stone-400 mt-auto pt-2 border-t border-stone-100">
                <span>Creee le {{ formatDateFr(offre.date_created) }}</span>
                <div class="flex items-center gap-3">
                  <span v-if="offre.date_expiration" class="flex items-center gap-1">
                    <UIcon name="i-lucide-clock" class="size-3" />
                    Expire {{ formatDateFr(offre.date_expiration) }}
                  </span>
                  <span v-if="offre.competences_requises" class="flex items-center gap-1">
                    <UIcon name="i-lucide-list-checks" class="size-3" />
                    Competences
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
