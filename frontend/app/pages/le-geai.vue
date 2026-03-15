<script setup lang="ts">
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
  title: 'L\u2019entreprise \u2014 Le Geai',
  description: 'Decouvrez les valeurs, la vision et les poles du groupe Le Geai.',
  ogTitle: 'Le Geai \u2014 L\u2019entreprise',
  ogDescription: 'Un groupe fonde sur l\u2019exigence, la creativite et l\u2019accessibilite.'
})

const visible = ref(false)
const revealed = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    visible.value = true
    setTimeout(() => { revealed.value = true }, 1200)
  })
})

function goBack() {
  revealed.value = false
  setTimeout(() => { navigateTo('/') }, 1400)
}

const values = [
  { numeral: 'I', title: 'Exigence', text: 'Chaque detail compte. Nous ne livrons que ce dont nous sommes fiers, du premier pixel a la derniere ligne de code.', color: '#AF8F3C' },
  { numeral: 'II', title: 'Accessibilite', text: 'Si un utilisateur ne s\u2019y retrouve pas, c\u2019est nous qui avons echoue. La simplicite est notre complexite.', color: '#6B8F71' },
  { numeral: 'III', title: 'Creativite', text: 'L\u2019innovation nait au croisement des disciplines. Edition, technologie et medias se nourrissent mutuellement.', color: '#8B6F4E' },
  { numeral: 'IV', title: 'Integrite', text: 'Des engagements tenus, une transparence totale. La confiance se construit sur la constance.', color: '#7A6A8A' }
]
</script>

<template>
  <div class="landing" :class="{ 'is-visible': visible, 'revealed': revealed }">

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

    <!-- Watermark — goes DOWN on reveal -->
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

    <!-- Top bar -->
    <header class="top-bar">
      <button class="top-back" @click="goBack">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Retour</span>
      </button>
    </header>

    <!-- CENTER — fades out -->
    <div class="center">
      <div class="center-inner">
        <h1 class="title">
          <span class="title-main">L'entreprise</span>
        </h1>

        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>

        <p class="motto">Creer avec exigence, partager avec sincerite.</p>
        <p class="motto-sub">Les valeurs du groupe Le Geai.</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span class="footer-text">&copy; {{ new Date().getFullYear() }} Groupe Le Geai</span>
    </div>

    <!-- VALEURS PANEL — slides from TOP -->
    <div class="valeurs-panel">
      <!-- Retour button — prominent -->
      <button class="panel-back" @click="goBack">
        <UIcon name="i-lucide-arrow-left" class="size-4 back-arrow" />
        <span>Retour a l'accueil</span>
      </button>

      <div class="panel-content">
        <h2 class="panel-title">Nos valeurs</h2>
        <div class="panel-ornament">
          <div class="panel-ornament-line" />
        </div>

        <div class="valeurs-grid">
          <div
            v-for="(val, i) in values"
            :key="val.title"
            class="valeur-card"
            :style="{
              transitionDelay: `${1800 + i * 120}ms`,
              '--card-color': val.color
            }"
          >
            <span class="valeur-numeral">{{ val.numeral }}</span>
            <h3 class="valeur-title">{{ val.title }}</h3>
            <p class="valeur-text">{{ val.text }}</p>
          </div>
        </div>

        <!-- Devise -->
        <div class="devise-section">
          <div class="devise-ornament">
            <div class="devise-line" />
            <span class="devise-glyph">G</span>
            <div class="devise-line" />
          </div>
          <p class="devise-latin">Obscuritas nutrit flammam.</p>
          <p class="devise-fr">L'obscurite nourrit la flamme.</p>
        </div>

        <!-- Lien articles -->
        <NuxtLink
          to="/articles"
          class="articles-link"
          :style="{ transitionDelay: '2600ms' }"
        >
          <span class="articles-link-icon">
            <UIcon name="i-lucide-feather" class="size-4" />
          </span>
          <span class="articles-link-content">
            <span class="articles-link-title">Lire nos articles</span>
            <span class="articles-link-sub">Reflexions et actualites du groupe</span>
          </span>
          <UIcon name="i-lucide-chevron-right" class="size-4 articles-link-chevron" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================
   BASE
   ============================ */
.landing {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
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
   LAYERS
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
   WATERMARK
   ============================ */
.watermark {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(500px, 100vmin, 920px);
  height: clamp(500px, 100vmin, 920px);
  pointer-events: none; z-index: 0;
  transition: top var(--transition), left var(--transition), width var(--transition), height var(--transition);
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

.revealed .watermark {
  top: 150%;
}
.revealed .watermark-img {
  opacity: 0;
}

/* ============================
   FRAME
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
  transition: opacity var(--transition);
}
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
   TOP BAR — more visible
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
  padding: 8px 16px 8px 12px;
  border: 1px solid var(--gold-dim);
  border-radius: 2px;
  background: rgba(175, 143, 60, 0.04);
  transition: opacity 0.3s, gap 0.3s, background 0.3s, border-color 0.3s;
  cursor: pointer;
}
.top-back:hover {
  opacity: 1;
  gap: 12px;
  background: rgba(175, 143, 60, 0.1);
  border-color: var(--gold);
}

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
  padding: 0 24px;
  transition: opacity 1s ease, transform 1s ease;
}
.revealed .center {
  opacity: 0;
  transform: translateY(-30px);
  pointer-events: none;
}

.center-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 1s ease 0.25s, transform 1s ease 0.25s;
}
.is-visible .title {
  opacity: 1;
  transform: translateY(0);
}
.title-main {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2.8rem, 8vw, 6rem);
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  display: block;
  line-height: 1;
  white-space: nowrap;
}

.ornament {
  display: flex; align-items: center; gap: 14px;
  margin-top: clamp(8px, 1.5vh, 16px);
  opacity: 0;
  transition: opacity 0.8s ease 0.5s;
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

.motto {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(1.1rem, 3.2vw, 1.6rem);
  color: var(--gold);
  margin-top: clamp(10px, 2vh, 22px);
  letter-spacing: 0.05em;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 1s ease 0.65s, transform 1s ease 0.65s;
}
.is-visible .motto {
  opacity: 1;
  transform: translateY(0);
}
.motto-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.62rem, 1.3vw, 0.78rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.8s ease 0.85s;
}
.is-visible .motto-sub { opacity: 0.4; }

/* ============================
   FOOTER
   ============================ */
.footer-bar {
  position: relative;
  z-index: 2;
  display: flex; align-items: center; gap: 8px;
  padding: clamp(6px, 1.2vh, 14px) 0;
  opacity: 0;
  transition: opacity 0.8s ease 1.2s;
}
.is-visible .footer-bar { opacity: 0.35; }
.footer-bar:hover { opacity: 0.6; }
.revealed .footer-bar { opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }

.footer-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.2vw, 10px);
}

/* ============================
   VALEURS PANEL
   ============================ */
.valeurs-panel {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 4vw, 48px);
  padding-top: clamp(60px, 8vh, 90px);
  overflow-y: auto;
  opacity: 0;
  transform: translateY(-60px);
  pointer-events: none;
  transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
}
.revealed .valeurs-panel {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* ============================
   PANEL BACK — prominent button
   ============================ */
.panel-back {
  position: fixed;
  top: clamp(18px, 3.5vw, 32px);
  left: clamp(18px, 3.5vw, 32px);
  display: flex; align-items: center; gap: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0;
  z-index: 30;
  padding: 8px 18px 8px 14px;
  border: 1px solid var(--gold-dim);
  border-radius: 2px;
  background: rgba(175, 143, 60, 0.04);
  transition: opacity 0.4s ease, gap 0.3s, background 0.3s, border-color 0.3s;
  cursor: pointer;
}
.panel-back .back-arrow {
  transition: transform 0.3s ease;
}
.revealed .panel-back { opacity: 0.8; }
.panel-back:hover {
  opacity: 1;
  background: rgba(175, 143, 60, 0.1);
  border-color: var(--gold);
}
.panel-back:hover .back-arrow { transform: translateX(-3px); }

.panel-content {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.panel-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 10px;
}

.panel-ornament {
  display: flex; justify-content: center;
  margin-bottom: clamp(28px, 5vh, 48px);
}
.panel-ornament-line {
  width: 50px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

/* ============================
   VALEURS GRID — colored cards
   ============================ */
.valeurs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
}

.valeur-card {
  padding: 28px;
  border: 1px solid color-mix(in srgb, var(--card-color) 30%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-color) 6%, transparent);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, background 0.3s, box-shadow 0.3s;
}
:global(.dark) .valeur-card {
  background: color-mix(in srgb, var(--card-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--card-color) 25%, transparent);
}
.revealed .valeur-card {
  opacity: 1;
  transform: translateY(0);
}
.valeur-card:hover {
  border-color: color-mix(in srgb, var(--card-color) 50%, transparent);
  background: color-mix(in srgb, var(--card-color) 10%, transparent);
  box-shadow: 0 4px 20px color-mix(in srgb, var(--card-color) 10%, transparent);
}
:global(.dark) .valeur-card:hover {
  background: color-mix(in srgb, var(--card-color) 16%, transparent);
}

.valeur-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 0.85rem;
  color: var(--card-color);
  opacity: 0.7;
  display: block;
  margin-bottom: 10px;
}

.valeur-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  transition: color 0.3s;
}
.valeur-card:hover .valeur-title { color: var(--card-color); }

.valeur-text {
  font-size: 0.9rem;
  line-height: 1.8;
  opacity: 0.65;
}

/* ============================
   DEVISE SECTION
   ============================ */
.devise-section {
  margin-top: clamp(36px, 6vh, 56px);
  text-align: center;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.8s ease, transform 0.8s ease;
  transition-delay: 2400ms;
}
.revealed .devise-section {
  opacity: 1;
  transform: translateY(0);
}

.devise-ornament {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-bottom: 16px;
}
.devise-line {
  width: clamp(24px, 6vw, 48px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.devise-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.3rem;
  color: var(--gold);
  opacity: 0.4;
  line-height: 1;
}

.devise-latin {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  color: var(--gold);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.devise-fr {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.7rem, 1.3vw, 0.85rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.4;
}

/* ============================
   ARTICLES LINK — card style
   ============================ */
.articles-link {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 400px;
  margin-top: clamp(28px, 5vh, 44px);
  padding: 16px 20px;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--gold-dim);
  border-radius: 4px;
  background: rgba(175, 143, 60, 0.03);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, background 0.3s, box-shadow 0.3s;
}
.revealed .articles-link {
  opacity: 1;
  transform: translateY(0);
}
.articles-link:hover {
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.08);
  box-shadow: 0 4px 16px rgba(175, 143, 60, 0.1);
}

.articles-link-icon {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(175, 143, 60, 0.08);
  color: var(--gold);
  flex-shrink: 0;
  transition: background 0.3s;
}
.articles-link:hover .articles-link-icon {
  background: rgba(175, 143, 60, 0.15);
}

.articles-link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.articles-link-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1rem;
  letter-spacing: 0.04em;
  transition: color 0.3s;
}
.articles-link:hover .articles-link-title {
  color: var(--gold);
}

.articles-link-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.78rem;
  opacity: 0.4;
  letter-spacing: 0.02em;
}

.articles-link-chevron {
  color: var(--gold);
  opacity: 0.4;
  flex-shrink: 0;
  transition: opacity 0.3s, transform 0.3s;
}
.articles-link:hover .articles-link-chevron {
  opacity: 1;
  transform: translateX(3px);
}

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .title-main { font-size: clamp(2rem, 7vw, 3.5rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 640px) {
  .valeurs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
