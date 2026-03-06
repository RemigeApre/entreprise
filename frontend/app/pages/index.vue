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

/* ---- Theme toggle (robust) ---- */
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

/* ---- Language ---- */
const lang = ref<'fr' | 'en'>('fr')
function toggleLang() { lang.value = lang.value === 'fr' ? 'en' : 'fr' }

const t = computed(() => lang.value === 'fr' ? {
  motto: 'L\u2019obscurite nourrit la flamme.',
  copyright: `\u00A9 ${new Date().getFullYear()} Groupe Le Geai`,
  identite: 'Notre identite',
  editions: 'Editions',
  informatique: 'Informatique',
  bergfrid: 'Bergfrid',
  recrutement: 'Recrutement',
  soutenir: 'Nous soutenir',
  tooltip: 'En construction'
} : {
  motto: 'Darkness feeds the flame.',
  copyright: `\u00A9 ${new Date().getFullYear()} Groupe Le Geai`,
  identite: 'Our identity',
  editions: 'Publishing',
  informatique: 'Tech',
  bergfrid: 'Bergfrid',
  recrutement: 'Careers',
  soutenir: 'Support us',
  tooltip: 'Coming soon'
})

/* ---- Diamond items (6 — connexion moved to header) ---- */
interface DiamondItem {
  key: string
  label: string
  icon: string
  to?: string
  href?: string
  disabled?: boolean
  accent?: 'terracotta'
}

const items = computed<DiamondItem[]>(() => [
  { key: 'identite', label: t.value.identite, icon: 'i-lucide-scroll-text', to: '/le-geai' },
  { key: 'editions', label: t.value.editions, icon: 'i-lucide-book-open', disabled: true },
  { key: 'informatique', label: t.value.informatique, icon: 'i-lucide-cpu', href: 'https://legeai-informatique.fr' },
  { key: 'bergfrid', label: t.value.bergfrid, icon: 'i-lucide-eye', href: 'https://bergfrid.com' },
  { key: 'recrutement', label: t.value.recrutement, icon: 'i-lucide-crown', to: '/recrutement' },
  { key: 'soutenir', label: t.value.soutenir, icon: 'i-lucide-flame', to: '/soutenir', accent: 'terracotta' }
])

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
      <!-- Center marks on frame edges -->
      <div class="frame-mark frame-mark--top" />
      <div class="frame-mark frame-mark--bottom" />
      <div class="frame-mark frame-mark--left" />
      <div class="frame-mark frame-mark--right" />
    </div>

    <!-- ============ TOP BAR : Connexion + Theme ============ -->
    <header class="top-bar">
      <NuxtLink to="/login" class="top-icon" aria-label="Connexion">
        <UIcon name="i-lucide-key-round" class="size-3.5" />
      </NuxtLink>
      <button class="top-icon" :aria-label="isDark ? 'Mode clair' : 'Mode sombre'" @click="toggleTheme">
        <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-3.5" />
      </button>
    </header>

    <!-- ============ ZONE 1 : En-tete ============ -->
    <div class="zone zone--header">
      <h1 class="landing-title">LE GEAI</h1>

      <!-- Ornamental divider -->
      <div class="ornament-divider">
        <div class="ornament-line" />
        <span class="ornament-glyph">G</span>
        <div class="ornament-line" />
      </div>

      <!-- Motto — prominent, golden -->
      <p class="landing-motto">
        <span class="motto-latin">Obscuritas nutrit flammam.</span>
      </p>
      <p class="landing-motto-sub">{{ t.motto }}</p>
    </div>

    <!-- ============ ZONE 2 : Navigation losanges ============ -->
    <div class="zone zone--nav">
      <!-- Small ornament above diamonds -->
      <div class="nav-ornament">
        <div class="nav-ornament-dot" />
        <div class="nav-ornament-line" />
        <div class="nav-ornament-dot" />
      </div>

      <div class="diamond-grid">
        <div
          v-for="(item, idx) in items"
          :key="item.key"
          class="diamond-cell"
          :style="{ '--i': idx }"
        >
          <!-- Disabled diamond -->
          <UTooltip v-if="item.disabled" :text="t.tooltip" :delay-duration="200">
            <div class="diamond-link diamond-link--disabled">
              <div class="diamond diamond--disabled">
                <div class="diamond-face">
                  <UIcon :name="item.icon" class="diamond-icon" />
                </div>
              </div>
            </div>
          </UTooltip>

          <!-- External link diamond -->
          <a
            v-else-if="item.href"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="diamond-link"
          >
            <div class="diamond" :class="{ 'diamond--terracotta': item.accent === 'terracotta' }">
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" :class="{ 'diamond-icon--terracotta': item.accent === 'terracotta' }" />
              </div>
            </div>
          </a>

          <!-- Internal link diamond -->
          <NuxtLink v-else :to="item.to!" class="diamond-link">
            <div class="diamond" :class="{ 'diamond--terracotta': item.accent === 'terracotta' }">
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" :class="{ 'diamond-icon--terracotta': item.accent === 'terracotta' }" />
              </div>
            </div>
          </NuxtLink>

          <span class="diamond-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

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
   BASE & VARIABLES
   ============================ */
.landing {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  --terracotta: #B74D34;
  --cream: #F7F0DE;
  --green: #1F2C23;
  --deep: #0E150F;
  --ink: #2c2419;

  /* Diamond proportions — tall & slender (ratio ~1:1.45) */
  --d-w: clamp(36px, 7.5vw, 52px);
  --d-h: clamp(52px, 10.8vw, 76px);
  --d-cell: clamp(58px, 15vw, 92px);
  --d-gap: clamp(8px, 2.5vw, 28px);

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
   NOISE & VIGNETTE
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
   WATERMARK LOGO — IMPOSING
   ============================ */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(360px, 88vmin, 720px);
  height: clamp(360px, 88vmin, 720px);
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.watermark-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.04;
  transition: opacity 0.4s ease, filter 0.4s ease;
}

:global(.dark) .watermark-img {
  filter: brightness(0) invert(0.9);
  opacity: 0.045;
}

/* ============================
   GOLD FRAME & CORNERS
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

/* Small cross marks at center of each frame edge */
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
   TOP BAR : Connexion + Theme
   ============================ */
.top-bar {
  position: fixed;
  top: clamp(16px, 3.5vw, 28px);
  left: clamp(16px, 3.5vw, 28px);
  z-index: 10;
  display: flex;
  gap: 8px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.8s ease 0.3s;
}

.is-visible .top-bar {
  opacity: 1;
}

.top-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gold-faint);
  border-radius: 50%;
  color: var(--gold-dim);
  background: transparent;
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease;
}

.top-icon:hover {
  color: var(--gold);
  border-color: var(--gold-dim);
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
  padding-bottom: clamp(6px, 1.2vh, 16px);
}

.zone--nav {
  flex: 5 1 0%;
  justify-content: center;
  padding: 0 16px;
  gap: clamp(8px, 1.5vh, 16px);
}

.zone--footer {
  flex: 0 0 auto;
  justify-content: center;
  padding: clamp(8px, 1.5vh, 16px) 0;
}

/* ============================
   ZONE 1 : HEADER (no small logo)
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

/* Ornamental divider with fraktur G */
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

/* Motto — prominent, golden */
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
  font-size: clamp(0.65rem, 1.4vw, 0.8rem);
  text-align: center;
  margin-top: 3px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.8s ease 0.8s;
}

.is-visible .landing-motto-sub {
  opacity: 0.35;
}

/* ============================
   NAV ORNAMENT (above diamonds)
   ============================ */
.nav-ornament {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.6s ease 0.7s;
}

.is-visible .nav-ornament {
  opacity: 0.3;
}

.nav-ornament-dot {
  width: 3px;
  height: 3px;
  background: var(--gold);
  border-radius: 50%;
}

.nav-ornament-line {
  width: clamp(16px, 4vw, 32px);
  height: 1px;
  background: var(--gold);
  opacity: 0.5;
}

/* ============================
   ZONE 2 : DIAMOND GRID (3+3)
   ============================ */
.diamond-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--d-gap);
  max-width: calc(var(--d-cell) * 3 + var(--d-gap) * 2);
}

.diamond-cell {
  width: var(--d-cell);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease calc(0.85s + var(--i) * 0.08s),
              transform 0.6s ease calc(0.85s + var(--i) * 0.08s);
}

.is-visible .diamond-cell {
  opacity: 1;
  transform: translateY(0);
}

/* Diamond link wrapper (handles hover lift) */
.diamond-link {
  display: block;
  transition: transform 0.3s ease;
}

.diamond-link:hover {
  transform: translateY(-4px);
}

.diamond-link--disabled {
  cursor: not-allowed;
}

.diamond-link--disabled:hover {
  transform: none;
}

/* ============================
   DIAMOND SHAPE (clip-path rhombus — tall & elegant)
   ============================ */
.diamond {
  position: relative;
  width: var(--d-w);
  height: var(--d-h);
  transition: filter 0.3s ease;
}

/* Border layer */
.diamond::before {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  background: var(--gold-dim);
  transition: background 0.3s ease;
}

/* Fill layer */
.diamond::after {
  content: '';
  position: absolute;
  inset: 0;
  clip-path: polygon(50% 1.8%, 98.2% 50%, 50% 98.2%, 1.8% 50%);
  background: linear-gradient(
    175deg,
    rgba(247, 240, 222, 0.85) 0%,
    rgba(240, 232, 210, 0.55) 100%
  );
  transition: background 0.4s ease;
}

:global(.dark) .diamond::after {
  background: linear-gradient(
    175deg,
    rgba(35, 50, 40, 0.95) 0%,
    rgba(28, 40, 32, 0.75) 100%
  );
}

/* Hover */
.diamond-link:hover .diamond::before {
  background: var(--gold);
}

.diamond-link:hover .diamond {
  filter: drop-shadow(0 3px 12px rgba(175, 143, 60, 0.18));
}

:global(.dark) .diamond-link:hover .diamond {
  filter: drop-shadow(0 3px 14px rgba(175, 143, 60, 0.25));
}

/* Diamond face (icon container) */
.diamond-face {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diamond-icon {
  width: clamp(16px, 3.2vw, 22px);
  height: clamp(16px, 3.2vw, 22px);
  color: var(--gold);
  transform: translate(0.5px, -0.5px);
  transition: color 0.3s ease;
}

.diamond-icon--terracotta {
  color: var(--terracotta);
}

/* ============================
   DIAMOND VARIANTS
   ============================ */

/* Disabled */
.diamond--disabled {
  opacity: 0.22;
}

.diamond--disabled::before {
  background: rgba(175, 143, 60, 0.15);
}

/* Terracotta (Nous soutenir) */
.diamond--terracotta::before {
  background: rgba(183, 77, 52, 0.35);
}

.diamond-link:hover .diamond--terracotta::before {
  background: var(--terracotta);
}

.diamond-link:hover .diamond--terracotta {
  filter: drop-shadow(0 3px 12px rgba(183, 77, 52, 0.2));
}

/* ============================
   DIAMOND LABELS
   ============================ */
.diamond-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.6vw, 10.5px);
  text-align: center;
  white-space: nowrap;
  opacity: 0.35;
  transition: opacity 0.3s ease;
  letter-spacing: 0.03em;
}

.diamond-cell:hover .diamond-label {
  opacity: 1;
}

@media (max-width: 639px) {
  .diamond-label {
    opacity: 0.55;
    font-size: clamp(8px, 2.5vw, 10px);
  }
}

/* ============================
   ZONE 3 : FOOTER
   ============================ */
.footer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.8s ease 1.3s;
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
@media (max-height: 640px) {
  .landing {
    --d-w: clamp(28px, 6vw, 40px);
    --d-h: clamp(40px, 8.5vw, 58px);
    --d-cell: clamp(44px, 12vw, 62px);
  }

  .landing-title {
    font-size: clamp(1.2rem, 3vw, 1.8rem);
  }

  .landing-motto {
    font-size: clamp(0.85rem, 2vw, 1rem);
  }
}

@media (max-width: 379px) {
  .landing {
    --d-w: 30px;
    --d-h: 44px;
    --d-cell: 48px;
    --d-gap: 6px;
  }

  .top-bar {
    top: 10px;
    left: 10px;
  }

  .top-icon {
    width: 28px;
    height: 28px;
  }
}
</style>
