<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi, Category } from '~/utils/types'
import { CONTRACT_HEX_COLORS } from '~/utils/constants'

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
  title: 'Recrutement - Le Geai',
  description: 'Découvrez les offres d\'emploi du groupe Le Geai.',
  ogTitle: 'Recrutement - Le Geai',
  ogDescription: 'Rejoignez-nous. Découvrez les opportunités au sein du groupe Le Geai.'
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
        'id', 'titre', 'duree', 'description', 'missions', 'type_contrat', 'localisation', 'teletravail',
        'salaire_min', 'salaire_max', 'salaire_periode',
        'competences_requises', 'avantages', 'conditions', 'date_publication',
        'categorie.id', 'categorie.nom', 'categorie.couleur',
        'categories.categories_id.id', 'categories.categories_id.nom', 'categories.categories_id.couleur'
      ],
      sort: ['-date_publication']
    }))
    return items as OffreEmploi[]
  } catch {
    return []
  }
})

// ── Helpers ──
function getCategories(offre: OffreEmploi): Category[] {
  if (!offre.categories?.length) return []
  return offre.categories
    .map(j => typeof j.categories_id === 'object' ? j.categories_id : null)
    .filter((c): c is Category => c !== null)
}

function contratColor(type: string): string {
  return CONTRACT_HEX_COLORS[type] || '#AF8F3C'
}

// ── Filters ──
const filterContrat = ref<string | null>(null)
const filterCategorie = ref<string | null>(null)

const availableContrats = computed(() => {
  if (!offres.value) return []
  return [...new Set(offres.value.map(o => o.type_contrat))].sort()
})

const availableCategories = computed(() => {
  if (!offres.value) return []
  const map = new Map<string, Category>()
  for (const o of offres.value) {
    for (const cat of getCategories(o)) {
      if (!map.has(cat.id)) map.set(cat.id, cat)
    }
  }
  return [...map.values()].sort((a, b) => a.nom.localeCompare(b.nom))
})

const hasFilters = computed(() => availableContrats.value.length > 1 || availableCategories.value.length > 0)

const filteredOffres = computed(() => {
  if (!offres.value) return []
  return offres.value.filter(o => {
    if (filterContrat.value && o.type_contrat !== filterContrat.value) return false
    if (filterCategorie.value) {
      const cats = getCategories(o)
      if (!cats.some(c => c.id === filterCategorie.value)) return false
    }
    return true
  })
})

function toggleContrat(type: string) {
  filterContrat.value = filterContrat.value === type ? null : type
}

function toggleCategorie(id: string) {
  filterCategorie.value = filterCategorie.value === id ? null : id
}

const selectedOffre = ref<OffreEmploi | null>(null)
const isSlideoverOpen = ref(false)

const visible = ref(false)
const revealed = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true
    setTimeout(() => { revealed.value = true }, 50)
  })
})

function goBack() {
  revealed.value = false
  setTimeout(() => { navigateTo('/') }, 1400)
}

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

// ── Sharing ──
const copiedLink = ref(false)

function getShareUrl(offre: OffreEmploi) {
  if (import.meta.client) {
    return `${window.location.origin}/recrutement`
  }
  return '/recrutement'
}

function shareLinkedIn(offre: OffreEmploi) {
  const url = encodeURIComponent(getShareUrl(offre))
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener')
}

function shareTwitter(offre: OffreEmploi) {
  const url = encodeURIComponent(getShareUrl(offre))
  const text = encodeURIComponent(`${offre.titre} — Le Geai`)
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener')
}

async function copyLink(offre: OffreEmploi) {
  try {
    await navigator.clipboard.writeText(getShareUrl(offre))
    copiedLink.value = true
    setTimeout(() => { copiedLink.value = false }, 2000)
  } catch {
    // ignore
  }
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
      <button class="panel-back" @click="goBack">
        <span>Retour</span>
        <UIcon name="i-lucide-arrow-right" class="size-4 back-arrow" />
      </button>

      <!-- Content — same structure as login-form-wrap -->
      <div class="panel-content">
        <h2 class="panel-title">Recrutement</h2>
        <div class="panel-ornament">
          <div class="panel-ornament-line" />
        </div>

        <!-- Filters -->
        <div v-if="hasFilters && offres?.length" class="panel-filters">
          <div v-if="availableContrats.length > 1" class="filter-row">
            <button
              v-for="type in availableContrats"
              :key="type"
              class="filter-pill"
              :class="{ 'is-active': filterContrat === type }"
              :style="filterContrat === type ? { borderColor: contratColor(type), color: contratColor(type) } : {}"
              @click="toggleContrat(type)"
            >
              <span class="filter-dot" :style="{ background: contratColor(type) }" />
              {{ type }}
            </button>
          </div>
          <div v-if="availableCategories.length" class="filter-row">
            <button
              v-for="cat in availableCategories"
              :key="cat.id"
              class="filter-pill"
              :class="{ 'is-active': filterCategorie === cat.id }"
              :style="filterCategorie === cat.id && cat.couleur ? { borderColor: cat.couleur, color: cat.couleur } : {}"
              @click="toggleCategorie(cat.id)"
            >
              <span v-if="cat.couleur" class="filter-dot" :style="{ background: cat.couleur }" />
              {{ cat.nom }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="panel-loading">
          <div class="panel-spinner" />
        </div>

        <!-- Empty -->
        <div v-else-if="!offres?.length" class="panel-empty">
          <p class="panel-empty-title">Aucune offre pour le moment</p>
          <p class="panel-empty-text">Revenez bientôt, de nouvelles opportunités sont en préparation.</p>
        </div>

        <!-- No results after filter -->
        <div v-else-if="!filteredOffres.length" class="panel-empty">
          <p class="panel-empty-title">Aucune offre ne correspond</p>
          <p class="panel-empty-text">Essayez de modifier vos filtres.</p>
        </div>

        <!-- Offres -->
        <div v-else class="panel-offres">
          <article
            v-for="(offre, i) in filteredOffres"
            :key="offre.id"
            class="offre-card"
            :style="{ '--band-color': contratColor(offre.type_contrat), transitionDelay: `${600 + i * 100}ms` }"
            @click="openDetail(offre)"
          >
            <div class="offre-band">
              <span class="offre-band-text">{{ offre.type_contrat }}</span>
            </div>
            <div class="offre-body">
              <h3 class="offre-title">{{ offre.titre }}</h3>
              <div class="offre-meta">
                <span v-if="offre.localisation">{{ offre.localisation }}</span>
                <span v-if="offre.teletravail">Télétravail {{ offre.teletravail }}</span>
                <span v-if="formatSalaire(offre)">{{ formatSalaire(offre) }}</span>
              </div>
              <div v-if="getCategories(offre).length" class="offre-cats">
                <span
                  v-for="cat in getCategories(offre)"
                  :key="cat.id"
                  class="offre-cat"
                  :style="cat.couleur ? { borderColor: cat.couleur + '60', color: cat.couleur } : {}"
                >{{ cat.nom }}</span>
              </div>
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
          <div class="slideover-badges">
            <span class="slideover-contrat" :style="{ borderColor: contratColor(selectedOffre.type_contrat) + '80', color: contratColor(selectedOffre.type_contrat) }">
              {{ selectedOffre.type_contrat }}
            </span>
            <span v-if="selectedOffre.duree" class="slideover-contrat" style="opacity:0.6">
              {{ selectedOffre.duree }}
            </span>
            <span
              v-for="cat in getCategories(selectedOffre)"
              :key="cat.id"
              class="slideover-cat"
              :style="cat.couleur ? { borderColor: cat.couleur + '60', color: cat.couleur } : {}"
            >{{ cat.nom }}</span>
          </div>

          <div class="slideover-meta">
            <span v-if="selectedOffre.localisation">{{ selectedOffre.localisation }}</span>
            <span v-if="selectedOffre.teletravail">Télétravail {{ selectedOffre.teletravail }}</span>
            <span v-if="formatSalaire(selectedOffre)">{{ formatSalaire(selectedOffre) }}</span>
            <span v-if="selectedOffre.date_publication">{{ formatDate(selectedOffre.date_publication) }}</span>
          </div>

          <div class="slideover-sep" />

          <div v-if="selectedOffre.description">
            <h3 class="slideover-heading">Présentation de l'entreprise</h3>
            <div class="slideover-prose" style="white-space: pre-line">{{ selectedOffre.description }}</div>
          </div>

          <div v-if="selectedOffre.missions">
            <h3 class="slideover-heading">Missions</h3>
            <div class="slideover-prose" style="white-space: pre-line">{{ selectedOffre.missions }}</div>
          </div>

          <div v-if="selectedOffre.competences_requises">
            <h3 class="slideover-heading">Attendus</h3>
            <div class="slideover-prose" style="white-space: pre-line">{{ selectedOffre.competences_requises }}</div>
          </div>

          <div v-if="selectedOffre.avantages">
            <h3 class="slideover-heading">Ce que vous gagnez</h3>
            <div class="slideover-prose" style="white-space: pre-line">{{ selectedOffre.avantages }}</div>
          </div>

          <div v-if="formatSalaire(selectedOffre)">
            <h3 class="slideover-heading">Rémunération</h3>
            <p class="slideover-prose">{{ formatSalaire(selectedOffre) }}</p>
          </div>

          <div v-if="selectedOffre.conditions">
            <h3 class="slideover-heading">Conditions</h3>
            <div class="slideover-prose" style="white-space: pre-line">{{ selectedOffre.conditions }}</div>
          </div>

          <div class="slideover-sep" />

          <p class="slideover-cta">
            Pour postuler, envoyez votre CV à
            <strong>administration@legeai-editions.com</strong>
          </p>

          <!-- Social sharing -->
          <div class="slideover-share">
            <span class="slideover-share-label">Partager</span>
            <button class="share-btn" title="Partager sur LinkedIn" @click="shareLinkedIn(selectedOffre)">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </button>
            <button class="share-btn" title="Partager sur X (Twitter)" @click="shareTwitter(selectedOffre)">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button class="share-btn" :class="{ 'is-copied': copiedLink }" :title="copiedLink ? 'Lien copié !' : 'Copier le lien'" @click="copyLink(selectedOffre)">
              <svg v-if="!copiedLink" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
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
  transition: left var(--transition), opacity var(--transition);
}
.watermark-img {
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0.12;
  transition: opacity var(--transition), filter var(--transition);
}
:global(.dark) .watermark-img {
  opacity: 0.14;
}

/*
 * MIRROR of index.vue login-mode watermark:
 *   .login-mode .watermark { left: 0; }        → slides LEFT
 *   .revealed   .watermark { left: 100%; }      → slides RIGHT
 */
.revealed .watermark {
  left: 100%;
}
.revealed .watermark-img {
  opacity: 0.6;
}
:global(.dark) .revealed .watermark-img {
  opacity: 0.6;
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
  opacity: 0.6;
  transition: opacity 0.4s ease, gap 0.3s;
  cursor: pointer;
}
.panel-back .back-arrow {
  transition: transform 0.3s ease;
}
.panel-back:hover { opacity: 1; }
.panel-back:hover .back-arrow { transform: translateX(3px); }

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

/* ============================
   FILTERS
   ============================ */
.panel-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.filter-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border: 1px solid var(--gold-faint);
  background: none;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.2s, border-color 0.2s, color 0.2s;
}
.filter-pill:hover { opacity: 0.8; }
.filter-pill.is-active {
  opacity: 1;
  background: rgba(175, 143, 60, 0.04);
}
.filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ============================
   OFFRE CARDS — colored left band
   ============================ */
.panel-offres {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offre-card {
  display: flex;
  border: 1px solid var(--gold-dim);
  cursor: pointer;
  opacity: 0;
  transform: translateY(8px);
  overflow: hidden;
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

.offre-band {
  width: 32px;
  flex-shrink: 0;
  background: var(--band-color);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.offre-band-text {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  white-space: nowrap;
  font-weight: 600;
}

.offre-body {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
}

.offre-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  transition: color 0.3s;
}
.offre-card:hover .offre-title { color: var(--gold); }

.offre-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.78rem;
  opacity: 0.4;
}

.offre-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}
.offre-cat {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border: 1px solid var(--gold-faint);
  color: var(--gold);
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
  overflow-y: auto;
  max-height: 100vh;
  max-height: 100dvh;
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
.slideover-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.slideover-contrat {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid var(--gold-faint);
  font-weight: 600;
}
.slideover-cat {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 10px;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border: 1px solid var(--gold-faint);
}
.slideover-cta strong {
  opacity: 1;
  color: var(--gold);
}
.slideover-share {
  display: flex;
  align-items: center;
  gap: 10px;
}
.slideover-share-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.35;
}
.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--gold-faint);
  background: none;
  color: var(--gold);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.2s, border-color 0.2s;
}
.share-btn:hover { opacity: 1; border-color: var(--gold-dim); }
.share-btn.is-copied { opacity: 1; color: #5a9a6a; border-color: #5a9a6a60; }

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
}

@media (max-width: 640px) {
  .watermark {
    width: clamp(280px, 80vmin, 400px);
    height: clamp(280px, 80vmin, 400px);
  }
  .revealed .watermark {
    left: 115%;
  }
  .frame { inset: 8px; }
  .corner { width: 18px; height: 18px; }

  .top-bar { top: 12px; left: 12px; }
  .top-back { font-size: 13px; gap: 8px; min-height: 44px; display: flex; align-items: center; }

  .offres-panel {
    padding: 16px;
    padding-top: 60px;
    justify-content: flex-start;
  }
  .panel-back {
    top: 12px;
    right: 12px;
    font-size: 13px;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
  }
  .panel-content {
    max-width: 100%;
  }
  .panel-title {
    font-size: 1.5rem;
    margin-top: 0;
  }
  .panel-ornament {
    margin-bottom: 16px;
  }

  /* Filters — large touch targets */
  .panel-filters {
    margin-bottom: 14px;
    gap: 8px;
  }
  .filter-row {
    gap: 6px;
  }
  .filter-pill {
    font-size: 11px;
    padding: 8px 14px;
    min-height: 38px;
  }

  /* Offre cards — comfortable tap */
  .offre-card {
    min-height: 64px;
  }
  .offre-body {
    padding: 14px 14px;
  }
  .offre-band {
    width: 28px;
  }
  .offre-band-text {
    font-size: 8px;
  }
  .offre-title {
    font-size: 1rem;
  }
  .offre-meta {
    font-size: 0.78rem;
    gap: 10px;
  }
  .offre-cats {
    gap: 5px;
    margin-top: 8px;
  }
  .offre-cat {
    font-size: 10px;
    padding: 4px 8px;
  }

  /* Slideover */
  .slideover-inner {
    padding: 16px;
    gap: 14px;
  }
  .slideover-title {
    font-size: 1.1rem;
  }
  .slideover-meta {
    font-size: 0.78rem;
    gap: 10px;
  }
  .slideover-heading {
    font-size: 0.9rem;
  }
  .slideover-prose {
    font-size: 0.82rem;
  }
}
</style>
