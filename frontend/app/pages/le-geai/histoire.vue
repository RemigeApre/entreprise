<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Notre histoire — Le Geai',
  description: 'L\'histoire du groupe Le Geai, de ses origines a ses trois branches.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

const branches = [
  {
    title: 'Le Geai Editions',
    text: 'Maison d\'edition specialisee en dark fantasy et romantisme. Nous publions des oeuvres exigeantes, imprimees dignement, accessibles a tous ceux qui veulent lire. Le livre n\'est pas un objet de consommation. C\'est une porte vers les profondeurs de l\'ame de l\'auteur. Quand vous lisez, l\'auteur est a vos cotes. Il vient vous reciter ses histoires, vous chuchoter les secrets, vous frapper des hontes.',
    color: '#AF8F3C'
  },
  {
    title: 'Le Geai Informatique',
    text: 'Developpement web, data engineering, support informatique. Nous construisons des outils numeriques avec la meme exigence que nous mettons dans nos livres. Notre metier n\'est pas de faire des sites : c\'est de tracer des sentiers. Simplifier, alleger, rendre chaque utilisation agreable. Le meilleur site est celui ou l\'on ne remarque jamais qu\'il a ete concu.',
    color: '#6B8F71'
  },
  {
    title: 'Bergfrid',
    text: 'Media geopolitique independant. Des faits, du contexte, des sources contradictoires. Nous ne commentons pas l\'actualite : nous donnons les elements pour que nos lecteurs pensent par eux-memes. La verite, pas le commentaire.',
    color: '#8B6F4E'
  }
]
</script>

<template>
  <div class="histoire" :class="{ 'is-visible': visible }">
    <div class="histoire-container">

      <!-- Header -->
      <header class="histoire-header">
        <span class="histoire-numeral">I</span>
        <h1 class="histoire-title">Notre histoire</h1>
        <div class="histoire-rule" />
      </header>

      <!-- Origines -->
      <section class="section">
        <div class="section-body">
          <p>En 2024, un editeur a qualifie nos textes de &laquo;&nbsp;remarquables&nbsp;&raquo;. Puis il a refuse de les publier. Le format ne se vendait pas. Les lecteurs lents ne l'interessaient pas. Notre nom de plume l'agacait. Nos histoires n'etaient, selon lui, que des &laquo;&nbsp;etats d'ame&nbsp;&raquo; sans valeur marchande.</p>
          <p>Ce jour-la, une chose est devenue claire : nous ne voulions pas etre publies par des gens qui meprisent leurs lecteurs. Nous ne voulions pas financer des structures qui impriment en Asie sans respect pour l'humain ni la nature. Nous ne voulions pas mettre un centime dans un systeme ou l'argent a remplace l'art.</p>
          <p>Alors Le Geai est ne. Legalement en 2021, concretement en 2024 avec la publication du premier livre, et officiellement en 2025 comme maison d'edition. Trois dates qui ne sont que des etapes. La vraie naissance est anterieure : celle d'un enfant qui ecrivait parce que c'etait vital, pas parce que c'etait un metier.</p>
        </div>
      </section>

      <!-- Trois branches -->
      <section class="section">
        <h2 class="section-heading">Trois branches, une seule maison</h2>
        <p class="section-intro">Le Geai est une entreprise lyonnaise a trois branches. Chacune nourrit les autres. Chaque site web livre finance un livre. Chaque livre publie porte la rigueur de l'ingenieur. Chaque article du media porte l'exigence de l'editeur.</p>

        <div class="branches">
          <article
            v-for="b in branches"
            :key="b.title"
            class="branch-card"
            :style="{ '--card-color': b.color }"
          >
            <h3 class="branch-title">{{ b.title }}</h3>
            <p class="branch-text">{{ b.text }}</p>
          </article>
        </div>
      </section>

      <!-- References -->
      <section class="section">
        <h2 class="section-heading">Nos references</h2>
        <div class="section-body">
          <p>Nous puisons dans une tradition litteraire et artistique exigeante. Edgar Allan Poe, Oscar Wilde, H.P. Lovecraft. The Witcher, Game of Thrones, The Secret History, Le Cercle des poetes disparus. Berserk, Chainsaw Man, Monster. Alice au pays des merveilles, Dracula, Frankenstein.</p>
          <p>En art et en architecture : le neo-gothique anglais, le gothique, le victorien, l'art grec et romain.</p>
          <p>Notre ambiance est celle d'une Dark Academia realiste. Des bibliotheques poussiereuses, des cuisines foisonnantes, des chambres d'artistes. Des jardins de fleurs, des potagers, des forets, des chemins de randonnee dans les montagnes. L'odeur de pluie, les buches qui craquent, la douceur des plaids apres une journee de labeur.</p>
        </div>
      </section>

      <!-- Citation de fin -->
      <div class="closing-quote">
        <p>Nous etions chenilles, nous sommes en chrysalide. Bientot, nous serons ces papillons de nuit, attires par la bougie.</p>
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
.histoire {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  padding: clamp(20px, 4vw, 60px) clamp(24px, 5vw, 64px);
}

.histoire-container {
  max-width: 700px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s;
}
.is-visible .histoire-container {
  opacity: 1;
  transform: translateY(0);
}

/* Header */
.histoire-header {
  text-align: center;
  margin-bottom: clamp(48px, 8vh, 72px);
}

.histoire-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
}

.histoire-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.histoire-rule {
  width: 50px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* Sections */
.section {
  margin-bottom: clamp(44px, 7vh, 64px);
}

.section-heading {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.8;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--gold-faint);
}

.section-intro {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.8;
  opacity: 0.6;
  margin-bottom: 28px;
}

.section-body p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  line-height: 2;
  opacity: 0.7;
  margin-bottom: 16px;
}
.section-body p:last-child { margin-bottom: 0; }

/* Branches */
.branches {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.branch-card {
  position: relative;
  padding: 28px 28px 24px;
}
.branch-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--card-color) 18%, transparent);
  pointer-events: none;
}
.branch-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--card-color), transparent);
  opacity: 0.5;
}

.branch-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  color: var(--card-color);
}

.branch-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.9;
  opacity: 0.65;
}

/* Closing quote */
.closing-quote {
  text-align: center;
  padding: 28px 0;
  border-top: 1px solid var(--gold-faint);
  border-bottom: 1px solid var(--gold-faint);
  margin-bottom: clamp(28px, 4vh, 44px);
}
.closing-quote p {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--gold);
  opacity: 0.7;
  max-width: 520px;
  margin: 0 auto;
}

/* End ornament */
.end-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-top: clamp(12px, 2vh, 24px);
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
