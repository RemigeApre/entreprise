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
  { numeral: 'I', title: 'Exigence', text: 'Chaque detail compte. Nous ne livrons que ce dont nous sommes fiers, du premier pixel a la derniere ligne de code.' },
  { numeral: 'II', title: 'Accessibilite', text: 'Si un utilisateur ne s\u2019y retrouve pas, c\u2019est nous qui avons echoue. La simplicite est notre complexite.' },
  { numeral: 'III', title: 'Creativite', text: 'L\u2019innovation nait au croisement des disciplines. Edition, technologie et medias se nourrissent mutuellement.' },
  { numeral: 'IV', title: 'Integrite', text: 'Des engagements tenus, une transparence totale. La confiance se construit sur la constance.' }
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
          <span class="title-main">L'entre</span>
          <span class="title-main">prise</span>
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

    <!-- VALEURS PANEL — slides from TOP (logo goes down = content from top) -->
    <div class="valeurs-panel">
      <button class="panel-back" @click="goBack">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Retour</span>
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
            :style="{ transitionDelay: `${1800 + i * 120}ms` }"
          >
            <span class="valeur-numeral">{{ val.numeral }}</span>
            <h3 class="valeur-title">{{ val.title }}</h3>
            <p class="valeur-text">{{ val.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================
   BASE — identical to index.vue
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
   LAYERS — identical to index.vue
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
   WATERMARK — goes DOWN and disappears
   login:       left: 50% → 0     (slides left, half visible)
   recrutement: left: 50% → 100%  (slides right, half visible)
   valeurs:     top: 50% → 150%   (slides down, fully disappears)
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
   FRAME — identical to index.vue
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
  transition: opacity 0.3s, gap 0.3s;
}
.top-back:hover { opacity: 1; gap: 12px; }

/* ============================
   CENTER — identical to index.vue
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
  font-size: clamp(3.2rem, 10vw, 7rem);
  font-weight: 400;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  display: block;
  line-height: 0.85;
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
   FOOTER — identical to index.vue
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
   VALEURS PANEL — slides from TOP
   (logo goes DOWN → content comes from TOP)

   login-panel:  fixed top:0 right:0 bottom:0  width:50%  translateX(60px)
   recru-panel:  fixed top:0 left:0  bottom:0  width:50%  translateX(-60px)
   valeurs-panel: fixed top:0 left:0  right:0  bottom:0   translateY(-60px)
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

.panel-back {
  position: fixed;
  top: clamp(20px, 3.5vw, 36px);
  left: clamp(20px, 3vw, 40px);
  display: flex; align-items: center; gap: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0;
  z-index: 30;
  transition: opacity 0.3s, gap 0.3s;
}
.revealed .panel-back { opacity: 0.7; }
.panel-back:hover { opacity: 1; gap: 12px; }

.panel-content {
  width: 100%;
  max-width: 800px;
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

/* Valeurs grid */
.valeurs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.valeur-card {
  padding: 24px;
  border: 1px solid var(--gold-dim);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, background 0.3s;
}
.revealed .valeur-card {
  opacity: 1;
  transform: translateY(0);
}
.valeur-card:hover {
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.04);
}
:global(.dark) .valeur-card:hover {
  background: rgba(175, 143, 60, 0.08);
}

.valeur-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 0.8rem;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 10px;
}

.valeur-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
  transition: color 0.3s;
}
.valeur-card:hover .valeur-title { color: var(--gold); }

.valeur-text {
  font-size: 0.85rem;
  line-height: 1.7;
  opacity: 0.45;
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
