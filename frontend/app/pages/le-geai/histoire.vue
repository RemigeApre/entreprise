<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Notre histoire — Le Geai',
  description: 'L\'histoire du groupe Le Geai et de son fondateur.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })
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

      <!-- Fondateur -->
      <section class="section">
        <h2 class="section-heading">Le fondateur</h2>
        <div class="section-body">
          <p>Le Geai est ne de la conviction d'un seul homme : que l'on peut creer une entreprise exigeante sans sacrifier l'humain. Pas d'heritage familial, pas de reseau d'influence — juste une idee, du travail, et une obstination tranquille.</p>
          <p>Avant de fonder le groupe, son createur a ete etudiant, stagiaire, independant. Il a connu les portes fermees, les stages introuvables, les debuts ou tout repose sur soi. Cette experience a forge une certitude : quand on batit quelque chose, on le batit pour que d'autres puissent y entrer.</p>
        </div>
      </section>

      <!-- Origines -->
      <section class="section">
        <h2 class="section-heading">Les origines</h2>
        <div class="section-body">
          <p>Le Geai n'est pas ne dans un bureau. Il est ne d'une frustration : celle de voir des entreprises produire du mediocre en pretendant a l'excellence, et traiter les gens comme des ressources plutot que comme des individus.</p>
          <p>Le nom lui-meme porte un sens. Le geai est un oiseau discret mais remarquable — vif, adaptable, capable d'imiter mais surtout de creer. Il ne cherche pas a paraitre. Il agit.</p>
          <p>Le groupe s'est construit autour de trois piliers : l'edition, la technologie et les medias. Trois disciplines qui, prises separement, sont deja exigeantes. Reunies sous un meme toit, elles se nourrissent mutuellement et permettent de creer des choses qu'aucune d'elles ne pourrait produire seule.</p>
        </div>
      </section>

      <!-- Vision -->
      <section class="section">
        <h2 class="section-heading">La vision</h2>
        <div class="section-body">
          <p>Nous ne cherchons pas la croissance pour la croissance. Nous cherchons a faire les choses correctement, durablement, et avec un soin qui se ressent dans chaque detail — du premier pixel a la derniere ligne de code.</p>
          <p>Le Geai est une entreprise jeune. Elle n'a pas la pretention d'avoir tout compris. Mais elle a la volonte de ne jamais transiger sur ce qui compte : la qualite du travail, le respect des personnes, et la sincerite des engagements.</p>
        </div>
      </section>

      <!-- Ornament de fin -->
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
  --ink: #2c2419;
  --cream: #F7F0DE;
  padding: clamp(20px, 4vw, 60px) clamp(24px, 5vw, 64px);
}

.histoire-container {
  max-width: 680px;
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
  margin-bottom: clamp(40px, 6vh, 60px);
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

.section-body p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  line-height: 2;
  opacity: 0.7;
  margin-bottom: 16px;
}
.section-body p:last-child { margin-bottom: 0; }

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
