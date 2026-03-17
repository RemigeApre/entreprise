<script setup lang="ts">
import { readItem } from '@directus/sdk'
import DOMPurify from 'isomorphic-dompurify'
import type { Article, UserProfile } from '~/utils/types'

definePageMeta({ layout: 'public' })

const route = useRoute()
const { $directus } = useNuxtApp()

const { data: article, status } = useAsyncData(`article-${route.params.id}`, async () => {
  try {
    const item = await $directus.request(readItem('articles', route.params.id as string, {
      fields: [
        'id', 'titre', 'contenu', 'date_publication',
        'auteur.first_name', 'auteur.last_name'
      ]
    }))
    return item as Article
  } catch {
    return null
  }
}, {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
})

// Throw 404 if article not found after loading
watch(
  () => [status.value, article.value] as const,
  ([s, a]) => {
    if (s === 'success' && !a) {
      throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
    }
  }
)

// Sanitize HTML content with DOMPurify
const safeContent = computed(() => {
  if (!article.value?.contenu) return ''
  return DOMPurify.sanitize(article.value.contenu)
})

function getAuteurNom(a: Article): string {
  if (typeof a.auteur === 'object' && a.auteur) {
    const u = a.auteur as UserProfile
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || ''
  }
  return ''
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function excerpt(html: string): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 160 ? text.slice(0, 160).trimEnd() + '…' : text
}

// SEO — set dynamically when article loads
watchEffect(() => {
  if (!article.value) return
  const desc = excerpt(article.value.contenu)
  useSeoMeta({
    title: `${article.value.titre} - Le Geai`,
    description: desc,
    ogTitle: article.value.titre,
    ogDescription: desc,
    ogType: 'article',
    twitterCard: 'summary'
  })
  useHead({
    link: [
      { rel: 'canonical', href: `https://entreprise.legeai-editions.com/articles/${article.value.id}` }
    ],
    script: [{
      type: 'application/ld+json',
      key: `article-${article.value.id}`,
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.value.titre,
        description: desc,
        datePublished: article.value.date_publication ?? undefined,
        dateModified: article.value.date_updated ?? article.value.date_publication ?? undefined,
        author: {
          '@type': 'Person',
          name: getAuteurNom(article.value) || 'Groupe Le Geai'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Groupe Le Geai',
          url: 'https://entreprise.legeai-editions.com'
        },
        url: `https://entreprise.legeai-editions.com/articles/${article.value.id}`
      })
    }]
  })
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })
</script>

<template>
  <div class="min-h-full">
    <!-- Back link -->
    <div class="px-6 pt-8 sm:pt-10">
      <div class="max-w-2xl mx-auto">
        <NuxtLink
          to="/articles"
          class="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 uppercase tracking-wider transition-colors duration-200"
        >
          <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Articles
        </NuxtLink>
      </div>
    </div>

    <!-- Skeleton -->
    <div v-if="status === 'pending'" class="px-6 py-12">
      <div class="max-w-2xl mx-auto animate-pulse space-y-6">
        <div class="h-3 w-40 bg-stone-200 rounded" />
        <div class="h-8 w-3/4 bg-stone-200 rounded" />
        <div class="space-y-3 pt-2">
          <div class="h-3.5 bg-stone-100 rounded w-full" />
          <div class="h-3.5 bg-stone-100 rounded w-full" />
          <div class="h-3.5 bg-stone-100 rounded w-5/6" />
          <div class="h-3.5 bg-stone-100 rounded w-4/6" />
        </div>
      </div>
    </div>

    <!-- Article -->
    <article
      v-else-if="article"
      class="px-6 pt-10 pb-20 transition-all duration-700 ease-out"
      :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
    >
      <div class="max-w-2xl mx-auto">
        <!-- Date -->
        <div class="flex items-center gap-3 mb-6">
          <div class="w-8 h-px bg-gradient-to-r from-[var(--color-brand-gold)]/40 to-transparent" />
          <span v-if="article.date_publication" class="text-xs text-stone-400 uppercase tracking-wider">
            {{ formatDate(article.date_publication) }}
          </span>
        </div>

        <!-- Title -->
        <h1 class="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-8">
          {{ article.titre }}
        </h1>

        <!-- Content -->
        <div class="text-stone-700 leading-relaxed article-content" v-html="safeContent" />

        <!-- Author -->
        <div v-if="getAuteurNom(article)" class="mt-10 pt-6 border-t border-stone-200/40">
          <span class="text-xs text-stone-400">
            {{ getAuteurNom(article) }}
          </span>
        </div>
      </div>
    </article>

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
  margin-bottom: 0.85em;
  font-size: 1rem;
  line-height: 1.75;
}
.article-content :deep(p:last-child) {
  margin-bottom: 0;
}
.article-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
.article-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1.25em;
  margin-bottom: 0.4em;
}
.article-content :deep(ul),
.article-content :deep(ol) {
  padding-left: 1.4em;
  margin-bottom: 0.85em;
}
.article-content :deep(li) {
  margin-bottom: 0.3em;
}
.article-content :deep(a) {
  color: rgba(175, 143, 60, 0.9);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.article-content :deep(blockquote) {
  border-left: 2px solid rgba(175, 143, 60, 0.3);
  padding-left: 1em;
  margin-left: 0;
  color: rgba(0, 0, 0, 0.5);
  font-style: italic;
}
</style>
