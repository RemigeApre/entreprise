<script setup lang="ts">
import type { WikiPage } from '~/utils/types'

const { getPages } = useWiki()
const { isDirecteur } = useAuth()

const { data: wikiPages, status } = useAsyncData('wiki-pages', getPages)

const search = ref('')

const filteredPages = computed(() => {
  if (!wikiPages.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return wikiPages.value
  return wikiPages.value.filter((p: WikiPage) =>
    p.titre.toLowerCase().includes(q)
  )
})

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

function excerpt(html: string, max = 120): string {
  const text = stripHtml(html)
  if (text.length <= max) return text
  return text.slice(0, max).trim() + '...'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Wiki">
      <template #right>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Rechercher..."
          size="sm"
          class="w-44"
        />
        <UButton
          v-if="isDirecteur"
          label="Nouvelle page"
          icon="i-lucide-plus"
          size="sm"
          to="/wiki/nouveau"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-5xl mx-auto">

        <!-- Carte identite epinglee -->
        <NuxtLink
          to="/wiki/identite"
          class="block mb-6 group"
        >
          <UCard class="transition-shadow hover:shadow-md">
            <div class="flex items-center gap-4">
              <div class="size-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-palette" class="size-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="font-heading text-lg font-bold text-stone-900 dark:text-white group-hover:text-primary transition-colors">
                    Notre identite
                  </h2>
                  <UBadge variant="subtle" color="amber" size="xs">Epingle</UBadge>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                  Charte graphique, mood board, logo, palette de couleurs et typographie
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-stone-300 dark:text-stone-600 group-hover:text-primary transition-colors shrink-0" />
            </div>
          </UCard>
        </NuxtLink>

        <!-- Loading -->
        <div v-if="status === 'pending' && !wikiPages" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        </div>

        <!-- Grille de pages -->
        <div v-else-if="filteredPages.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="page in filteredPages"
            :key="page.id"
            :to="`/wiki/${page.slug}`"
            class="group"
          >
            <UCard class="h-full transition-shadow hover:shadow-md">
              <div class="flex flex-col h-full">
                <div class="flex items-center gap-3 mb-3">
                  <div class="size-9 rounded-lg bg-[rgba(175,143,60,0.06)] dark:bg-[rgba(175,143,60,0.06)] flex items-center justify-center shrink-0">
                    <UIcon :name="page.icone || 'i-lucide-file-text'" class="size-4.5 text-stone-600 dark:text-stone-400" />
                  </div>
                  <h3 class="font-semibold text-stone-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    {{ page.titre }}
                  </h3>
                </div>
                <p class="text-sm text-stone-500 dark:text-stone-400 flex-1 line-clamp-3">
                  {{ excerpt(page.contenu) }}
                </p>
                <p v-if="page.date_updated" class="text-xs text-stone-400 dark:text-stone-600 mt-3">
                  Mis a jour le {{ formatDate(page.date_updated) }}
                </p>
              </div>
            </UCard>
          </NuxtLink>
        </div>

        <!-- Vide -->
        <div v-else-if="search && wikiPages?.length" class="text-center py-12">
          <UIcon name="i-lucide-search-x" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">Aucune page ne correspond a "{{ search }}"</p>
        </div>

        <div v-else-if="!wikiPages?.length" class="text-center py-12">
          <UIcon name="i-lucide-book-open" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <p class="text-stone-500 dark:text-stone-400">Aucune page wiki pour le moment</p>
          <UButton
            v-if="isDirecteur"
            label="Creer la premiere page"
            icon="i-lucide-plus"
            variant="subtle"
            class="mt-4"
            to="/wiki/nouveau"
          />
        </div>

      </div>
    </div>
  </div>
</template>
