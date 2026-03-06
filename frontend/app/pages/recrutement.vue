<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

definePageMeta({ layout: 'public' })

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
  <div
    class="page-recrutement"
    :class="{ 'is-visible': visible, 'detail-mode': detailMode }"
  >
    <!-- Watermark (own copy for animation control) -->
    <div class="rec-watermark" aria-hidden="true">
      <img src="/logo.svg" alt="" class="rec-watermark-img" />
    </div>

    <!-- Main content — fades out in detail mode -->
    <div class="rec-main">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-ornament">
          <div class="hero-line" />
          <span class="hero-glyph">G</span>
          <div class="hero-line" />
        </div>
        <h1 class="hero-title">Recrutement</h1>
        <p class="hero-sub">
          Decouvrez les opportunites au sein du groupe Le Geai.
        </p>
      </section>

      <!-- Content -->
      <section class="section">
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
            :style="{ transitionDelay: detailMode ? '0ms' : `${400 + i * 120}ms` }"
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
      </section>

      <!-- Footer -->
      <footer class="page-footer">
        <div class="footer-ornament">
          <div class="footer-line" />
        </div>
        <p>&copy; {{ new Date().getFullYear() }} Groupe Le Geai</p>
      </footer>
    </div>

    <!-- Detail panel — slides in from LEFT (mirrored from login) -->
    <div class="detail-panel">
      <button class="detail-back" @click="closeDetail">
        <span class="detail-back-arrow">&rarr;</span>
        <span>Retour</span>
      </button>

      <div v-if="selectedOffre" class="detail-wrap">
        <div class="detail-header">
          <h2 class="detail-title">{{ selectedOffre.titre }}</h2>
          <span class="offre-badge">{{ selectedOffre.type_contrat }}</span>
        </div>

        <div class="detail-meta">
          <span v-if="selectedOffre.localisation">{{ selectedOffre.localisation }}</span>
          <span v-if="formatSalaire(selectedOffre)">{{ formatSalaire(selectedOffre) }}</span>
          <span v-if="selectedOffre.date_publication">{{ formatDate(selectedOffre.date_publication) }}</span>
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
.page-recrutement {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  --transition: 1.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Crimson Pro', Georgia, serif;
  position: relative;
  min-height: 100dvh;
}

/* ============================
   WATERMARK (mirrored — slides RIGHT)
   ============================ */
.rec-watermark {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 700px);
  height: clamp(400px, 60vw, 700px);
  pointer-events: none;
  z-index: 0;
  transition: left var(--transition), width var(--transition), height var(--transition);
}
.rec-watermark-img {
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity var(--transition), filter var(--transition);
}

/* Detail mode — watermark slides RIGHT, full color */
.detail-mode .rec-watermark {
  left: 100%;
  width: clamp(600px, 100vh, 1100px);
  height: clamp(600px, 100vh, 1100px);
}
.detail-mode .rec-watermark-img {
  opacity: 1;
  filter: none;
}
:global(.dark) .detail-mode .rec-watermark-img {
  opacity: 1;
  filter: none;
}

/* ============================
   MAIN CONTENT — fades out
   ============================ */
.rec-main {
  position: relative;
  z-index: 2;
  transition: opacity 1s ease, transform 1s ease;
}
.detail-mode .rec-main {
  opacity: 0;
  transform: translateY(-30px);
  pointer-events: none;
}

/* Hero */
.hero {
  padding: clamp(60px, 12vh, 140px) clamp(24px, 5vw, 48px) clamp(40px, 6vh, 80px);
  text-align: center;
}

.hero-ornament {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-bottom: 24px;
  opacity: 0;
  transition: opacity 0.8s ease 0.3s;
}
.is-visible .hero-ornament { opacity: 0.5; }

.hero-line {
  width: clamp(32px, 8vw, 64px); height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.hero-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  color: var(--gold);
  line-height: 1;
}

.hero-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2.4rem, 6vw, 4rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 1s ease 0.1s, transform 1s ease 0.1s;
}
.is-visible .hero-title {
  opacity: 1;
  transform: translateY(0);
}

.hero-sub {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  line-height: 1.7;
  opacity: 0;
  max-width: 480px;
  margin: 16px auto 0;
  transition: opacity 0.8s ease 0.5s;
}
.is-visible .hero-sub { opacity: 0.5; }

/* Section */
.section {
  padding: 0 clamp(24px, 5vw, 48px) clamp(48px, 8vh, 80px);
  max-width: 800px;
  margin: 0 auto;
}

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
  text-align: center;
  padding: 60px 0;
  opacity: 0;
  transition: opacity 0.7s ease 0.3s;
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

/* Offres */
.offres-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.offre-card {
  padding: 28px 24px;
  border: 1px solid var(--gold-faint);
  cursor: pointer;
  position: relative;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.4s;
}
.is-visible .offre-card {
  opacity: 1;
  transform: translateY(0);
}

/* Corner accents */
.offre-card::before,
.offre-card::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.3s;
  opacity: 0;
}
.offre-card::before {
  top: -1px; left: -1px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.offre-card::after {
  bottom: -1px; right: -1px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
.offre-card:hover::before,
.offre-card:hover::after {
  width: 22px; height: 22px;
  opacity: 0.5;
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
   DETAIL PANEL (slides from LEFT — mirrored login)
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
.detail-back-arrow {
  font-size: 16px;
  transition: transform 0.3s;
}
.detail-back:hover .detail-back-arrow { transform: translateX(2px); }

.detail-wrap {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: 0.08em;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
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
}
.detail-cta strong {
  opacity: 1;
  color: var(--gold);
}

/* Footer */
.page-footer {
  text-align: center;
  padding: clamp(32px, 6vh, 56px) 24px 24px;
}
.detail-mode .page-footer { opacity: 0; }

.footer-ornament {
  display: flex; justify-content: center;
  margin-bottom: 16px;
}
.footer-line {
  width: 40px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}

.page-footer p {
  font-size: 11px;
  opacity: 0.2;
  letter-spacing: 0.08em;
}

/* Mobile */
@media (max-width: 768px) {
  .detail-panel {
    width: 100%;
    padding: clamp(16px, 3vw, 32px);
  }
  .detail-mode .rec-watermark {
    display: none;
  }
}
</style>
