<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'L\u2019entreprise \u2014 Le Geai',
  description: 'Decouvrez les valeurs, la vision et les poles du groupe Le Geai.',
  ogTitle: 'Le Geai \u2014 L\u2019entreprise',
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
  <div class="page-entreprise" :class="{ 'is-visible': visible }">
    <!-- Hero -->
    <section class="hero">
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
    </section>

    <!-- Values -->
    <section class="section">
      <h2 class="section-label">Nos valeurs</h2>
      <div class="values-grid">
        <div
          v-for="(val, i) in values"
          :key="val.title"
          class="value-card"
          :style="{ transitionDelay: `${400 + i * 150}ms` }"
        >
          <span class="value-numeral">{{ val.numeral }}</span>
          <h3 class="value-title">{{ val.title }}</h3>
          <p class="value-text">{{ val.text }}</p>
        </div>
      </div>
    </section>

    <!-- Branches -->
    <section class="section">
      <h2 class="section-label section-label--delay">Nos poles</h2>
      <div class="branches-grid">
        <div
          v-for="(branch, i) in branches"
          :key="branch.title"
          class="branch-card"
          :style="{ transitionDelay: `${700 + i * 150}ms` }"
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
      <div class="footer-ornament">
        <div class="footer-line" />
      </div>
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
  max-width: 520px;
  margin: 16px auto 0;
  transition: opacity 0.8s ease 0.5s;
}
.is-visible .hero-sub { opacity: 0.5; }

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
  transition: opacity 0.8s ease 0.3s;
}
.is-visible .section-label { opacity: 0.6; }
.section-label--delay { transition-delay: 0.6s; }

/* Values */
.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(16px, 3vw, 24px);
}

.value-card {
  padding: 28px 24px;
  border: 1px solid var(--gold-faint);
  position: relative;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.4s;
}
.is-visible .value-card {
  opacity: 1;
  transform: translateY(0);
}

/* Corner accents on cards */
.value-card::before,
.value-card::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.3s;
  opacity: 0;
}
.value-card::before {
  top: -1px; left: -1px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.value-card::after {
  bottom: -1px; right: -1px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
.value-card:hover::before,
.value-card:hover::after {
  width: 22px; height: 22px;
  opacity: 0.5;
}
.value-card:hover { border-color: var(--gold-dim); }

.value-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 0.8rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 12px;
  transition: opacity 0.3s, text-shadow 0.4s;
}
.value-card:hover .value-numeral {
  opacity: 0.8;
  text-shadow: 0 0 12px rgba(175, 143, 60, 0.3);
}

.value-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  transition: color 0.3s;
}
.value-card:hover .value-title { color: var(--gold); }

.value-text {
  font-size: 0.88rem;
  line-height: 1.7;
  opacity: 0.45;
}

/* Branches */
.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: clamp(16px, 3vw, 24px);
}

.branch-card {
  padding: 28px 24px;
  border: 1px solid var(--gold-faint);
  position: relative;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.7s ease, transform 0.7s ease, border-color 0.4s;
}
.is-visible .branch-card {
  opacity: 1;
  transform: translateY(0);
}
.branch-card::before,
.branch-card::after {
  content: '';
  position: absolute;
  width: 16px; height: 16px;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              height 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.3s;
  opacity: 0;
}
.branch-card::before {
  top: -1px; left: -1px;
  border-top: 1px solid var(--gold);
  border-left: 1px solid var(--gold);
}
.branch-card::after {
  bottom: -1px; right: -1px;
  border-bottom: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}
.branch-card:hover::before,
.branch-card:hover::after {
  width: 22px; height: 22px;
  opacity: 0.5;
}
.branch-card:hover { border-color: var(--gold-dim); }

.branch-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  transition: color 0.3s;
}
.branch-card:hover .branch-title { color: var(--gold); }

.branch-desc {
  font-size: 0.88rem;
  line-height: 1.65;
  opacity: 0.45;
  margin-bottom: 16px;
}

.branch-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0.6;
  transition: opacity 0.3s, letter-spacing 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.branch-link:hover { opacity: 1; letter-spacing: 0.22em; }

.branch-status {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 12px;
  font-style: italic;
  opacity: 0.3;
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
