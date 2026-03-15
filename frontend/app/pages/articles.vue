<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Article, UserProfile } from '~/utils/types'

definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Articles - Le Geai',
  description: 'Les publications du groupe Le Geai. Réflexions, actualités et coulisses.',
  ogTitle: 'Articles - Le Geai',
  ogDescription: 'Les micro-articles du groupe Le Geai, publiés chaque mardi et jeudi.'
})

const { $directus } = useNuxtApp()

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
      sort: ['-date_publication']
    }))
    return items as Article[]
  } catch {
    return []
  }
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
          <div class="w-10 h-px bg-stone-400 dark:bg-stone-600" />
          <div class="size-1.5 rotate-45 bg-stone-400 dark:bg-stone-600" />
          <div class="w-10 h-px bg-stone-400 dark:bg-stone-600" />
        </div>

        <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Articles
        </h1>
        <div class="w-14 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)]/50 to-transparent mx-auto mt-5 mb-4" />
        <p class="text-stone-500 dark:text-stone-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Réflexions, actualités et coulisses du groupe Le Geai.
        </p>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="flex justify-center py-12">
      <div class="size-6 border-2 border-stone-300 dark:border-stone-600 border-t-[var(--color-brand-gold)] rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!articles?.length" class="text-center px-6 pb-20">
      <p class="text-stone-400 dark:text-stone-500 text-sm">
        Aucun article publié pour le moment. Revenez bientôt.
      </p>
    </div>

    <!-- Articles feed -->
    <section v-else class="px-6 pb-20">
      <div class="max-w-2xl mx-auto space-y-10">
        <article
          v-for="(article, i) in articles"
          :key="article.id"
          class="transition-all duration-700 ease-out"
          :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          :style="{ transitionDelay: `${300 + i * 120}ms` }"
        >
          <!-- Date line -->
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-px bg-gradient-to-r from-[var(--color-brand-gold)]/40 to-transparent" />
            <span v-if="article.date_publication" class="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              {{ formatDay(article.date_publication) }} {{ formatDate(article.date_publication) }}
            </span>
          </div>

          <!-- Card -->
          <div class="rounded-2xl border border-stone-200/60 dark:border-stone-800/60 p-6 sm:p-8">
            <h2 class="font-heading text-lg sm:text-xl font-semibold mb-4">
              {{ article.titre }}
            </h2>
            <div class="text-sm text-stone-600 dark:text-stone-400 leading-relaxed article-content" v-html="article.contenu" />

            <!-- Author -->
            <div v-if="getAuteurNom(article)" class="mt-6 pt-4 border-t border-stone-200/40 dark:border-stone-800/40">
              <span class="text-xs text-stone-400 dark:text-stone-500">
                {{ getAuteurNom(article) }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 pb-6 text-center">
      <div class="max-w-4xl mx-auto pt-6 border-t border-stone-200/40 dark:border-stone-800/40">
        <p class="text-[11px] text-stone-400 dark:text-stone-600">
          &copy; {{ new Date().getFullYear() }} Groupe Le Geai. Tous droits réservés
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.article-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}
.article-content :deep(u) {
  text-decoration-color: rgba(175, 143, 60, 0.4);
  text-underline-offset: 3px;
}
.article-content :deep(em) {
  font-style: italic;
}
.article-content :deep(p) {
  margin-bottom: 0.75em;
}
.article-content :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
