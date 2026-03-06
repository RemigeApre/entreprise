<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

definePageMeta({ layout: 'landing' })

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=IM+Fell+DW+Pica:ital@0;1&family=UnifrakturCook:wght@700&display=swap'
    }
  ]
})

useSeoMeta({
  title: 'Recrutement \u2014 Le Geai',
  description: 'Decouvrez les offres d\'emploi du groupe Le Geai.',
  ogTitle: 'Recrutement \u2014 Le Geai',
  ogDescription: 'Rejoignez-nous. Decouvrez les opportunites au sein du groupe Le Geai.'
})

const { $directus } = useNuxtApp()

const { data: offres, status } = useAsyncData('offres-publiques', async () => {
  try {
    const items = await $directus.request(readItems('offres_emploi', {
      filter: {
        publie: { _eq: true },
        _or: [
          { date_expiration: { _null: true } },
          { date_expiration: { _gte: new Date().toISOString().split('T')[0] } }
        ]
      },
      fields: [
        'id', 'titre', 'description', 'type_contrat', 'localisation',
        'salaire_min', 'salaire_max', 'salaire_periode',
        'competences_requises', 'avantages', 'date_publication',
        'categorie.id', 'categorie.nom', 'categorie.couleur'
      ],
      sort: ['-date_publication']
    }))
    return items as OffreEmploi[]
  } catch {
    return []
  }
})

const selectedOffre = ref<OffreEmploi | null>(null)
const isSlideoverOpen = ref(false)

const visible = ref(false)
const revealed = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true
    revealed.value = true
  })
})

function openDetail(offre: OffreEmploi) {
  selectedOffre.value = offre
  isSlideoverOpen.value = true
}

function formatSalaire(offre: OffreEmploi) {
  if (!offre.salaire_min && !offre.salaire_max) return null
  const periodeLabel = offre.salaire_periode === 'mois' ? '/mois' : offre.salaire_periode === 'annee' ? '/an' : '/h'
  if (offre.salaire_min && offre.salaire_max) {
    return `${offre.salaire_min.toLocaleString('fr-FR')} \u2013 ${offre.salaire_max.toLocaleString('fr-FR')} EUR${periodeLabel}`
  }
  return `${(offre.salaire_min || offre.salaire_max)!.toLocaleString('fr-FR')} EUR${periodeLabel}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <!-- EXACT SAME structure as index.vue, class "revealed" instead of "login-mode" -->
  <div class="landing" :class="{ 'is-visible': visible, 'revealed': revealed }">

    <!-- Noise filter — identical to index.vue -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="noise-layer" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#noise)" /></svg>
    </div>

    <!-- Vignette — identical to index.vue -->
    <div class="vignette" aria-hidden="true" />

    <!-- Watermark — identical to index.vue -->
    <div class="watermark" aria-hidden="true">
      <img src="/logo.svg" alt="" class="watermark-img" />
    </div>

    <!-- Gold frame — identical to index.vue -->
    <div class="frame" aria-hidden="true">
      <div class="corner corner--tl" />
      <div class="corner corner--tr" />
      <div class="corner corner--bl" />
      <div class="corner corner--br" />
      <div class="frame-mark frame-mark--top" />
      <div class="frame-mark frame-mark--bottom" />
    </div>

    <!-- Top bar — hidden like index.vue top-bar -->
    <header class="top-bar">
      <NuxtLink to="/" class="top-back">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Retour</span>
      </NuxtLink>
    </header>

    <!-- No center text for recrutement — direct reveal -->

    <!-- OFFRES PANEL — mirror of .login-panel -->
    <!-- login-panel: position fixed, top 0, RIGHT 0, bottom 0, width 50% -->
    <!-- offres-panel: position fixed, top 0, LEFT 0, bottom 0, width 50% -->
    <div class="offres-panel">
      <!-- login-back: position absolute, top ..., LEFT ... -->
      <!-- panel-back: position absolute, top ..., RIGHT ... -->
      <NuxtLink to="/" class="panel-back">
        <UIcon name="i-lucide-arrow-right" class="size-4" />
        <span>Retour</span>
      </NuxtLink>

      <!-- Content — same structure as login-form-wrap -->
      <div class="panel-content">
        <h2 class="panel-title">Recrutement</h2>
        <div class="panel-ornament">
          <div class="panel-ornament-line" />
        </div>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="panel-loading">
          <div class="panel-spinner" />
        </div>

        <!-- Empty -->
        <div v-else-if="!offres?.length" class="panel-empty">
          <p class="panel-empty-title">Aucune offre pour le moment</p>
          <p class="panel-empty-text">Revenez bientot, de nouvelles opportunites sont en preparation.</p>
        </div>

        <!-- Offres -->
        <div v-else class="panel-offres">
          <article
            v-for="(offre, i) in offres"
            :key="offre.id"
            class="offre-card"
            :style="{ transitionDelay: `${600 + i * 100}ms` }"
            @click="openDetail(offre)"
          >
            <div class="offre-top">
              <h3 class="offre-title">{{ offre.titre }}</h3>
              <span class="offre-badge">{{ offre.type_contrat }}</span>
            </div>
            <div class="offre-meta">
              <span v-if="offre.localisation">{{ offre.localisation }}</span>
              <span v-if="formatSalaire(offre)">{{ formatSalaire(offre) }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- Slideover for detail -->
    <USlideover v-model:open="isSlideoverOpen">
      <template #content>
        <div v-if="selectedOffre" class="slideover-inner">
          <h2 class="slideover-title">{{ selectedOffre.titre }}</h2>
          <span class="offre-badge">{{ selectedOffre.type_contrat }}</span>

          <div class="slideover-meta">
            <span v-if="selectedOffre.localisation">{{ selectedOffre.localisation }}</span>
            <span v-if="formatSalaire(selectedOffre)">{{ formatSalaire(selectedOffre) }}</span>
            <span v-if="selectedOffre.date_publication">{{ formatDate(selectedOffre.date_publication) }}</span>
          </div>

          <div class="slideover-sep" />

          <div v-if="selectedOffre.description">
            <h3 class="slideover-heading">Description</h3>
            <div class="slideover-prose" v-html="selectedOffre.description" />
          </div>

          <div v-if="selectedOffre.competences_requises">
            <h3 class="slideover-heading">Competences requises</h3>
            <div class="slideover-prose" v-html="selectedOffre.competences_requises" />
          </div>

          <div v-if="selectedOffre.avantages">
            <h3 class="slideover-heading">Avantages</h3>
            <div class="slideover-prose" v-html="selectedOffre.avantages" />
          </div>

          <div class="slideover-sep" />

          <p class="slideover-cta">
            Pour postuler, envoyez votre CV a
            <strong>recrutement@legeai-editions.com</strong>
          </p>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
/* ============================
   BASE — COPY-PASTE from index.vue
   ============================ */
.landing {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  --terracotta: #B74D34;
  --cream: #F7F0DE;
  --ink: #2c2419;
  --transition: 1.4s cubic-bezier(0.4, 0, 0.2, 1);

  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  font-family: 'Crimson Pro', Georgia, serif;
  color: var(--ink);
  overflow: hidden;
}
:global(.dark) .landing { color: var(--cream); }

/* ============================
   LAYERS — COPY-PASTE from index.vue
   ============================ */
.noise-layer {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 1;
  opacity: 0.02; mix-blend-mode: overlay;
}
:global(.dark) .noise-layer { opacity: 0.035; }

.vignette {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 1;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(44, 36, 25, 0.07) 100%);
}
:global(.dark) .vignette {
  background: radial-gradient(ellipse at center, transparent 20%, rgba(10, 16, 11, 0.4) 100%);
}

/* ============================
   WATERMARK — COPY-PASTE from index.vue
   ============================ */
.watermark {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(500px, 100vmin, 920px);
  height: clamp(500px, 100vmin, 920px);
  pointer-events: none; z-index: 0;
  transition: left var(--transition), width var(--transition), height var(--transition);
}
.watermark-img {
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0.04;
  transition: opacity var(--transition), filter var(--transition);
}
:global(.dark) .watermark-img {
  filter: brightness(0) invert(0.85);
  opacity: 0.055;
}

/*
 * MIRROR of index.vue login-mode watermark:
 *   .login-mode .watermark { left: 0; }        → slides LEFT
 *   .revealed   .watermark { left: 100%; }      → slides RIGHT
 */
.revealed .watermark {
  left: 100%;
  width: clamp(600px, 100vh, 1100px);
  height: clamp(600px, 100vh, 1100px);
}
.revealed .watermark-img {
  opacity: 1;
  filter: none;
}
:global(.dark) .revealed .watermark-img {
  opacity: 1;
  filter: none;
}

/* ============================
   FRAME — COPY-PASTE from index.vue
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
  transition: opacity var(--transition);
}
/* index.vue: .login-mode .frame { opacity: 0.3; } */
.revealed .frame { opacity: 0.3; }

.corner { position: absolute; width: 26px; height: 26px; }
.corner--tl { top: -1px; left: -1px; border-top: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.corner--tr { top: -1px; right: -1px; border-top: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }
.corner--bl { bottom: -1px; left: -1px; border-bottom: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.corner--br { bottom: -1px; right: -1px; border-bottom: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }
.frame-mark { position: absolute; background: var(--gold-dim); }
.frame-mark--top, .frame-mark--bottom { width: 1px; height: 10px; left: 50%; transform: translateX(-50%); }
.frame-mark--top { top: -1px; }
.frame-mark--bottom { bottom: -1px; }

/* ============================
   TOP BAR — based on index.vue .top-bar
   ============================ */
.top-bar {
  position: fixed;
  top: clamp(18px, 3.5vw, 32px);
  left: clamp(18px, 3.5vw, 32px);
  z-index: 10;
  display: flex; gap: 10px; align-items: center;
  opacity: 0;
  transition: opacity 0.8s ease 0.2s;
}
.is-visible .top-bar { opacity: 1; }
/* index.vue: .login-mode .top-bar { opacity: 0; pointer-events: none; } */
.revealed .top-bar { opacity: 0; pointer-events: none; }

.top-back {
  display: flex; align-items: center; gap: 8px;
  text-decoration: none;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.7;
  transition: opacity 0.3s, gap 0.3s;
}
.top-back:hover { opacity: 1; gap: 12px; }


/* ============================
   OFFRES PANEL
   Mirror of index.vue .login-panel

   index.vue login-panel:
     position: fixed; top: 0; right: 0; bottom: 0; width: 50%;
     opacity: 0; transform: translateX(60px);
     transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;

   Mirror:
     position: fixed; top: 0; left: 0; bottom: 0; width: 50%;
     opacity: 0; transform: translateX(-60px);
     same transition
   ============================ */
.offres-panel {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 50%;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 4vw, 48px);
  overflow-y: auto;
  opacity: 0;
  transform: translateX(-60px);
  pointer-events: none;
  transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
}
/* index.vue: .login-mode .login-panel { opacity: 1; transform: translateX(0); pointer-events: auto; } */
.revealed .offres-panel {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

/*
 * PANEL BACK — mirror of index.vue .login-back
 * index.vue: position: absolute; top: ...; left: ...;
 * mirror:    position: absolute; top: ...; right: ...;
 */
.panel-back {
  position: absolute;
  top: clamp(20px, 3.5vw, 36px);
  right: clamp(20px, 3vw, 40px);
  display: flex; align-items: center; gap: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0.7;
  transition: opacity 0.3s, gap 0.3s;
}
.panel-back:hover { opacity: 1; gap: 12px; }

/*
 * PANEL CONTENT — mirror of index.vue .login-form-wrap
 * index.vue: width: 100%; max-width: 380px;
 */
.panel-content {
  width: 100%;
  max-width: 420px;
}

/*
 * PANEL TITLE — mirror of index.vue .login-title
 */
.panel-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 10px;
}

/*
 * PANEL ORNAMENT — mirror of index.vue .login-ornament
 */
.panel-ornament {
  display: flex; justify-content: center;
  margin-bottom: clamp(24px, 4vh, 40px);
}
.panel-ornament-line {
  width: 50px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* Loading */
.panel-loading {
  display: flex; justify-content: center; padding: 40px 0;
}
.panel-spinner {
  width: 16px; height: 16px;
  border: 1.5px solid var(--gold-dim);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Empty */
.panel-empty {
  text-align: center;
}
.panel-empty-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  margin-bottom: 6px;
}
.panel-empty-text {
  font-size: 0.85rem;
  opacity: 0.4;
}

/*
 * OFFRE CARDS — styled like login-field items
 */
.panel-offres {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offre-card {
  padding: 16px 20px;
  border: 1px solid var(--gold-dim);
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, background 0.3s;
}
.revealed .offre-card {
  opacity: 1;
  transform: translateY(0);
}
.offre-card:hover {
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.04);
}
:global(.dark) .offre-card:hover {
  background: rgba(175, 143, 60, 0.08);
}

.offre-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
}

.offre-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  transition: color 0.3s;
}
.offre-card:hover .offre-title { color: var(--gold); }

.offre-badge {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid var(--gold-faint);
  color: var(--gold);
  white-space: nowrap;
  flex-shrink: 0;
}

.offre-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.78rem;
  opacity: 0.4;
}

/* ============================
   SLIDEOVER
   ============================ */
.slideover-inner {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Crimson Pro', Georgia, serif;
}
.slideover-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.06em;
}
.slideover-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.85rem;
  opacity: 0.45;
}
.slideover-sep {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-faint), transparent);
}
.slideover-heading {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
  color: var(--gold);
}
.slideover-prose {
  font-size: 0.88rem;
  line-height: 1.7;
  opacity: 0.6;
}
.slideover-cta {
  font-size: 0.88rem;
  opacity: 0.5;
}
.slideover-cta strong {
  opacity: 1;
  color: var(--gold);
}

/* ============================
   RESPONSIVE — mirror of index.vue

   index.vue:
     @media (max-width: 899px) {
       .login-panel { width: 100%; }
       .login-mode .watermark { left: 50%; smaller size }
     }
   ============================ */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-height: 580px) {
  .title-main { font-size: clamp(2rem, 7vw, 3.5rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 899px) {
  .offres-panel {
    width: 100%;
  }
  .revealed .watermark {
    left: 50%;
    width: clamp(350px, 90vmin, 600px);
    height: clamp(350px, 90vmin, 600px);
  }
}
</style>
