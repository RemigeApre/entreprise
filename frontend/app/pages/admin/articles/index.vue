<script setup lang="ts">
import type { Article, UserProfile } from '~/utils/types'
import { ARTICLE_STATUTS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const { getAll, publish, unpublish } = useArticles()
const toast = useToast()

const { data: articles, status, refresh } = useAsyncData('admin-articles', getAll)

const search = ref('')
const filterStatut = ref<string>('')
const togglingId = ref<string | null>(null)

const statutOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Publie', value: 'publie' },
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Programme', value: 'programme' }
]

const filteredArticles = computed(() => {
  if (!articles.value) return []
  let list = articles.value

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((a: Article) =>
      a.titre.toLowerCase().includes(q)
      || a.contenu.toLowerCase().includes(q)
    )
  }

  if (filterStatut.value) {
    list = list.filter((a: Article) => a.statut === filterStatut.value)
  }

  return list
})

const stats = computed(() => {
  if (!articles.value) return { total: 0, publies: 0, brouillons: 0, programmes: 0 }
  const total = articles.value.length
  const publies = articles.value.filter((a: Article) => a.statut === 'publie').length
  const programmes = articles.value.filter((a: Article) => a.statut === 'programme').length
  return { total, publies, brouillons: total - publies - programmes, programmes }
})

const hasFilters = computed(() => !!search.value || !!filterStatut.value)

function clearFilters() {
  search.value = ''
  filterStatut.value = ''
}

function getAuteurNom(a: Article): string {
  if (typeof a.auteur === 'object' && a.auteur) {
    const u = a.auteur as UserProfile
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Inconnu'
  }
  return 'Inconnu'
}

async function handleTogglePublish(article: Article) {
  togglingId.value = article.id
  try {
    if (article.statut === 'publie') {
      await unpublish(article.id)
      toast.add({ title: 'Article depublie', color: 'success' })
    } else {
      await publish(article.id)
      toast.add({ title: 'Article publie', color: 'success' })
    }
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

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '')
}

function truncate(text: string, max: number) {
  const clean = stripHtml(text)
  if (clean.length <= max) return clean
  return clean.substring(0, max).trimEnd() + '...'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Articles">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/admin" />
      </template>
      <template #right>
        <UButton
          label="Nouvel article"
          icon="i-lucide-plus"
          size="sm"
          to="/admin/articles/nouveau"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Stats -->
      <div v-if="articles && articles.length" class="flex items-center gap-4 text-xs">
        <span class="text-[#2c2419]/60">
          <strong class="text-[#2c2419]">{{ stats.total }}</strong> article{{ stats.total > 1 ? 's' : '' }}
        </span>
        <span class="flex items-center gap-1 text-emerald-600">
          <span class="size-1.5 rounded-full bg-emerald-500" />
          {{ stats.publies }} publie{{ stats.publies > 1 ? 's' : '' }}
        </span>
        <span v-if="stats.programmes" class="flex items-center gap-1 text-blue-600">
          <span class="size-1.5 rounded-full bg-blue-500" />
          {{ stats.programmes }} programme{{ stats.programmes > 1 ? 's' : '' }}
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
          v-model="filterStatut"
          :items="statutOptions"
          value-key="value"
          size="sm"
          class="w-full sm:w-40"
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
          {{ filteredArticles.length }} resultat{{ filteredArticles.length > 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Empty state -->
        <div v-if="!filteredArticles.length" class="text-center py-12">
          <UIcon name="i-lucide-feather" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-stone-500">
            {{ hasFilters ? 'Aucun resultat pour ces filtres' : 'Aucun article' }}
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
            label="Ecrire un article"
            icon="i-lucide-plus"
            class="mt-4"
            to="/admin/articles/nouveau"
          />
        </div>

        <!-- Cards -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <NuxtLink
            v-for="article in filteredArticles"
            :key="article.id"
            :to="`/admin/articles/${article.id}`"
            class="block group"
          >
            <div
              class="relative flex flex-col gap-3 rounded-xl border p-4 transition-all h-full"
              :class="article.statut === 'publie'
                ? 'border-emerald-200/60 hover:border-emerald-300 hover:bg-emerald-50/30'
                : 'border-stone-200 hover:border-[#af8f3c]/30 hover:bg-[#af8f3c]/[0.03]'"
            >
              <!-- Top row -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-[#2c2419] truncate group-hover:text-[#af8f3c] transition-colors mb-1.5">
                    {{ article.titre }}
                  </h3>
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge
                      :color="ARTICLE_STATUTS[article.statut]?.color || 'neutral'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ ARTICLE_STATUTS[article.statut]?.label || article.statut }}
                    </UBadge>
                    <span class="text-xs text-stone-500">
                      {{ getAuteurNom(article) }}
                    </span>
                  </div>
                </div>

                <!-- Toggle publish -->
                <div class="flex items-center gap-2 shrink-0" @click.prevent.stop>
                  <span class="text-[11px] font-medium" :class="article.statut === 'publie' ? 'text-emerald-600' : 'text-stone-400'">
                    {{ article.statut === 'publie' ? 'Publie' : 'Brouillon' }}
                  </span>
                  <USwitch
                    :model-value="article.statut === 'publie'"
                    :loading="togglingId === article.id"
                    size="sm"
                    @update:model-value="handleTogglePublish(article)"
                  />
                </div>
              </div>

              <!-- Preview -->
              <p class="text-xs text-stone-500 leading-relaxed line-clamp-2">
                {{ truncate(article.contenu, 160) }}
              </p>

              <!-- Footer -->
              <div class="flex items-center justify-between text-[11px] text-stone-400 mt-auto pt-2 border-t border-stone-100">
                <span>Cree le {{ formatDateFr(article.date_created) }}</span>
                <span v-if="article.date_publication">
                  {{ article.statut === 'programme' ? 'Programme pour le' : 'Publie le' }}
                  {{ formatDateFr(article.date_publication) }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
