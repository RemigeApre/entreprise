<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Nos engagements — Le Geai',
  description: 'Les engagements concrets du groupe Le Geai : recrutement, stages, tarifs solidaires, art.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

const engagements = [
  {
    numeral: 'I',
    title: 'Envers nos stagiaires',
    text: 'Nous prenons des stagiaires. Le maximum legal, toute l\'annee. Pas par calcul, par necessite et par conviction. Etudiants en formation, mais aussi personnes en reinsertion professionnelle. Un vrai travail, un vrai portfolio, une vraie lettre de recommandation pour ceux qui le meritent. Pas un stage cafe-photocopieuse. Donner sa chance a quelqu\'un qui debute ou qui recommence, c\'est un devoir, pas une variable d\'ajustement.',
    color: '#7A6A8A'
  },
  {
    numeral: 'II',
    title: 'Envers nos futurs employes',
    text: 'La competence est le seul critere, rien d\'autre. Ni le nom, ni l\'adresse, ni le parcours scolaire ne definissent la valeur d\'un individu. Le jour ou l\'argent rentre : des alternants, des CDI, des stagiaires payes. Ceux qui sont bons passent en alternance, puis en poste fixe. On valorise et on garde ceux qui font du bon travail. C\'est la promesse.',
    color: '#AF8F3C'
  },
  {
    numeral: 'III',
    title: 'Envers l\'art',
    text: 'Chaque euro gagne par Le Geai Informatique finance Le Geai Editions. Nos livres sont vendus a prix reduit aux entreprises et aux CSE. L\'art dans un bureau n\'est pas un luxe, c\'est un acte.',
    color: '#8B6F4E'
  },
  {
    numeral: 'IV',
    title: 'Envers nos clients',
    text: 'Nos sites web sont concus avec empathie. Se mettre a la place de chaque visiteur, faire preuve d\'une empathie reelle et pratique : ca ne se genere pas, ca se travaille. Nos sites web commencent a 800 euros. Le meilleur site est celui ou l\'on ne remarque jamais qu\'il a ete concu.',
    color: '#6B8F71'
  }
]
</script>

<template>
  <div class="engagements" :class="{ 'is-visible': visible }">
    <div class="engagements-container">

      <!-- Header -->
      <header class="eng-header">
        <span class="eng-numeral">II</span>
        <h1 class="eng-title">Nos engagements</h1>
        <div class="eng-rule" />
        <p class="eng-intro">Ce ne sont pas des promesses marketing. Ce sont des regles que nous nous imposons, sans exception.</p>
      </header>

      <!-- Engagements -->
      <div class="eng-list">
        <article
          v-for="(e, i) in engagements"
          :key="e.title"
          class="eng-card"
          :style="{
            '--card-color': e.color,
            transitionDelay: `${400 + i * 150}ms`
          }"
        >
          <div class="eng-card-head">
            <span class="eng-card-numeral">{{ e.numeral }}</span>
            <div class="eng-card-rule" />
          </div>
          <h2 class="eng-card-title">{{ e.title }}</h2>
          <p class="eng-card-text">{{ e.text }}</p>
        </article>
      </div>

      <!-- Tarifs solidaires -->
      <section class="tarifs-section">
        <h2 class="tarifs-heading">Tarifs solidaires</h2>
        <p class="tarifs-intro">L'art n'appartient pas aux prix absurdes. Nos reductions existent pour ceux qui en ont besoin :</p>
        <div class="tarifs-grid">
          <div class="tarif-card">
            <span class="tarif-pct">20 %</span>
            <span class="tarif-label">Acteurs de la sante et de l'environnement</span>
          </div>
          <div class="tarif-card">
            <span class="tarif-pct">30 %</span>
            <span class="tarif-label">Associations et ONG</span>
          </div>
        </div>
      </section>

      <!-- Ornament -->
      <div class="end-ornament">
        <div class="end-line" />
        <span class="end-glyph">G</span>
        <div class="end-line" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.engagements {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  padding: clamp(20px, 4vw, 60px) clamp(24px, 5vw, 64px);
}

.engagements-container {
  max-width: 720px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s;
}
.is-visible .engagements-container {
  opacity: 1;
  transform: translateY(0);
}

/* Header */
.eng-header {
  text-align: center;
  margin-bottom: clamp(48px, 8vh, 72px);
}

.eng-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
}

.eng-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.eng-rule {
  width: 50px;
  height: 1px;
  margin: 0 auto 24px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.eng-intro {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--gold);
  opacity: 0.7;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.7;
}

/* Cards */
.eng-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.eng-card {
  position: relative;
  padding: 36px 32px 32px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.is-visible .eng-card {
  opacity: 1;
  transform: translateY(0);
}
.eng-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--card-color) 18%, transparent);
  pointer-events: none;
}
.eng-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--card-color), transparent);
  opacity: 0.5;
}

.eng-card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.eng-card-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.5rem;
  font-style: italic;
  color: var(--card-color);
  opacity: 0.6;
  line-height: 1;
  flex-shrink: 0;
}

.eng-card-rule {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--card-color) 30%, transparent), transparent);
}

.eng-card-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.eng-card-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1rem;
  line-height: 1.95;
  opacity: 0.65;
}

/* Tarifs solidaires */
.tarifs-section {
  margin-top: clamp(48px, 8vh, 68px);
  text-align: center;
}

.tarifs-heading {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.8;
  margin-bottom: 16px;
}

.tarifs-intro {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  opacity: 0.6;
  line-height: 1.7;
  margin-bottom: 24px;
}

.tarifs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: 440px;
  margin: 0 auto;
}

.tarif-card {
  padding: 24px 16px;
  border: 1px solid var(--gold-faint);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tarif-pct {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 2rem;
  color: var(--gold);
  line-height: 1;
}

.tarif-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  opacity: 0.55;
  line-height: 1.5;
}

/* End ornament */
.end-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: clamp(40px, 6vh, 60px);
  opacity: 0.3;
}
.end-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.end-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.2rem;
  color: var(--gold);
  line-height: 1;
}

@media (max-width: 480px) {
  .tarifs-grid { grid-template-columns: 1fr; }
}
</style>
