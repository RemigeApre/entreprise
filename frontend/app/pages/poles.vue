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
  title: 'Nos poles \u2014 Le Geai',
  description: 'Edition, informatique et medias : decouvrez les trois poles du groupe Le Geai.',
  ogTitle: 'Le Geai \u2014 Nos poles',
  ogDescription: 'Trois poles complementaires au service de la creation.'
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

const branches = [
  { title: 'Edition', desc: 'Maison d\u2019edition dediee aux ouvrages qui marquent. Romans, essais et beaux livres, avec une exigence editoriale sans concession.', status: 'En refonte' },
  { title: 'Informatique', desc: 'Sites web, applications et solutions numeriques sur mesure. Conception, developpement et hebergement pour entreprises et particuliers.', href: 'https://legeai-informatique.fr' },
  { title: 'Medias', desc: 'Production de contenus et journalisme independant. Analyses, reportages et formats originaux au croisement des cultures.', href: 'https://bergfrid.com' }
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

    <!-- Watermark — goes UP on reveal -->
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
          <span class="title-main">Nos</span>
          <span class="title-main">Poles</span>
        </h1>

        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>

        <p class="motto">Trois disciplines, une vision commune.</p>
        <p class="motto-sub">Edition, informatique et medias.</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span class="footer-text">&copy; {{ new Date().getFullYear() }} Groupe Le Geai</span>
    </div>

    <!-- POLES PANEL — slides from BOTTOM (logo goes up = content from bottom) -->
    <div class="poles-panel">
      <button class="panel-back" @click="goBack">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>Retour</span>
      </button>

      <div class="panel-content">
        <h2 class="panel-title">Nos poles</h2>
        <div class="panel-ornament">
          <div class="panel-ornament-line" />
        </div>

        <div class="poles-grid">
          <a
            v-for="(branch, i) in branches"
            :key="branch.title"
            :href="branch.href || undefined"
            :target="branch.href ? '_blank' : undefined"
            :rel="branch.href ? 'noopener noreferrer' : undefined"
            class="pole-card"
            :class="{ 'pole-card--disabled': !branch.href }"
            :style="{ transitionDelay: `${1800 + i * 120}ms` }"
          >
            <h3 class="pole-title">{{ branch.title }}</h3>
            <p class="pole-desc">{{ branch.desc }}</p>
            <span v-if="branch.href" class="pole-link-label">Visiter&thinsp;&#x2197;</span>
            <span v-else-if="branch.status" class="pole-status">{{ branch.status }}</span>
          </a>
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
   WATERMARK — goes UP and disappears
   login:       left: 50% → 0      (slides left, half visible)
   recrutement: left: 50% → 100%   (slides right, half visible)
   valeurs:     top: 50% → 150%    (slides down, disappears)
   poles:       top: 50% → -50%    (slides up, disappears)
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
  top: -50%;
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
   POLES PANEL — slides from BOTTOM
   (logo goes UP → content comes from BOTTOM)

   login-panel:   fixed top:0 right:0 bottom:0  width:50%   translateX(60px)
   recru-panel:   fixed top:0 left:0  bottom:0  width:50%   translateX(-60px)
   valeurs-panel: fixed inset:0                              translateY(-60px)
   poles-panel:   fixed inset:0                              translateY(60px)
   ============================ */
.poles-panel {
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
  transform: translateY(60px);
  pointer-events: none;
  transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
}
.revealed .poles-panel {
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

/* Poles grid */
.poles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.pole-card {
  display: flex;
  flex-direction: column;
  padding: 28px 24px;
  border: 1px solid var(--gold-dim);
  text-decoration: none;
  color: inherit;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s, background 0.3s;
}
.revealed .pole-card {
  opacity: 1;
  transform: translateY(0);
}
.pole-card:not(.pole-card--disabled):hover {
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.04);
}
:global(.dark) .pole-card:not(.pole-card--disabled):hover {
  background: rgba(175, 143, 60, 0.08);
}
.pole-card--disabled {
  cursor: default;
}

.pole-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  transition: color 0.3s;
}
.pole-card:not(.pole-card--disabled):hover .pole-title { color: var(--gold); }

.pole-desc {
  font-size: 0.88rem;
  line-height: 1.7;
  opacity: 0.45;
  margin-bottom: 16px;
  flex: 1;
}

.pole-link-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.6;
  transition: opacity 0.3s;
}
.pole-card:hover .pole-link-label { opacity: 1; }

.pole-status {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 12px;
  font-style: italic;
  opacity: 0.3;
}

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .title-main { font-size: clamp(2rem, 7vw, 3.5rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 768px) {
  .poles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
