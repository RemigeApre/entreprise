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

const stats = computed(() => {
  if (!offres.value) return { total: 0, publiees: 0, brouillons: 0 }
  const publiees = offres.value.filter(o => o.publie).length
  return { total: offres.value.length, publiees, brouillons: offres.value.length - publiees }
})

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
          size="sm"
          class="w-48"
        />
        <UButton
          label="Nouvelle offre"
          icon="i-lucide-plus"
          size="sm"
          to="/offres/nouveau"
        />
      </template>
    </UDashboardNavbar>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Stats -->
        <div v-if="offres?.length" class="grid grid-cols-3 gap-3">
          <div class="rounded-lg bg-stone-50 dark:bg-stone-800/50 px-4 py-2.5 text-center">
            <p class="text-lg font-bold text-stone-900 dark:text-stone-100">{{ stats.total }}</p>
            <p class="text-[11px] text-stone-500 dark:text-stone-400">Total</p>
          </div>
          <div class="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 text-center">
            <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{ stats.publiees }}</p>
            <p class="text-[11px] text-stone-500 dark:text-stone-400">Publiees</p>
          </div>
          <div class="rounded-lg bg-stone-50 dark:bg-stone-800/50 px-4 py-2.5 text-center">
            <p class="text-lg font-bold text-stone-500 dark:text-stone-400">{{ stats.brouillons }}</p>
            <p class="text-[11px] text-stone-500 dark:text-stone-400">Brouillons</p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!filteredOffres.length" class="text-center py-12">
          <UIcon name="i-lucide-megaphone" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">
            {{ search ? 'Aucun resultat' : 'Aucune offre d\'emploi' }}
          </p>
          <UButton
            v-if="!search"
            label="Creer une offre"
            icon="i-lucide-plus"
            class="mt-4"
            to="/offres/nouveau"
          />
        </div>

        <!-- Cards list -->
        <div v-else class="space-y-3">
          <NuxtLink
            v-for="offre in filteredOffres"
            :key="offre.id"
            :to="`/offres/${offre.id}`"
            class="block"
          >
            <div
              class="flex items-center gap-4 rounded-lg border border-stone-200 dark:border-stone-800 p-4 transition-all hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
            >
              <!-- Left: info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {{ offre.titre }}
                  </h3>
                  <UBadge
                    :color="getContractColor(offre.type_contrat)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ offre.type_contrat }}
                  </UBadge>
                </div>
                <div class="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3" />
                    {{ offre.localisation }}
                  </span>
                  <span>{{ formatDateFr(offre.date_created) }}</span>
                </div>
              </div>

              <!-- Right: status toggle -->
              <div class="flex items-center gap-3 shrink-0" @click.prevent.stop>
                <span class="text-xs" :class="offre.publie ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'">
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
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
