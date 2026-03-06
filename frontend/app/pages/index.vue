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
    },
    { rel: 'canonical', href: 'https://entreprise.legeai-editions.com' }
  ]
})

useSeoMeta({
  title: 'Groupe Le Geai — Edition, Informatique, Medias',
  description: 'Le Geai est un groupe culturel pluridisciplinaire. Edition, services informatiques et production mediatique. Obscuritas nutrit flammam.',
  ogTitle: 'Groupe Le Geai',
  ogDescription: 'Edition · Informatique · Medias — Obscuritas nutrit flammam.',
  ogType: 'website',
  ogSiteName: 'Le Geai'
})

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const lang = ref<'fr' | 'en'>('fr')
function toggleLang() { lang.value = lang.value === 'fr' ? 'en' : 'fr' }

const t = computed(() => lang.value === 'fr' ? {
  motto: 'L\u2019obscurite nourrit la flamme.',
  copyright: `\u00A9 ${new Date().getFullYear()} Groupe Le Geai`,
  identite: 'Notre identite',
  editions: 'Editions',
  editions_note: 'en construction',
  informatique: 'Le Geai Informatique',
  bergfrid: 'Bergfrid',
  recrutement: 'Recrutement',
  soutenir: 'Nous soutenir'
} : {
  motto: 'Darkness feeds the flame.',
  copyright: `\u00A9 ${new Date().getFullYear()} Groupe Le Geai`,
  identite: 'Our identity',
  editions: 'Publishing',
  editions_note: 'coming soon',
  informatique: 'Le Geai Tech',
  bergfrid: 'Bergfrid',
  recrutement: 'Careers',
  soutenir: 'Support us'
})

const visible = ref(false)
onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})
</script>

<template>
  <div class="landing" :class="{ 'is-visible': visible }">

    <!-- SVG noise filter -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>

    <!-- Noise texture overlay -->
    <div class="noise-layer" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#noise)" /></svg>
    </div>

    <!-- Vignette -->
    <div class="vignette" aria-hidden="true" />

    <!-- Background watermark logo — IMPOSING -->
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
      <div class="frame-mark frame-mark--left" />
      <div class="frame-mark frame-mark--right" />
    </div>

    <!-- ============ TOP-RIGHT : Connexion + Theme ============ -->
    <header class="top-bar">
      <button
        class="top-icon"
        :aria-label="isDark ? 'Mode clair' : 'Mode sombre'"
        @click="toggleTheme"
      >
        <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
      </button>
      <NuxtLink to="/login" class="top-icon top-icon--key" aria-label="Connexion">
        <UIcon name="i-lucide-key-round" class="size-4" />
      </NuxtLink>
    </header>

    <!-- ============ ZONE 1 : En-tete ============ -->
    <div class="zone zone--header">
      <h1 class="landing-title">LE GEAI</h1>

      <div class="ornament-divider">
        <div class="ornament-line" />
        <span class="ornament-glyph">G</span>
        <div class="ornament-line" />
      </div>

      <p class="landing-motto">
        <span class="motto-latin">Obscuritas nutrit flammam.</span>
      </p>
      <p class="landing-motto-sub">{{ t.motto }}</p>
    </div>

    <!-- ============ ZONE 2 : Navigation — Table des matieres ============ -->
    <nav class="zone zone--nav" aria-label="Navigation principale">
      <ul class="nav-list">
        <!-- Active internal links -->
        <li class="nav-entry" :style="{ '--i': 0 }">
          <NuxtLink to="/le-geai" class="nav-link">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.identite }}</span>
          </NuxtLink>
        </li>

        <li class="nav-entry" :style="{ '--i': 1 }">
          <NuxtLink to="/recrutement" class="nav-link">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.recrutement }}</span>
          </NuxtLink>
        </li>

        <li class="nav-entry" :style="{ '--i': 2 }">
          <NuxtLink to="/soutenir" class="nav-link nav-link--warm">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.soutenir }}</span>
          </NuxtLink>
        </li>

        <!-- Separator -->
        <li class="nav-separator" :style="{ '--i': 3 }" aria-hidden="true">
          <div class="sep-line" />
        </li>

        <!-- External links -->
        <li class="nav-entry" :style="{ '--i': 4 }">
          <a href="https://legeai-informatique.fr" target="_blank" rel="noopener noreferrer" class="nav-link">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.informatique }}</span>
            <span class="nav-arrow">&nearr;</span>
          </a>
        </li>

        <li class="nav-entry" :style="{ '--i': 5 }">
          <a href="https://bergfrid.com" target="_blank" rel="noopener noreferrer" class="nav-link">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.bergfrid }}</span>
            <span class="nav-arrow">&nearr;</span>
          </a>
        </li>

        <!-- Disabled -->
        <li class="nav-entry" :style="{ '--i': 6 }">
          <span class="nav-link nav-link--disabled">
            <span class="nav-bullet">&loz;</span>
            <span class="nav-text">{{ t.editions }}</span>
            <span class="nav-note">&mdash; {{ t.editions_note }}</span>
          </span>
        </li>
      </ul>
    </nav>

    <!-- ============ ZONE 3 : Pied de page ============ -->
    <div class="zone zone--footer">
      <div class="footer-row">
        <span class="footer-text">{{ t.copyright }}</span>
        <span class="footer-sep">&middot;</span>
        <button class="footer-btn" @click="toggleLang">{{ lang === 'fr' ? 'EN' : 'FR' }}</button>
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
  --terracotta: #B74D34;
  --cream: #F7F0DE;
  --green: #1F2C23;
  --ink: #2c2419;

  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  font-family: 'Crimson Pro', Georgia, serif;
  color: var(--ink);
  overflow: hidden;
}

:global(.dark) .landing {
  color: var(--cream);
}

/* ============================
   LAYERS
   ============================ */
.noise-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.02;
  mix-blend-mode: overlay;
}

:global(.dark) .noise-layer {
  opacity: 0.035;
}

.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(ellipse at center, transparent 35%, rgba(44, 36, 25, 0.06) 100%);
}

:global(.dark) .vignette {
  background: radial-gradient(ellipse at center, transparent 25%, rgba(14, 21, 15, 0.35) 100%);
}

/* ============================
   WATERMARK — IMPOSING
   ============================ */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(380px, 90vmin, 760px);
  height: clamp(380px, 90vmin, 760px);
  pointer-events: none;
  z-index: 0;
}

.watermark-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.04;
  transition: opacity 0.4s ease, filter 0.4s ease;
}

:global(.dark) .watermark-img {
  filter: brightness(0) invert(0.88);
  opacity: 0.05;
}

/* ============================
   GOLD FRAME
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 20px);
  border: 1px solid var(--gold-faint);
  pointer-events: none;
  z-index: 0;
}

.corner {
  position: absolute;
  width: 24px;
  height: 24px;
}

.corner--tl { top: -1px; left: -1px; border-top: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.corner--tr { top: -1px; right: -1px; border-top: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }
.corner--bl { bottom: -1px; left: -1px; border-bottom: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.corner--br { bottom: -1px; right: -1px; border-bottom: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }

.frame-mark {
  position: absolute;
  background: var(--gold-dim);
}

.frame-mark--top,
.frame-mark--bottom {
  width: 1px;
  height: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.frame-mark--top { top: -1px; }
.frame-mark--bottom { bottom: -1px; }

.frame-mark--left,
.frame-mark--right {
  width: 8px;
  height: 1px;
  top: 50%;
  transform: translateY(-50%);
}

.frame-mark--left { left: -1px; }
.frame-mark--right { right: -1px; }

/* ============================
   TOP-RIGHT BAR
   ============================ */
.top-bar {
  position: fixed;
  top: clamp(18px, 3.5vw, 30px);
  right: clamp(18px, 3.5vw, 30px);
  z-index: 10;
  display: flex;
  gap: 10px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.8s ease 0.2s;
}

.is-visible .top-bar {
  opacity: 1;
}

.top-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gold-dim);
  border-radius: 50%;
  color: var(--gold);
  background: transparent;
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease, background 0.3s ease;
  opacity: 0.7;
}

.top-icon:hover {
  opacity: 1;
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.06);
}

:global(.dark) .top-icon:hover {
  background: rgba(175, 143, 60, 0.1);
}

.top-icon--key {
  border-color: var(--gold);
  opacity: 0.85;
}

.top-icon--key:hover {
  background: rgba(175, 143, 60, 0.1);
  opacity: 1;
}

:global(.dark) .top-icon--key:hover {
  background: rgba(175, 143, 60, 0.15);
}

/* ============================
   ZONES LAYOUT
   ============================ */
.zone {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.zone--header {
  flex: 3 1 0%;
  justify-content: flex-end;
  padding-bottom: clamp(8px, 1.5vh, 20px);
}

.zone--nav {
  flex: 5 1 0%;
  justify-content: center;
  padding: 0 24px;
}

.zone--footer {
  flex: 0 0 auto;
  justify-content: center;
  padding: clamp(8px, 1.5vh, 16px) 0;
}

/* ============================
   HEADER
   ============================ */
.landing-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 4.5vw, 3rem);
  font-weight: 400;
  letter-spacing: 0.35em;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s;
}

.is-visible .landing-title {
  opacity: 1;
  transform: translateY(0);
}

.ornament-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: clamp(6px, 1vh, 12px);
  opacity: 0;
  transition: opacity 0.8s ease 0.45s;
}

.is-visible .ornament-divider {
  opacity: 0.55;
}

.ornament-line {
  width: clamp(28px, 7vw, 56px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.ornament-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(1rem, 2.2vw, 1.4rem);
  color: var(--gold);
  line-height: 1;
}

.landing-motto {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(1rem, 2.8vw, 1.35rem);
  text-align: center;
  margin-top: clamp(8px, 1.5vh, 18px);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.9s ease 0.6s, transform 0.9s ease 0.6s;
  letter-spacing: 0.05em;
}

.is-visible .landing-motto {
  opacity: 1;
  transform: translateY(0);
}

.motto-latin {
  color: var(--gold);
}

.landing-motto-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.6rem, 1.3vw, 0.75rem);
  text-align: center;
  margin-top: 3px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.8s ease 0.8s;
}

.is-visible .landing-motto-sub {
  opacity: 0.35;
}

/* ============================
   NAVIGATION — Table des matieres
   ============================ */
.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(6px, 1.2vh, 12px);
}

.nav-entry {
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.5s ease calc(0.8s + var(--i) * 0.07s),
    transform 0.5s ease calc(0.8s + var(--i) * 0.07s);
}

.is-visible .nav-entry {
  opacity: 1;
  transform: translateY(0);
}

.nav-separator {
  opacity: 0;
  transition: opacity 0.5s ease calc(0.8s + var(--i) * 0.07s);
  padding: clamp(2px, 0.4vh, 6px) 0;
}

.is-visible .nav-separator {
  opacity: 1;
}

.sep-line {
  width: clamp(20px, 5vw, 36px);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  margin: 0 auto;
}

/* Nav link base */
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: clamp(6px, 1.2vw, 10px);
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(0.95rem, 2.4vw, 1.15rem);
  letter-spacing: 0.05em;
  text-decoration: none;
  color: inherit;
  opacity: 0.55;
  transition: opacity 0.3s ease, color 0.3s ease;
  position: relative;
  padding: 2px 0;
}

.nav-link:hover {
  opacity: 1;
  color: var(--gold);
}

/* Gold underline on hover */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  right: 50%;
  height: 1px;
  background: var(--gold);
  opacity: 0;
  transition: left 0.3s ease, right 0.3s ease, opacity 0.3s ease;
}

.nav-link:hover::after {
  left: 0;
  right: 0;
  opacity: 0.5;
}

/* Bullet — small gold lozenge */
.nav-bullet {
  font-size: 0.5em;
  color: var(--gold);
  opacity: 0.5;
  transition: opacity 0.3s ease;
  line-height: 1;
}

.nav-link:hover .nav-bullet {
  opacity: 1;
}

/* Arrow for external links */
.nav-arrow {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7em;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.nav-link:hover .nav-arrow {
  opacity: 0.7;
}

/* Warm accent (Nous soutenir) */
.nav-link--warm:hover {
  color: var(--terracotta);
}

.nav-link--warm:hover::after {
  background: var(--terracotta);
}

.nav-link--warm:hover .nav-bullet {
  color: var(--terracotta);
}

/* Disabled (Editions) */
.nav-link--disabled {
  opacity: 0.25;
  cursor: default;
}

.nav-link--disabled:hover {
  opacity: 0.25;
  color: inherit;
}

.nav-link--disabled::after {
  display: none;
}

.nav-note {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.7em;
  font-style: italic;
  opacity: 0.6;
  letter-spacing: 0.02em;
}

/* ============================
   FOOTER
   ============================ */
.footer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.8s ease 1.4s;
}

.is-visible .footer-row {
  opacity: 0.3;
}

.footer-row:hover {
  opacity: 0.6;
}

.footer-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.3vw, 10px);
}

.footer-sep {
  font-size: 7px;
  opacity: 0.4;
}

.footer-btn {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.3vw, 10px);
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px 4px;
  letter-spacing: 0.05em;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.footer-btn:hover {
  opacity: 1;
}

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .landing-title {
    font-size: clamp(1.2rem, 3vw, 1.8rem);
  }

  .landing-motto {
    font-size: clamp(0.85rem, 2vw, 1rem);
  }

  .nav-list {
    gap: 4px;
  }

  .nav-link {
    font-size: clamp(0.85rem, 2vw, 1rem);
  }
}

@media (max-width: 379px) {
  .top-bar {
    top: 12px;
    right: 12px;
  }

  .top-icon {
    width: 34px;
    height: 34px;
  }
}
</style>
