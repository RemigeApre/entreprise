<script setup lang="ts">
import type { WikiPage } from '~/utils/types'

const { getPages } = useWiki()
const { isDirecteur } = useAuth()

const { data: wikiPages, status } = useAsyncData('wiki-pages', getPages)

const search = ref('')

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

function readingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function excerpt(html: string, max = 140): string {
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

// Search in both title and content
const filteredPages = computed(() => {
  if (!wikiPages.value) return []
  const q = search.value.toLowerCase().trim()
  if (!q) return wikiPages.value
  return wikiPages.value.filter((p: WikiPage) =>
    p.titre.toLowerCase().includes(q) || stripHtml(p.contenu).toLowerCase().includes(q)
  )
})

// Highlight search matches in text
function highlightMatch(text: string): string {
  const q = search.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="wiki-highlight">$1</mark>')
}

// Extract smart excerpt around search match in content
function smartExcerpt(html: string): string {
  const q = search.value.toLowerCase().trim()
  const text = stripHtml(html)
  if (!q) {
    return text.length > 140 ? text.slice(0, 140).trim() + '...' : text
  }
  const idx = text.toLowerCase().indexOf(q)
  if (idx === -1) {
    return text.length > 140 ? text.slice(0, 140).trim() + '...' : text
  }
  const start = Math.max(0, idx - 50)
  const end = Math.min(text.length, idx + q.length + 90)
  let result = text.slice(start, end).trim()
  if (start > 0) result = '...' + result
  if (end < text.length) result = result + '...'
  return result
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
          class="w-full sm:w-52"
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
          v-if="!search"
          to="/wiki/identite"
          class="block mb-8 group"
        >
          <div class="wiki-pinned-card">
            <div class="flex items-center gap-4">
              <div class="size-12 rounded-xl bg-[rgba(175,143,60,0.08)] flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-palette" class="size-6 text-[#AF8F3C]" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="font-heading text-lg font-bold text-stone-900 group-hover:text-[#AF8F3C] transition-colors">
                    Notre identite
                  </h2>
                  <span class="wiki-pinned-badge">
                    <UIcon name="i-lucide-pin" class="size-3" />
                    Epingle
                  </span>
                </div>
                <p class="text-sm text-stone-500 mt-0.5">
                  Charte graphique, mood board, logo, palette de couleurs et typographie
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-stone-300 group-hover:text-[#AF8F3C] transition-colors shrink-0" />
            </div>
          </div>
        </NuxtLink>

        <!-- Loading -->
        <div v-if="status === 'pending' && !wikiPages" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        </div>

        <!-- Search results count -->
        <div v-if="search && filteredPages.length" class="flex items-center gap-2 mb-4 text-sm text-stone-500">
          <UIcon name="i-lucide-search" class="size-4" />
          <span>{{ filteredPages.length }} resultat{{ filteredPages.length > 1 ? 's' : '' }} pour "{{ search }}"</span>
        </div>

        <!-- Grille de pages -->
        <div v-if="filteredPages.length" class="wiki-grid">
          <NuxtLink
            v-for="page in filteredPages"
            :key="page.id"
            :to="`/wiki/${page.slug}`"
            class="group"
          >
            <div class="wiki-card">
              <!-- Colored accent bar -->
              <div
                class="wiki-card-accent"
                :style="{ background: page.couleur || 'rgba(175, 143, 60, 0.3)' }"
              />

              <div class="wiki-card-body">
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="size-9 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ background: (page.couleur || '#AF8F3C') + '12' }"
                  >
                    <UIcon
                      :name="page.icone || 'i-lucide-file-text'"
                      class="size-4.5"
                      :style="{ color: page.couleur || '#AF8F3C' }"
                    />
                  </div>
                  <h3
                    class="font-semibold text-stone-900 group-hover:text-[#AF8F3C] transition-colors truncate"
                    v-html="highlightMatch(page.titre)"
                  />
                </div>

                <p
                  class="text-sm text-stone-500 flex-1 line-clamp-3"
                  v-html="search ? highlightMatch(smartExcerpt(page.contenu)) : excerpt(page.contenu)"
                />

                <div class="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(175,143,60,0.06)]">
                  <div class="flex items-center gap-3 text-xs text-stone-400">
                    <span v-if="page.date_updated" class="flex items-center gap-1">
                      <UIcon name="i-lucide-clock" class="size-3" />
                      {{ formatDate(page.date_updated) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-book-open" class="size-3" />
                      {{ readingTime(page.contenu) }} min
                    </span>
                  </div>
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-stone-300 group-hover:text-[#AF8F3C] group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Vide -->
        <div v-else-if="search && wikiPages?.length" class="text-center py-12">
          <UIcon name="i-lucide-search-x" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-stone-500">Aucune page ne correspond a "{{ search }}"</p>
        </div>

        <div v-else-if="!wikiPages?.length" class="text-center py-12">
          <UIcon name="i-lucide-book-open" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-stone-500">Aucune page wiki pour le moment</p>
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

<style scoped>
.wiki-pinned-card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(175, 143, 60, 0.1);
  background: rgba(175, 143, 60, 0.03);
  transition: all 0.2s;
}
:global(.dark) .wiki-pinned-card {
  background: rgba(175, 143, 60, 0.03);
}
.wiki-pinned-card:hover {
  border-color: rgba(175, 143, 60, 0.2);
  box-shadow: 0 4px 16px rgba(175, 143, 60, 0.06);
}

.wiki-pinned-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #AF8F3C;
  background: rgba(175, 143, 60, 0.08);
}

.wiki-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 16px;
}
@media (min-width: 640px) {
  .wiki-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .wiki-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.wiki-card {
  position: relative;
  border-radius: 12px;
  border: 1px solid rgba(175, 143, 60, 0.08);
  background: white;
  overflow: hidden;
  height: 100%;
  transition: all 0.2s;
}
:global(.dark) .wiki-card {
  background: rgba(175, 143, 60, 0.02);
  border-color: rgba(175, 143, 60, 0.06);
}
.wiki-card:hover {
  border-color: rgba(175, 143, 60, 0.18);
  box-shadow: 0 4px 20px rgba(175, 143, 60, 0.06);
  transform: translateY(-1px);
}

.wiki-card-accent {
  height: 3px;
  width: 100%;
}

.wiki-card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 3px);
}

:deep(.wiki-highlight) {
  background: rgba(175, 143, 60, 0.25);
  border-radius: 2px;
  padding: 0 2px;
  color: inherit;
}
</style>
