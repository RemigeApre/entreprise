<script setup lang="ts">
import type { OffreEmploi } from '~/utils/types'

const { getAll } = useJobListings()

const loading = ref(true)
const offres = ref<OffreEmploi[]>([])

async function load() {
  loading.value = true
  try {
    offres.value = await getAll()
  } finally {
    loading.value = false
  }
}

const publiees = computed(() => offres.value.filter(o => o.publie))
const brouillons = computed(() => offres.value.filter(o => !o.publie))

function formatDateFr(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Offres d'emploi</h3>
        <UButton
          label="Gerer les offres"
          variant="link"
          size="xs"
          to="/offres"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else-if="!offres.length" class="text-center py-4">
      <p class="text-sm text-stone-500 dark:text-stone-400">Aucune offre d'emploi</p>
      <UButton
        label="Creer une offre"
        icon="i-lucide-plus"
        size="xs"
        variant="soft"
        class="mt-2"
        to="/offres/nouveau"
      />
    </div>

    <div v-else class="space-y-3">
      <!-- Stats line -->
      <div class="flex items-center gap-3 text-xs">
        <span class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-emerald-500" />
          <span class="text-stone-600 dark:text-stone-400">{{ publiees.length }} publiee(s)</span>
        </span>
        <span v-if="brouillons.length" class="flex items-center gap-1.5">
          <span class="size-2 rounded-full bg-stone-300 dark:bg-stone-600" />
          <span class="text-stone-500 dark:text-stone-400">{{ brouillons.length }} brouillon(s)</span>
        </span>
      </div>

      <!-- Offres list -->
      <div class="space-y-1.5">
        <NuxtLink
          v-for="offre in offres.slice(0, 5)"
          :key="offre.id"
          :to="`/offres/${offre.id}`"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="size-2 rounded-full shrink-0"
              :class="offre.publie ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'"
            />
            <p class="text-sm font-medium truncate">{{ offre.titre }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-2">
            <UBadge
              :color="getContractColor(offre.type_contrat)"
              variant="subtle"
              size="xs"
            >
              {{ offre.type_contrat }}
            </UBadge>
          </div>
        </NuxtLink>
      </div>

      <p v-if="offres.length > 5" class="text-xs text-stone-400 text-center pt-1">
        +{{ offres.length - 5 }} autre(s)
      </p>
    </div>
  </UCard>
</template>
