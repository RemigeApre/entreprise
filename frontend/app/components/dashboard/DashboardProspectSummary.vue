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
        <div class="flex items-center gap-2">
          <div class="dash-card-icon">
            <UIcon name="i-lucide-target" class="size-3.5" />
          </div>
          <h3 class="text-sm font-semibold">Prospection</h3>
          <UBadge v-if="!loading && hasProspects" variant="subtle" size="xs" color="primary">
            {{ myProspects.length }}
          </UBadge>
        </div>
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

    <div v-else-if="!hasProspects" class="text-center py-5">
      <div class="dash-empty-icon">
        <UIcon name="i-lucide-target" class="size-5 text-[#AF8F3C]/30" />
      </div>
      <p class="text-sm text-stone-400 dark:text-stone-500">Aucun prospect assigne</p>
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

<style scoped>
.dash-card-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(175, 143, 60, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #AF8F3C;
}
.dash-empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(175, 143, 60, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}
</style>
