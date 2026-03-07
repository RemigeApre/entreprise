<script setup lang="ts">
definePageMeta({ middleware: 'directeur' })

const { findWikiDuplicates, cleanWikiDuplicates, findCategoryDuplicates, cleanCategoryDuplicates, findSiteDuplicates, cleanSiteDuplicates } = useDataCleanup()
const toast = useToast()

// --- State ---
const loading = ref(true)
const wikiDuplicates = ref(0)
const categoryDuplicates = ref(0)
const siteDuplicates = ref(0)

const cleaningWiki = ref(false)
const cleaningCategories = ref(false)
const cleaningSites = ref(false)

// --- Scan for duplicates ---
async function scanDuplicates() {
  loading.value = true
  try {
    const [wiki, cats, sites] = await Promise.all([
      findWikiDuplicates(),
      findCategoryDuplicates(),
      findSiteDuplicates()
    ])
    wikiDuplicates.value = wiki.reduce((sum, g) => sum + g.toDelete.length, 0)
    categoryDuplicates.value = cats.reduce((sum, g) => sum + g.toDelete.length, 0)
    siteDuplicates.value = sites.reduce((sum, g) => sum + g.toDelete.length, 0)
  } catch {
    toast.add({ title: 'Erreur lors de l\'analyse', color: 'error' })
  } finally {
    loading.value = false
  }
}

const totalDuplicates = computed(() => wikiDuplicates.value + categoryDuplicates.value + siteDuplicates.value)

// --- Clean actions ---
async function handleCleanWiki() {
  cleaningWiki.value = true
  try {
    const count = await cleanWikiDuplicates()
    wikiDuplicates.value = 0
    toast.add({ title: `${count} doublon(s) wiki supprime(s)`, color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors du nettoyage wiki', color: 'error' })
  } finally {
    cleaningWiki.value = false
  }
}

async function handleCleanCategories() {
  cleaningCategories.value = true
  try {
    const count = await cleanCategoryDuplicates()
    categoryDuplicates.value = 0
    toast.add({ title: `${count} doublon(s) categories supprime(s)`, color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors du nettoyage categories', color: 'error' })
  } finally {
    cleaningCategories.value = false
  }
}

async function handleCleanSites() {
  cleaningSites.value = true
  try {
    const count = await cleanSiteDuplicates()
    siteDuplicates.value = 0
    toast.add({ title: `${count} doublon(s) sites supprime(s)`, color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors du nettoyage sites', color: 'error' })
  } finally {
    cleaningSites.value = false
  }
}

async function handleCleanAll() {
  cleaningWiki.value = true
  cleaningCategories.value = true
  cleaningSites.value = true
  try {
    const [w, c, s] = await Promise.all([
      cleanWikiDuplicates(),
      cleanCategoryDuplicates(),
      cleanSiteDuplicates()
    ])
    wikiDuplicates.value = 0
    categoryDuplicates.value = 0
    siteDuplicates.value = 0
    const total = w + c + s
    if (total > 0) {
      toast.add({ title: `${total} doublon(s) supprime(s) au total`, color: 'success' })
    } else {
      toast.add({ title: 'Aucun doublon trouve', color: 'info' })
    }
  } catch {
    toast.add({ title: 'Erreur lors du nettoyage', color: 'error' })
  } finally {
    cleaningWiki.value = false
    cleaningCategories.value = false
    cleaningSites.value = false
  }
}

onMounted(scanDuplicates)
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Administration">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/dashboard" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">

        <!-- Doublons -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-copy-minus" class="size-5 text-stone-500 dark:text-stone-400" />
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Doublons</h3>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  label="Re-analyser"
                  icon="i-lucide-refresh-cw"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  :loading="loading"
                  @click="scanDuplicates"
                />
                <UButton
                  v-if="totalDuplicates > 0"
                  label="Tout nettoyer"
                  icon="i-lucide-sparkles"
                  size="xs"
                  :loading="cleaningWiki || cleaningCategories || cleaningSites"
                  @click="handleCleanAll"
                />
              </div>
            </div>
          </template>

          <div v-if="loading" class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
            <span class="ml-2 text-sm text-stone-500 dark:text-stone-400">Analyse en cours...</span>
          </div>

          <div v-else-if="totalDuplicates === 0" class="flex flex-col items-center py-8 text-center">
            <UIcon name="i-lucide-check-circle" class="size-10 text-green-500 mb-2" />
            <p class="text-sm font-medium text-stone-700 dark:text-stone-300">Aucun doublon detecte</p>
            <p class="text-xs text-stone-400 dark:text-stone-500 mt-1">La base de donnees est propre.</p>
          </div>

          <div v-else class="space-y-3">
            <!-- Wiki -->
            <div class="flex items-center justify-between p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UIcon name="i-lucide-book-open" class="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-stone-800 dark:text-stone-200">Pages wiki</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500">Doublons par slug</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge v-if="wikiDuplicates > 0" color="red" variant="subtle" size="sm">
                  {{ wikiDuplicates }}
                </UBadge>
                <UBadge v-else color="green" variant="subtle" size="sm">OK</UBadge>
                <UButton
                  v-if="wikiDuplicates > 0"
                  label="Nettoyer"
                  size="xs"
                  variant="soft"
                  color="red"
                  :loading="cleaningWiki"
                  @click="handleCleanWiki"
                />
              </div>
            </div>

            <!-- Categories -->
            <div class="flex items-center justify-between p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <UIcon name="i-lucide-tags" class="size-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-stone-800 dark:text-stone-200">Categories / Poles</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500">Doublons par nom</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge v-if="categoryDuplicates > 0" color="red" variant="subtle" size="sm">
                  {{ categoryDuplicates }}
                </UBadge>
                <UBadge v-else color="green" variant="subtle" size="sm">OK</UBadge>
                <UButton
                  v-if="categoryDuplicates > 0"
                  label="Nettoyer"
                  size="xs"
                  variant="soft"
                  color="red"
                  :loading="cleaningCategories"
                  @click="handleCleanCategories"
                />
              </div>
            </div>

            <!-- Sites -->
            <div class="flex items-center justify-between p-3 rounded-lg bg-[rgba(175,143,60,0.04)] dark:bg-[rgba(175,143,60,0.03)]">
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <UIcon name="i-lucide-activity" class="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p class="text-sm font-medium text-stone-800 dark:text-stone-200">Sites monitores</p>
                  <p class="text-xs text-stone-400 dark:text-stone-500">Doublons par URL</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge v-if="siteDuplicates > 0" color="red" variant="subtle" size="sm">
                  {{ siteDuplicates }}
                </UBadge>
                <UBadge v-else color="green" variant="subtle" size="sm">OK</UBadge>
                <UButton
                  v-if="siteDuplicates > 0"
                  label="Nettoyer"
                  size="xs"
                  variant="soft"
                  color="red"
                  :loading="cleaningSites"
                  @click="handleCleanSites"
                />
              </div>
            </div>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
