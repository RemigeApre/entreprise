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
const isSlideoverOpen = ref(false)

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

function openDetail(offre: OffreEmploi) {
  selectedOffre.value = offre
  isSlideoverOpen.value = true
}

function formatSalaire(offre: OffreEmploi) {
  if (!offre.salaire_min && !offre.salaire_max) return null
  const periodeLabel = offre.salaire_periode === 'mois' ? '/mois' : offre.salaire_periode === 'annee' ? '/an' : '/h'
  if (offre.salaire_min && offre.salaire_max) {
    return `${offre.salaire_min.toLocaleString('fr-FR')} - ${offre.salaire_max.toLocaleString('fr-FR')} EUR${periodeLabel}`
  }
  return `${(offre.salaire_min || offre.salaire_max)!.toLocaleString('fr-FR')} EUR${periodeLabel}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="page-recrutement" :class="{ 'is-visible': visible }">
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
          :style="{ transitionDelay: `${400 + i * 120}ms` }"
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

    <!-- Detail slideover -->
    <USlideover v-model:open="isSlideoverOpen">
      <template #content>
        <div v-if="selectedOffre" class="slideover-content">
          <div class="slideover-header">
            <h2 class="slideover-title">{{ selectedOffre.titre }}</h2>
            <span class="offre-badge">{{ selectedOffre.type_contrat }}</span>
          </div>
          <div class="slideover-meta">
            <span v-if="selectedOffre.localisation">{{ selectedOffre.localisation }}</span>
            <span v-if="formatSalaire(selectedOffre)">{{ formatSalaire(selectedOffre) }}</span>
          </div>

          <div class="slideover-divider" />

          <div>
            <h3 class="slideover-section-title">Description</h3>
            <div class="slideover-prose" v-html="selectedOffre.description" />
          </div>

          <div v-if="selectedOffre.competences_requises">
            <h3 class="slideover-section-title">Competences requises</h3>
            <div class="slideover-prose" v-html="selectedOffre.competences_requises" />
          </div>

          <div v-if="selectedOffre.avantages">
            <h3 class="slideover-section-title">Avantages</h3>
            <div class="slideover-prose" v-html="selectedOffre.avantages" />
          </div>

          <div class="slideover-divider" />

          <p class="slideover-cta">
            Pour postuler, envoyez votre CV a
            <strong>recrutement@legeai-editions.com</strong>
          </p>
        </div>
      </template>
    </USlideover>

    <!-- Footer -->
    <footer class="page-footer">
      <div class="footer-ornament">
        <div class="footer-line" />
      </div>
      <p>&copy; {{ new Date().getFullYear() }} Groupe Le Geai</p>
    </footer>
  </div>
</template>

<style scoped>
.page-recrutement {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  font-family: 'Crimson Pro', Georgia, serif;
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

/* Slideover */
.slideover-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Crimson Pro', Georgia, serif;
}

.slideover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
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

.slideover-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-faint), transparent);
}

.slideover-section-title {
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

/* Footer */
.page-footer {
  text-align: center;
  padding: clamp(32px, 6vh, 56px) 24px 24px;
}

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
</style>
