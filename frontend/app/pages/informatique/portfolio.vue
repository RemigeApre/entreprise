<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { Realisation } from '~/utils/types'

definePageMeta({ layout: 'informatique' })

const SITE = 'https://legeai-editions.com'

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: `${SITE}/informatique/portfolio` }],
})
useSeoMeta({
  title: 'Portfolio · Le Geai Informatique',
  description: 'Réalisations Le Geai Informatique : sites web, espaces de gestion, e-commerce, logiciels sur mesure pour indépendants, artisans et PME.',
  ogTitle: 'Portfolio · Le Geai Informatique',
  ogDescription: 'Cadres différents, mêmes exigences : un usage clair, un outil fiable, une présence durable.',
})

const { $directus } = useNuxtApp()
const config = useRuntimeConfig()
const assetBase = config.public.directusUrl as string

function coverUrl(id?: string | null): string | null {
  return id ? `${assetBase}/assets/${id}` : null
}

const { data: realisations, status } = useAsyncData('realisations-publiques', async () => {
  try {
    const items = await $directus.request(readItems('realisations', {
      filter: { statut: { _eq: 'publie' } },
      fields: ['id', 'titre', 'client', 'lien', 'description', 'tags', 'cover', 'ordre'],
      sort: ['ordre'],
      limit: -1,
    }))
    return items as Realisation[]
  } catch {
    return []
  }
}, {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
})

const hasError = computed(() => status.value === 'error')
</script>

<template>
  <div class="gi-portfolio">
    <header class="gi-portfolio-head">
      <div class="gi-container-narrow">
        <p class="gi-kicker">Portfolio</p>
        <h1>Nos réalisations</h1>
        <p class="gi-lead">
          Cadres différents, mêmes exigences : un usage clair, un outil fiable, une
          présence durable.
        </p>
      </div>
    </header>

    <section class="gi-container gi-portfolio-list">
      <p v-if="status === 'pending'" class="gi-empty">Chargement…</p>
      <p v-else-if="hasError" class="gi-empty">Le portfolio est temporairement indisponible. Revenez dans un instant.</p>
      <p v-else-if="!realisations?.length" class="gi-empty">Les premières réalisations seront publiées prochainement.</p>

      <ul v-else class="gi-grid">
        <li v-for="r in realisations" :key="r.id" class="gi-grid-item">
          <component
            :is="r.lien ? 'a' : 'div'"
            v-bind="r.lien ? { href: r.lien, target: '_blank', rel: 'noopener' } : {}"
            class="gi-pf-card"
            :class="{ 'gi-pf-card--static': !r.lien }"
          >
            <img v-if="coverUrl(r.cover)" :src="coverUrl(r.cover)!" alt="" class="gi-pf-cover" loading="lazy" />
            <div class="gi-pf-body">
              <p v-if="r.client" class="gi-pf-client">{{ r.client }}</p>
              <h2>{{ r.titre }}</h2>
              <p v-if="r.description" class="gi-pf-desc">{{ r.description }}</p>
              <ul v-if="r.tags && r.tags.length" class="gi-pf-tags" aria-label="Étiquettes">
                <li v-for="t in r.tags" :key="t">{{ t }}</li>
              </ul>
              <p v-if="r.lien" class="gi-pf-cta">Visiter le projet →</p>
            </div>
          </component>
        </li>
      </ul>
    </section>

    <section class="gi-cta-band">
      <div class="gi-container-narrow">
        <h2>Votre projet, la prochaine réalisation ?</h2>
        <p>Parlons de ce que vous cherchez à construire.</p>
        <NuxtLink to="/informatique/contact" class="gi-btn-primary">Nous écrire</NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.gi-portfolio-head { padding: 6rem 0 2.5rem; text-align: center; }
.gi-kicker { font-size: 0.78rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gi-dore); margin-bottom: 1.2rem; }
.gi-lead { max-width: 580px; margin: 1.4rem auto 0; font-style: italic; color: var(--gi-text-muted); }

.gi-portfolio-list { padding-bottom: 4rem; }
.gi-empty { text-align: center; padding: 3rem 0; font-style: italic; color: var(--gi-text-muted); }

.gi-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.4rem;
  padding: 0;
  margin-top: 1rem;
}
.gi-pf-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: inherit;
  border: 1px solid var(--gi-border);
  background: var(--gi-surface-card);
  transition: border-color 0.3s ease, transform 0.3s ease;
}
.gi-pf-card:not(.gi-pf-card--static):hover { border-color: var(--gi-dore); transform: translateY(-3px); }
.gi-pf-cover { width: 100%; height: 200px; object-fit: cover; }
.gi-pf-body { padding: 1.5rem; display: flex; flex-direction: column; flex: 1; }
.gi-pf-client { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gi-dore); opacity: 0.85; }
.gi-pf-card h2 { margin-top: 0.6rem; font-size: 1.4rem; text-align: left; }
.gi-pf-desc { margin-top: 0.8rem; color: var(--gi-text-muted); line-height: 1.6; font-size: 0.95rem; }
.gi-pf-tags { list-style: none; display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1rem; padding: 0; }
.gi-pf-tags li { padding: 0.25rem 0.7rem; border: 1px solid var(--gi-border); font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gi-text-dim); }
.gi-pf-cta { margin-top: auto; padding-top: 1.4rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gi-text-muted); transition: color 0.3s ease; }
.gi-pf-card:hover .gi-pf-cta { color: var(--gi-dore); }

.gi-cta-band { padding: 5rem 1.5rem; text-align: center; background: var(--gi-surface-raised); border-top: 1px solid var(--gi-border); }
.gi-cta-band h2 { margin-bottom: 1rem; }
.gi-cta-band p { color: var(--gi-text-muted); font-style: italic; margin-bottom: 2rem; }
</style>
