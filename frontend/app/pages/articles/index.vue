<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Article, UserProfile } from '~/utils/types'

definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Articles - Le Geai',
  description: 'Les publications du groupe Le Geai. Réflexions, actualités et coulisses de l\'édition, de l\'informatique et des médias.',
  ogTitle: 'Articles - Groupe Le Geai',
  ogDescription: 'Réflexions, actualités et coulisses du groupe Le Geai, publiées régulièrement.',
  ogType: 'website',
  twitterCard: 'summary'
})

const { $directus } = useNuxtApp()

const PAGE_SIZE = 20
const page = ref(1)

const { data: articles, status } = useAsyncData('articles-publics', async () => {
  try {
    const items = await $directus.request(readItems('articles', {
      filter: {
        statut: { _eq: 'publie' },
        date_publication: { _lte: '$NOW' }
      },
      fields: [
        'id', 'titre', 'contenu', 'date_publication',
        'auteur.first_name', 'auteur.last_name'
      ],
      sort: ['-date_publication'],
      limit: -1
    }))
    return items as Article[]
  } catch {
    return []
  }
}, {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
})

const visibleArticles = computed(() => {
  if (!articles.value) return []
  return articles.value.slice(0, page.value * PAGE_SIZE)
})

const hasMore = computed(() => {
  if (!articles.value) return false
  return visibleArticles.value.length < articles.value.length
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

function getAuteurNom(a: Article): string {
  if (typeof a.auteur === 'object' && a.auteur) {
    const u = a.auteur as UserProfile
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || ''
  }
  return ''
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatDay(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' })
}

function excerpt(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 180 ? text.slice(0, 180).trimEnd() + '…' : text
}
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <section class="px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 text-center">
      <div
        class="max-w-2xl mx-auto transition-all duration-1000 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <!-- Ornament -->
        <div class="flex items-center justify-center gap-3 mb-6 opacity-40">
          <div class="w-10 h-px bg-stone-400" />
          <div class="size-1.5 rotate-45 bg-stone-400" />
          <div class="w-10 h-px bg-stone-400" />
        </div>

        <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Articles
        </h1>
        <div class="w-14 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)]/50 to-transparent mx-auto mt-5 mb-4" />
        <p class="text-stone-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Réflexions, actualités et coulisses du groupe Le Geai.
        </p>
      </div>
    </section>

    <!-- Skeleton loading -->
    <div v-if="status === 'pending'" class="px-6 pb-12">
      <div class="max-w-2xl mx-auto space-y-10">
        <div v-for="n in 3" :key="n" class="animate-pulse">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-px bg-stone-200" />
            <div class="h-3 w-40 bg-stone-200 rounded" />
          </div>
          <div class="rounded-2xl border border-stone-200/60 p-6 sm:p-8 space-y-3">
            <div class="h-5 w-3/4 bg-stone-200 rounded" />
            <div class="space-y-2 pt-1">
              <div class="h-3.5 bg-stone-100 rounded w-full" />
              <div class="h-3.5 bg-stone-100 rounded w-5/6" />
              <div class="h-3.5 bg-stone-100 rounded w-4/6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!articles?.length" class="text-center px-6 pb-20">
      <p class="text-stone-400 text-sm">
        Aucun article publié pour le moment. Revenez bientôt.
      </p>
    </div>

    <!-- Articles feed -->
    <section v-else class="px-6 pb-12">
      <div class="max-w-2xl mx-auto space-y-10">
        <article
          v-for="(article, i) in visibleArticles"
          :key="article.id"
          class="transition-all duration-700 ease-out"
          :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          :style="{ transitionDelay: `${300 + i * 120}ms` }"
        >
          <!-- Date line -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-px bg-gradient-to-r from-[var(--color-brand-gold)]/40 to-transparent" />
            <span v-if="article.date_publication" class="text-xs text-stone-400 uppercase tracking-wider">
              {{ formatDay(article.date_publication) }} {{ formatDate(article.date_publication) }}
            </span>
          </div>

          <!-- Card — clickable link -->
          <NuxtLink
            :to="`/articles/${article.id}`"
            class="block rounded-2xl border border-stone-200/60 p-6 sm:p-8 hover:border-stone-300/80 hover:shadow-sm transition-all duration-200 group"
          >
            <h2 class="font-heading text-lg sm:text-xl font-semibold mb-3 group-hover:text-[var(--color-brand-gold)] transition-colors duration-200">
              {{ article.titre }}
            </h2>
            <p class="text-sm text-stone-500 leading-relaxed line-clamp-3">
              {{ excerpt(article.contenu) }}
            </p>

            <!-- Author + read more -->
            <div class="mt-5 flex items-center justify-between">
              <span v-if="getAuteurNom(article)" class="text-xs text-stone-400">
                {{ getAuteurNom(article) }}
              </span>
              <span class="text-xs text-[var(--color-brand-gold)]/70 group-hover:text-[var(--color-brand-gold)] transition-colors duration-200 ml-auto">
                Lire →
              </span>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="flex justify-center mt-12">
        <button
          class="px-8 py-2.5 border border-stone-300/60 text-stone-500 text-sm rounded-lg hover:border-stone-400 hover:text-stone-700 transition-all duration-200"
          @click="page++"
        >
          Voir plus d'articles
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 pb-6 text-center">
      <div class="max-w-4xl mx-auto pt-6 border-t border-stone-200/40">
        <p class="text-[11px] text-stone-400">
          &copy; {{ new Date().getFullYear() }} Groupe Le Geai. Tous droits réservés
        </p>
      </div>
    </footer>
  </div>
</template>
