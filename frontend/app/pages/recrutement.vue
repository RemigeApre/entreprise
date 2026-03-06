<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

definePageMeta({ layout: 'landing' })

useHead({
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
const detailMode = ref(false)

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

function openDetail(offre: OffreEmploi) {
  selectedOffre.value = offre
  detailMode.value = true
}

function closeDetail() {
  detailMode.value = false
  setTimeout(() => { selectedOffre.value = null }, 1400)
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
  <div class="landing" :class="{ 'is-visible': visible, 'detail-mode': detailMode }">

    <!-- Noise filter -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="noise-layer" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#noise)" /></svg>
    </div>

    <!-- Vignette -->
    <div class="vignette" aria-hidden="true" />

    <!-- Watermark — slides RIGHT on detail -->
    <div class="watermark" aria-hidden="true">
      <img src="/logo.svg" alt="" class="watermark-img" />
    </div>

    <!-- Gold frame -->
    <div class="frame" aria-hidden="true">
      <div class="corner corner--tl" />
      <div class="corner corner--tr" />
      <div class="corner corner--bl" />
      <div class="corner corner--br" />
      <div class="frame-mark frame-mark--top" />
      <div class="frame-mark frame-mark--bottom" />
    </div>

    <!-- ===== TOP BAR ===== -->
    <header class="top-bar">
      <NuxtLink to="/" class="top-back" aria-label="Retour">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Retour</span>
      </NuxtLink>
    </header>

    <!-- ===== CENTER ===== -->
    <div class="center">
      <div class="center-inner">
        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>

        <h1 class="title">Recrutement</h1>
        <p class="subtitle">Decouvrez les opportunites au sein du groupe Le Geai.</p>

        <!-- Loading -->
        <div v-if="status === 'pending'" class="loading">
          <div class="spinner" />
        </div>

        <!-- Empty -->
        <div v-else-if="!offres?.length" class="empty">
          <p class="empty-title">Aucune offre pour le moment</p>
          <p class="empty-text">Revenez bientot, de nouvelles opportunites sont en preparation.</p>
        </div>

        <!-- Job listings -->
        <div v-else class="offres-list">
          <article
            v-for="(offre, i) in offres"
            :key="offre.id"
            class="offre-card"
            :style="{ transitionDelay: detailMode ? '0ms' : `${600 + i * 120}ms` }"
            @click="openDetail(offre)"
          >
            <div class="offre-header">
              <div>
                <h2 class="offre-title">{{ offre.titre }}</h2>
                <div class="offre-meta">
                  <span v-if="offre.localisation">{{ offre.localisation }}</span>
                  <span v-if="formatSalaire(offre)">{{ formatSalaire(offre) }}</span>
                  <span v-if="offre.date_publication">{{ formatDate(offre.date_publication) }}</span>
                </div>
              </div>
              <span class="offre-badge">{{ offre.type_contrat }}</span>
            </div>
            <p class="offre-desc" v-html="offre.description" />
          </article>
        </div>
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div class="footer-bar">
      <span class="footer-text">&copy; {{ new Date().getFullYear() }} Groupe Le Geai</span>
    </div>

    <!-- ===== DETAIL PANEL (slides from LEFT — mirror of login) ===== -->
    <div class="detail-panel">
      <button class="detail-back" @click="closeDetail">
        <UIcon name="i-lucide-arrow-right" class="size-4" />
        <span>Retour</span>
      </button>

      <div v-if="selectedOffre" class="detail-wrap">
        <h2 class="detail-title">{{ selectedOffre.titre }}</h2>
        <div class="detail-ornament">
          <div class="detail-ornament-line" />
        </div>

        <div class="detail-info">
          <span class="offre-badge">{{ selectedOffre.type_contrat }}</span>
          <span v-if="selectedOffre.localisation" class="detail-meta-item">{{ selectedOffre.localisation }}</span>
          <span v-if="formatSalaire(selectedOffre)" class="detail-meta-item">{{ formatSalaire(selectedOffre) }}</span>
          <span v-if="selectedOffre.date_publication" class="detail-meta-item">{{ formatDate(selectedOffre.date_publication) }}</span>
        </div>

        <div class="detail-divider" />

        <div>
          <h3 class="detail-section-title">Description</h3>
          <div class="detail-prose" v-html="selectedOffre.description" />
        </div>

        <div v-if="selectedOffre.competences_requises">
          <h3 class="detail-section-title">Competences requises</h3>
          <div class="detail-prose" v-html="selectedOffre.competences_requises" />
        </div>

        <div v-if="selectedOffre.avantages">
          <h3 class="detail-section-title">Avantages</h3>
          <div class="detail-prose" v-html="selectedOffre.avantages" />
        </div>

        <div class="detail-divider" />

        <p class="detail-cta">
          Pour postuler, envoyez votre CV a
          <strong>recrutement@legeai-editions.com</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================
   BASE — same as index.vue
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
  overflow-y: auto;
  overflow-x: hidden;
}
:global(.dark) .landing { color: var(--cream); }

/* ============================
   LAYERS — same as index.vue
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
   WATERMARK — slides RIGHT (mirror of login left)
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

/* Detail mode — logo slides RIGHT, half visible, full color */
.detail-mode .watermark {
  left: 100%;
  width: clamp(600px, 100vh, 1100px);
  height: clamp(600px, 100vh, 1100px);
}
.detail-mode .watermark-img {
  opacity: 1;
  filter: none;
}
:global(.dark) .detail-mode .watermark-img {
  opacity: 1;
  filter: none;
}

/* ============================
   FRAME — same as index.vue
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
  transition: opacity var(--transition);
}
.detail-mode .frame { opacity: 0.3; }

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
   TOP BAR
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
.detail-mode .top-bar { opacity: 0; pointer-events: none; }

.top-back {
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
.top-back:hover { opacity: 1; gap: 12px; }

/* ============================
   CENTER
   ============================ */
.center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  width: 100%;
  padding: clamp(80px, 12vh, 120px) 24px 0;
  transition: opacity 1s ease, transform 1s ease;
}
.detail-mode .center {
  opacity: 0;
  transform: translateY(-30px);
  pointer-events: none;
}

.center-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 700px;
}

/* Ornament */
.ornament {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: clamp(12px, 2vh, 20px);
  opacity: 0;
  transition: opacity 0.8s ease 0.3s;
}
.is-visible .ornament { opacity: 0.5; }

.ornament-line {
  width: clamp(32px, 8vw, 64px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.ornament-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  color: var(--gold);
  line-height: 1;
}

/* Title */
.title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 1s ease 0.15s, transform 1s ease 0.15s;
}
.is-visible .title {
  opacity: 1;
  transform: translateY(0);
}

.subtitle {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  line-height: 1.7;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.8s ease 0.5s;
}
.is-visible .subtitle { opacity: 0.5; }

/* Loading */
.loading {
  display: flex; justify-content: center; padding: 60px 0;
}
.spinner {
  width: 24px; height: 24px;
  border: 1.5px solid var(--gold-dim);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty {
  padding: 48px 0;
  opacity: 0;
  transition: opacity 0.7s ease 0.5s;
}
.is-visible .empty { opacity: 1; }
.empty-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.empty-text {
  font-size: 0.88rem;
  opacity: 0.4;
}

/* ============================
   OFFRES LIST
   ============================ */
.offres-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  margin-top: clamp(28px, 5vh, 48px);
  text-align: left;
}

.offre-card {
  padding: 24px;
  border: 1px solid var(--gold-faint);
  cursor: pointer;
  position: relative;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.3s;
}
.is-visible .offre-card {
  opacity: 1;
  transform: translateY(0);
}

.offre-card::before,
.offre-card::after {
  content: '';
  position: absolute;
  width: 0; height: 0;
  opacity: 0;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.4s ease;
}
.offre-card::before {
  top: 0; left: 0;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.offre-card::after {
  bottom: 0; right: 0;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
.offre-card:hover::before,
.offre-card:hover::after {
  width: 20px; height: 16px;
  opacity: 0.6;
}
.offre-card:hover { border-color: var(--gold-dim); }

.offre-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.offre-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  transition: color 0.3s;
}
.offre-card:hover .offre-title { color: var(--gold); }

.offre-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 6px;
  font-size: 0.8rem;
  opacity: 0.4;
}

.offre-badge {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 10px;
  border: 1px solid var(--gold-faint);
  color: var(--gold);
  white-space: nowrap;
  flex-shrink: 0;
}

.offre-desc {
  font-size: 0.88rem;
  line-height: 1.6;
  opacity: 0.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============================
   FOOTER — same as index.vue
   ============================ */
.footer-bar {
  position: relative;
  z-index: 2;
  display: flex; align-items: center; gap: 8px;
  padding: clamp(12px, 2vh, 24px) 0;
  opacity: 0;
  transition: opacity 0.8s ease 1.2s;
}
.is-visible .footer-bar { opacity: 0.35; }
.detail-mode .footer-bar { opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }

.footer-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.2vw, 10px);
}

/* ============================
   DETAIL PANEL — slides from LEFT (mirror of login-panel)
   ============================ */
.detail-panel {
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
.detail-mode .detail-panel {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.detail-back {
  position: absolute;
  top: clamp(20px, 3.5vw, 36px);
  right: clamp(20px, 3vw, 40px);
  display: flex; align-items: center; gap: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.7;
  background: none; border: none;
  cursor: pointer;
  transition: opacity 0.3s, gap 0.3s;
}
.detail-back:hover { opacity: 1; gap: 12px; }

.detail-wrap {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-align: center;
}

.detail-ornament {
  display: flex; justify-content: center;
}
.detail-ornament-line {
  width: 50px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.detail-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.detail-meta-item {
  font-size: 0.85rem;
  opacity: 0.45;
}

.detail-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-faint), transparent);
}

.detail-section-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
  color: var(--gold);
}

.detail-prose {
  font-size: 0.9rem;
  line-height: 1.75;
  opacity: 0.6;
}

.detail-cta {
  font-size: 0.9rem;
  opacity: 0.5;
  text-align: center;
}
.detail-cta strong {
  opacity: 1;
  color: var(--gold);
}

/* Mobile */
@media (max-width: 768px) {
  .detail-panel {
    width: 100%;
    padding: clamp(16px, 3vw, 32px);
  }
  .detail-mode .watermark {
    display: none;
  }
}
</style>
