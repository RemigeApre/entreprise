<script setup lang="ts">
import type { Prospect } from '~/utils/types'
import { PROSPECT_STATUTS } from '~/utils/constants'

const { user } = useAuth()
const { getAll } = useProspects()

const loading = ref(true)
const myProspects = ref<Prospect[]>([])

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    const all = await getAll()
    myProspects.value = all.filter((p: Prospect) => {
      const prospecteurId = typeof p.prospecteur === 'string' ? p.prospecteur : p.prospecteur.id
      return prospecteurId === user.value!.id
    })
  } finally {
    loading.value = false
  }
}

const statusCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of myProspects.value) {
    counts[p.statut] = (counts[p.statut] || 0) + 1
  }
  return counts
})

const hasProspects = computed(() => myProspects.value.length > 0)

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Ma prospection</h3>
        <UButton
          label="Voir tout"
          variant="link"
          size="xs"
          to="/prospection"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else-if="!hasProspects" class="text-center py-4">
      <p class="text-sm text-stone-500">Aucun prospect assigne</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(config, key) in PROSPECT_STATUTS"
        :key="key"
        class="flex items-center justify-between"
      >
        <UBadge :color="config.color" variant="subtle" size="xs">
          {{ config.label }}
        </UBadge>
        <span class="text-sm font-semibold tabular-nums">
          {{ statusCounts[key as string] || 0 }}
        </span>
      </div>
      <USeparator class="my-2" />
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium">Total</span>
        <span class="font-bold tabular-nums">{{ myProspects.length }}</span>
      </div>
    </div>
  </UCard>
</template>
