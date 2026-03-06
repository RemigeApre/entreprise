<script setup lang="ts">
definePageMeta({ layout: 'public' })

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
  title: 'L\u2019entreprise - Le Geai',
  description: 'Decouvrez les valeurs, la vision et les poles du groupe Le Geai.',
  ogTitle: 'Le Geai - L\u2019entreprise',
  ogDescription: 'Un groupe fonde sur l\u2019exigence, la creativite et l\u2019accessibilite.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

const values = [
  { numeral: 'I', title: 'Exigence', text: 'Chaque detail compte. Nous ne livrons que ce dont nous sommes fiers, du premier pixel a la derniere ligne de code.' },
  { numeral: 'II', title: 'Accessibilite', text: 'Si un utilisateur ne s\u2019y retrouve pas, c\u2019est nous qui avons echoue. La simplicite est notre complexite.' },
  { numeral: 'III', title: 'Creativite', text: 'L\u2019innovation nait au croisement des disciplines. Edition, technologie et medias se nourrissent mutuellement.' },
  { numeral: 'IV', title: 'Integrite', text: 'Des engagements tenus, une transparence totale. La confiance se construit sur la constance.' }
]

const branches = [
  { title: 'Edition', desc: 'Maison d\u2019edition dediee aux ouvrages qui marquent.', status: 'En refonte' },
  { title: 'Informatique', desc: 'Sites web, applications et solutions numeriques sur mesure.', href: 'https://legeai-informatique.fr' },
  { title: 'Medias', desc: 'Production de contenus et journalisme independant.', href: 'https://bergfrid.com' }
]
</script>

<template>
  <div class="page-entreprise">
    <!-- Hero -->
    <section class="hero">
      <div
        class="hero-inner"
        :class="visible ? 'is-visible' : ''"
      >
        <div class="hero-ornament">
          <div class="hero-line" />
          <span class="hero-glyph">G</span>
          <div class="hero-line" />
        </div>
        <h1 class="hero-title">L'entreprise</h1>
        <p class="hero-sub">
          Le Geai reunit des savoir-faire complementaires autour d'une conviction commune&nbsp;:
          creer avec exigence, partager avec sincerite.
        </p>
      </div>
    </section>

    <!-- Values -->
    <section class="section">
      <h2 class="section-label" :class="visible ? 'is-visible' : ''">Nos valeurs</h2>
      <div class="values-grid">
        <div
          v-for="(val, i) in values"
          :key="val.title"
          class="value-card"
          :class="visible ? 'is-visible' : ''"
          :style="{ transitionDelay: `${300 + i * 150}ms` }"
        >
          <span class="value-numeral">{{ val.numeral }}</span>
          <h3 class="value-title">{{ val.title }}</h3>
          <p class="value-text">{{ val.text }}</p>
        </div>
      </div>
    </section>

    <!-- Branches -->
    <section class="section">
      <h2 class="section-label" :class="visible ? 'is-visible' : ''">Nos poles</h2>
      <div class="branches-grid">
        <div
          v-for="(branch, i) in branches"
          :key="branch.title"
          class="branch-card"
          :class="visible ? 'is-visible' : ''"
          :style="{ transitionDelay: `${500 + i * 150}ms` }"
        >
          <h3 class="branch-title">{{ branch.title }}</h3>
          <p class="branch-desc">{{ branch.desc }}</p>
          <a
            v-if="branch.href"
            :href="branch.href"
            target="_blank"
            rel="noopener noreferrer"
            class="branch-link"
          >
            Visiter&thinsp;&#x2197;
          </a>
          <span v-else-if="branch.status" class="branch-status">{{ branch.status }}</span>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="page-footer">
      <p>&copy; {{ new Date().getFullYear() }} Groupe Le Geai</p>
    </footer>
  </div>
</template>

<style scoped>
.page-entreprise {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  font-family: 'Crimson Pro', Georgia, serif;
}

/* Hero */
.hero {
  padding: clamp(60px, 10vh, 120px) clamp(24px, 5vw, 48px) clamp(40px, 6vh, 80px);
  text-align: center;
}
.hero-inner {
  max-width: 600px;
  margin: 0 auto;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 1s ease, transform 1s ease;
}
.hero-inner.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-ornament {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin-bottom: 20px;
}
.hero-line {
  width: 40px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.hero-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.4rem;
  color: var(--gold);
  line-height: 1;
}

.hero-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  margin-bottom: 16px;
}

.hero-sub {
  font-size: clamp(0.9rem, 2vw, 1.05rem);
  line-height: 1.7;
  opacity: 0.55;
  max-width: 480px;
  margin: 0 auto;
}

/* Section */
.section {
  padding: 0 clamp(24px, 5vw, 48px) clamp(48px, 8vh, 80px);
  max-width: 900px;
  margin: 0 auto;
}

.section-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0;
  color: var(--gold);
  margin-bottom: clamp(28px, 4vh, 44px);
  transition: opacity 0.8s ease;
}
.section-label.is-visible { opacity: 0.6; }

/* Values */
.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: clamp(20px, 3vw, 32px);
}

.value-card {
  padding: 24px;
  border: 1px solid var(--gold-faint);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.3s;
}
.value-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.value-card:hover { border-color: var(--gold-dim); }

.value-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 0.8rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 10px;
}

.value-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.value-text {
  font-size: 0.88rem;
  line-height: 1.65;
  opacity: 0.5;
}

/* Branches */
.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(16px, 3vw, 24px);
}

.branch-card {
  padding: 24px;
  border: 1px solid var(--gold-faint);
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.3s;
}
.branch-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.branch-card:hover { border-color: var(--gold-dim); }

.branch-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.branch-desc {
  font-size: 0.88rem;
  line-height: 1.6;
  opacity: 0.5;
  margin-bottom: 14px;
}

.branch-link {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0.7;
  transition: opacity 0.3s;
}
.branch-link:hover { opacity: 1; }

.branch-status {
  font-size: 12px;
  font-style: italic;
  opacity: 0.3;
}

/* Footer */
.page-footer {
  text-align: center;
  padding: 24px;
  font-size: 11px;
  opacity: 0.25;
  letter-spacing: 0.05em;
}
</style>
