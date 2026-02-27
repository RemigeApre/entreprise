<script setup lang="ts">
import type { MonitoredSite } from '~/utils/types'
import type { SiteStatus } from '~/composables/useSiteMonitor'

const { userSites, loadUserSites, checkSiteStatus, sitesLoaded } = useSiteMonitor()

const loading = ref(true)
const statuses = ref<Map<string, SiteStatus>>(new Map())

async function checkAll() {
  loading.value = true
  const results = new Map<string, SiteStatus>()
  await Promise.all(
    userSites.value.map(async (site) => {
      const status = await checkSiteStatus(site.url)
      results.set(site.id, status)
    })
  )
  statuses.value = results
  loading.value = false
}

function getStatus(site: MonitoredSite): SiteStatus | undefined {
  return statuses.value.get(site.id)
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function isCheckError(status: SiteStatus | undefined): boolean {
  if (!status) return false
  return !status.up && status.statusCode === 0 && !!status.error
}

onMounted(async () => {
  if (!sitesLoaded.value) {
    await loadUserSites()
  }
  if (userSites.value.length > 0) {
    await checkAll()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Etat des sites</h3>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            size="xs"
            :loading="loading"
            @click="checkAll"
          />
          <UButton
            label="Voir tout"
            variant="link"
            size="xs"
            to="/projets/status"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </div>
    </template>

    <div v-if="loading && statuses.size === 0" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else-if="!userSites.length" class="text-center py-4">
      <p class="text-sm text-stone-500">Aucun site assigne</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="site in userSites"
        :key="site.id"
        class="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="size-2.5 rounded-full shrink-0"
            :class="!getStatus(site) ? 'bg-stone-300 dark:bg-stone-600 animate-pulse'
              : isCheckError(getStatus(site)) ? 'bg-amber-400'
              : getStatus(site)!.up ? 'bg-emerald-500' : 'bg-red-500'"
          />
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ site.nom }}</p>
            <p class="text-xs text-stone-400 truncate">{{ site.url }}</p>
          </div>
        </div>
        <div v-if="getStatus(site)" class="text-right shrink-0 ml-3">
          <p
            class="text-xs font-medium"
            :class="isCheckError(getStatus(site)) ? 'text-amber-600 dark:text-amber-400'
              : getStatus(site)!.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ isCheckError(getStatus(site)) ? 'Non verifie' : getStatus(site)!.up ? 'En ligne' : 'Hors ligne' }}
          </p>
          <p v-if="getStatus(site)!.responseTime > 0" class="text-[10px] text-stone-400">
            {{ formatResponseTime(getStatus(site)!.responseTime) }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
