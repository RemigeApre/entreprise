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
  copyright: `\u00A9 ${new Date().getFullYear()} Le Geai`,
  identite: 'Notre identite',
  editions: 'Editions',
  editions_note: 'en construction',
  informatique: 'Informatique',
  bergfrid: 'Bergfrid',
  recrutement: 'Recrutement',
  soutenir: 'Nous soutenir'
} : {
  motto: 'Darkness feeds the flame.',
  copyright: `\u00A9 ${new Date().getFullYear()} Le Geai`,
  identite: 'Our identity',
  editions: 'Publishing',
  editions_note: 'coming soon',
  informatique: 'Tech',
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

    <!-- Watermark — massive -->
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

    <!-- ===== TOP-RIGHT : key + theme ===== -->
    <header class="top-bar">
      <button class="top-btn" :aria-label="isDark ? 'Mode clair' : 'Mode sombre'" @click="toggleTheme">
        <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
      </button>
      <NuxtLink to="/login" class="top-btn top-btn--key" aria-label="Connexion">
        <UIcon name="i-lucide-key-round" class="size-4" />
      </NuxtLink>
    </header>

    <!-- ===== SPINE NAV — left (desktop) ===== -->
    <nav class="spine spine--left" aria-label="Pages internes">
      <div class="spine-track">
        <NuxtLink to="/le-geai" class="spine-link">
          <span class="spine-link-dash" aria-hidden="true" />
          <span class="spine-link-label">{{ t.identite }}</span>
        </NuxtLink>
        <NuxtLink to="/recrutement" class="spine-link">
          <span class="spine-link-dash" aria-hidden="true" />
          <span class="spine-link-label">{{ t.recrutement }}</span>
        </NuxtLink>
        <NuxtLink to="/soutenir" class="spine-link spine-link--warm">
          <span class="spine-link-dash" aria-hidden="true" />
          <span class="spine-link-label">{{ t.soutenir }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- ===== SPINE NAV — right (desktop) ===== -->
    <nav class="spine spine--right" aria-label="Nos branches">
      <div class="spine-track">
        <a href="https://legeai-informatique.fr" target="_blank" rel="noopener noreferrer" class="spine-link">
          <span class="spine-link-label">{{ t.informatique }}</span>
          <span class="spine-link-dash" aria-hidden="true" />
        </a>
        <a href="https://bergfrid.com" target="_blank" rel="noopener noreferrer" class="spine-link">
          <span class="spine-link-label">{{ t.bergfrid }}</span>
          <span class="spine-link-dash" aria-hidden="true" />
        </a>
        <span class="spine-link spine-link--muted">
          <span class="spine-link-label">{{ t.editions }}</span>
        </span>
      </div>
    </nav>

    <!-- ===== CENTER ===== -->
    <div class="center">
      <div class="center-inner">
        <!-- Subtitle -->
        <p class="subtitle">Edition &middot; Informatique &middot; Medias</p>

        <!-- Title -->
        <h1 class="title">LE&ensp;GEAI</h1>

        <!-- Ornament -->
        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>

        <!-- Motto -->
        <p class="motto">Obscuritas nutrit flammam.</p>
        <p class="motto-sub">{{ t.motto }}</p>
      </div>
    </div>

    <!-- ===== MOBILE NAV ===== -->
    <nav class="mobile-nav" aria-label="Navigation">
      <div class="mnav-row">
        <NuxtLink to="/le-geai" class="mnav-link">{{ t.identite }}</NuxtLink>
        <span class="mnav-sep">&middot;</span>
        <NuxtLink to="/recrutement" class="mnav-link">{{ t.recrutement }}</NuxtLink>
        <span class="mnav-sep">&middot;</span>
        <NuxtLink to="/soutenir" class="mnav-link mnav-link--warm">{{ t.soutenir }}</NuxtLink>
      </div>
      <div class="mnav-row mnav-row--secondary">
        <a href="https://legeai-informatique.fr" target="_blank" rel="noopener noreferrer" class="mnav-link">{{ t.informatique }}&thinsp;&nearr;</a>
        <span class="mnav-sep">&middot;</span>
        <a href="https://bergfrid.com" target="_blank" rel="noopener noreferrer" class="mnav-link">{{ t.bergfrid }}&thinsp;&nearr;</a>
        <span class="mnav-sep">&middot;</span>
        <span class="mnav-link mnav-link--muted">{{ t.editions }}</span>
      </div>
    </nav>

    <!-- ===== FOOTER ===== -->
    <div class="footer-bar">
      <span class="footer-text">{{ t.copyright }}</span>
      <span class="footer-sep">&middot;</span>
      <button class="footer-btn" @click="toggleLang">{{ lang === 'fr' ? 'EN' : 'FR' }}</button>
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
  width: clamp(400px, 95vmin, 820px);
  height: clamp(400px, 95vmin, 820px);
  pointer-events: none; z-index: 0;
}
.watermark-img {
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0.04;
  transition: opacity 0.4s ease, filter 0.4s ease;
}
:global(.dark) .watermark-img {
  filter: brightness(0) invert(0.85);
  opacity: 0.055;
}

/* ============================
   FRAME
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
}
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
   TOP-RIGHT BAR
   ============================ */
.top-bar {
  position: fixed;
  top: clamp(18px, 3.5vw, 32px);
  right: clamp(18px, 3.5vw, 32px);
  z-index: 10;
  display: flex; gap: 10px; align-items: center;
  opacity: 0;
  transition: opacity 0.8s ease 0.2s;
}
.is-visible .top-bar { opacity: 1; }

.top-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--gold-dim);
  border-radius: 50%;
  color: var(--gold);
  background: transparent;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s, border-color 0.3s, background 0.3s, transform 0.3s;
}
.top-btn:hover {
  opacity: 1;
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.07);
}
.top-btn:focus-visible {
  opacity: 1;
  border-color: var(--gold);
  outline: 1px solid var(--gold-dim);
  outline-offset: 3px;
}
:global(.dark) .top-btn:hover { background: rgba(175, 143, 60, 0.12); }

.top-btn--key {
  border-color: var(--gold);
  opacity: 0.9;
}
.top-btn--key:hover { opacity: 1; background: rgba(175, 143, 60, 0.1); }
:global(.dark) .top-btn--key:hover { background: rgba(175, 143, 60, 0.16); }

/* ============================
   SPINE NAV (desktop — book-spine along frame edges)
   ============================ */
.spine {
  position: fixed;
  top: 0; bottom: 0;
  width: 52px;
  display: flex; align-items: center; justify-content: center;
  z-index: 5;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease 0.6s;
}
.is-visible .spine { opacity: 1; }

.spine--left { left: clamp(10px, 2.2vw, 20px); }
.spine--right { right: clamp(10px, 2.2vw, 20px); }

.spine-track {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  white-space: nowrap;
  pointer-events: auto;
}

.spine--left .spine-track {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
}

.spine--right .spine-track {
  writing-mode: vertical-lr;
}

.spine-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: inherit;
  opacity: 0.55;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 6px;
  transition: opacity 0.35s, color 0.35s;
  position: relative;
}

.spine-link:hover, .spine-link:focus-visible {
  opacity: 1;
  color: var(--gold);
}
.spine-link:focus-visible {
  outline: 1px solid var(--gold-dim);
  outline-offset: 4px;
}

.spine-link--warm:hover,
.spine-link--warm:focus-visible { color: var(--terracotta); }

.spine-link--muted {
  opacity: 0.2;
  cursor: default;
  font-style: italic;
  letter-spacing: 0.08em;
  text-transform: none;
}

.spine-link-dash {
  display: block;
  width: 1px;
  height: 18px;
  background: var(--gold-dim);
  flex-shrink: 0;
  transition: height 0.35s ease, background 0.35s ease;
}
.spine-link:hover .spine-link-dash,
.spine-link:focus-visible .spine-link-dash {
  height: 28px;
  background: var(--gold);
}

.spine-link-label {
  display: block;
}

@media (max-width: 899px) {
  .spine { display: none; }
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
  padding: 0 clamp(50px, 8vw, 100px);
}

@media (max-width: 899px) {
  .center { padding: 0 24px; }
}

.center-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Subtitle */
.subtitle {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.6rem, 1.2vw, 0.72rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.8s ease 0.15s;
  margin-bottom: clamp(10px, 2vh, 20px);
}
.is-visible .subtitle { opacity: 0.38; }

/* Title — MASSIVE */
.title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2.8rem, 9vw, 6rem);
  font-weight: 400;
  letter-spacing: 0.3em;
  line-height: 1;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 1s ease 0.25s, transform 1s ease 0.25s;
}
.is-visible .title {
  opacity: 1;
  transform: translateY(0);
}

/* Ornament */
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

/* Motto */
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
   MOBILE NAV
   ============================ */
.mobile-nav {
  display: none;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 2;
  padding-bottom: clamp(6px, 1vh, 12px);
  opacity: 0;
  transition: opacity 0.8s ease 0.9s;
}
.is-visible .mobile-nav { opacity: 1; }

@media (max-width: 899px) {
  .mobile-nav { display: flex; }
}

.mnav-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.mnav-row--secondary {
  opacity: 0.7;
}

.mnav-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(10px, 2.5vw, 12px);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.3s, color 0.3s;
  padding: 4px 2px;
}
.mnav-link:hover, .mnav-link:active {
  opacity: 1;
  color: var(--gold);
}

.mnav-link--warm:hover, .mnav-link--warm:active { color: var(--terracotta); }

.mnav-link--muted {
  opacity: 0.3;
  cursor: default;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0.04em;
}

.mnav-sep {
  font-size: 8px;
  opacity: 0.2;
}

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

.footer-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.2vw, 10px);
}
.footer-sep { font-size: 7px; opacity: 0.4; }
.footer-btn {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.2vw, 10px);
  background: none; border: none; color: inherit;
  cursor: pointer; padding: 2px 4px;
  letter-spacing: 0.05em;
  transition: opacity 0.2s;
  display: inline-flex; align-items: center;
}
.footer-btn:hover { opacity: 1; }

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .title { font-size: clamp(1.8rem, 6vw, 3rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 379px) {
  .top-bar { top: 12px; right: 12px; }
  .top-btn { width: 36px; height: 36px; }
}
</style>
