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

function getContractColor(type: string) {
  const colors: Record<string, string> = { CDI: 'green', CDD: 'blue', Freelance: 'orange', Alternance: 'purple', Stage: 'yellow' }
  return colors[type] || 'neutral'
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Offres d'emploi</h3>
        <UButton label="Gerer" variant="link" size="xs" to="/offres" trailing-icon="i-lucide-arrow-right" />
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-16">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-primary" />
    </div>

    <div v-else-if="!offres.length" class="text-center py-4">
      <p class="text-[12px] text-stone-400 mb-2">Aucune offre</p>
      <UButton label="Creer une offre" icon="i-lucide-plus" size="xs" variant="soft" to="/offres/nouveau" />
    </div>

    <div v-else>
      <div class="flex items-center gap-3 text-[11px] mb-2">
        <span class="flex items-center gap-1">
          <span class="size-1.5 rounded-full bg-emerald-500" />
          <span class="text-stone-500">{{ publiees.length }} publiee(s)</span>
        </span>
        <span v-if="brouillons.length" class="flex items-center gap-1">
          <span class="size-1.5 rounded-full bg-stone-300" />
          <span class="text-stone-400">{{ brouillons.length }} brouillon(s)</span>
        </span>
      </div>
      <div class="space-y-0.5">
        <NuxtLink
          v-for="offre in offres.slice(0, 4)"
          :key="offre.id"
          :to="`/offres/${offre.id}`"
          class="flex items-center justify-between py-1.5 px-1 rounded hover:bg-[rgba(175,143,60,0.04)] transition-colors"
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="size-1.5 rounded-full shrink-0" :class="offre.publie ? 'bg-emerald-500' : 'bg-stone-300'" />
            <p class="text-[12px] font-medium truncate">{{ offre.titre }}</p>
          </div>
          <UBadge :color="getContractColor(offre.type_contrat)" variant="subtle" size="xs" class="shrink-0 ml-2">
            {{ offre.type_contrat }}
          </UBadge>
        </NuxtLink>
      </div>
      <p v-if="offres.length > 4" class="text-[11px] text-stone-400 text-center pt-1">+{{ offres.length - 4 }} autre(s)</p>
    </div>
  </UCard>
</template>
