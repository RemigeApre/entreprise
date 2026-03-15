<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Nos engagements — Le Geai',
  description: 'Les engagements concrets du groupe Le Geai : recrutement, stages, tarifs solidaires.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

const engagements = [
  {
    numeral: 'I',
    title: 'Recruter sur la competence',
    text: 'Nous embauchons sur ce que les gens savent faire, pas sur ce qu\'ils sont. Ni le nom, ni l\'adresse, ni le parcours scolaire ne definissent la valeur d\'un individu. Seules comptent la competence, la rigueur et la volonte de bien faire.',
    color: '#AF8F3C'
  },
  {
    numeral: 'II',
    title: 'Accueillir les stagiaires',
    text: 'Le fondateur a ete etudiant. Il sait ce que c\'est que de chercher un stage pour valider son annee et de ne pas en trouver. Le Geai s\'engage a prendre des stagiaires dans les limites legales — pas par charite, mais parce que c\'est normal. Un etudiant qui a besoin d\'apprendre merite une porte ouverte.',
    color: '#6B8F71'
  },
  {
    numeral: 'III',
    title: 'Tarifs solidaires',
    text: 'Nous appliquons des reductions pour les structures associatives, les acteurs de la sante et ceux qui travaillent au plus pres de la terre — paysans, cooperatives agricoles, associations environnementales. Ce ne sont pas des clients comme les autres : ce sont des gens qui font tourner le monde, souvent sans les moyens qu\'ils meritent.',
    color: '#8B6F4E'
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

      <!-- Closing -->
      <div class="eng-closing">
        <p>Ces engagements ne sont pas negociables. Ils sont le socle sur lequel repose tout ce que nous construisons. Si un jour nous ne les tenons plus, c'est que nous aurons echoue.</p>
      </div>

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
  transition: border-color 0.5s ease;
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

/* Closing */
.eng-closing {
  margin-top: clamp(40px, 6vh, 56px);
  padding: 24px 0;
  border-top: 1px solid var(--gold-faint);
  text-align: center;
}
.eng-closing p {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1rem;
  line-height: 1.8;
  opacity: 0.55;
  max-width: 540px;
  margin: 0 auto;
}

/* End ornament */
.end-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: clamp(20px, 4vh, 40px);
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
</style>
