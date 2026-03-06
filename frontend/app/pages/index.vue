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
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

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
  connexion: 'Connexion',
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
  connexion: 'Sign in',
  tooltip: 'Coming soon'
})

interface DiamondItem {
  key: string
  label: string
  icon: string
  to?: string
  href?: string
  disabled?: boolean
  accent?: 'gold' | 'terracotta'
}

const items = computed<DiamondItem[]>(() => [
  { key: 'identite', label: t.value.identite, icon: 'i-lucide-scroll-text', to: '/le-geai' },
  { key: 'editions', label: t.value.editions, icon: 'i-lucide-book-open', disabled: true },
  { key: 'informatique', label: t.value.informatique, icon: 'i-lucide-cpu', href: 'https://legeai-informatique.fr' },
  { key: 'bergfrid', label: t.value.bergfrid, icon: 'i-lucide-eye', href: 'https://bergfrid.com' },
  { key: 'recrutement', label: t.value.recrutement, icon: 'i-lucide-crown', to: '/recrutement' },
  { key: 'soutenir', label: t.value.soutenir, icon: 'i-lucide-flame', to: '/soutenir', accent: 'terracotta' },
  { key: 'connexion', label: t.value.connexion, icon: 'i-lucide-key-round', to: '/login', accent: 'gold' }
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

    <!-- Background watermark logo -->
    <div class="watermark" aria-hidden="true">
      <img src="/logo.svg" alt="" class="watermark-img" />
    </div>

    <!-- Gold frame -->
    <div class="frame" aria-hidden="true">
      <div class="corner corner--tl" />
      <div class="corner corner--tr" />
      <div class="corner corner--bl" />
      <div class="corner corner--br" />
    </div>

    <!-- ============ ZONE 1 : En-tete ============ -->
    <div class="zone zone--header">
      <img src="/logo.svg" alt="Le Geai" class="landing-logo" />
      <h1 class="landing-title">LE GEAI</h1>

      <!-- Ornamental divider -->
      <div class="ornament-divider">
        <div class="ornament-line" />
        <span class="ornament-glyph">G</span>
        <div class="ornament-line" />
      </div>

      <!-- Motto — prominent -->
      <p class="landing-motto">
        <span class="motto-latin">Obscuritas nutrit flammam.</span>
      </p>
      <p class="landing-motto-translation">
        {{ t.motto }}
      </p>
    </div>

    <!-- ============ ZONE 2 : Navigation losanges ============ -->
    <div class="zone zone--nav">
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
            <div class="diamond" :class="diamondVariant(item)">
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" :class="iconVariant(item)" />
              </div>
            </div>
          </a>

          <!-- Internal link diamond -->
          <NuxtLink v-else :to="item.to!" class="diamond-link">
            <div class="diamond" :class="diamondVariant(item)">
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" :class="iconVariant(item)" />
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
        <span class="footer-sep">&middot;</span>
        <button class="footer-btn" :aria-label="isDark ? 'Mode clair' : 'Mode sombre'" @click="isDark = !isDark">
          <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function diamondVariant(item: { accent?: string }) {
  return {
    'diamond--gold': item.accent === 'gold',
    'diamond--terracotta': item.accent === 'terracotta'
  }
}
function iconVariant(item: { accent?: string }) {
  return {
    'diamond-icon--terracotta': item.accent === 'terracotta'
  }
}
</script>

<style scoped>
/* ============================
   BASE & VARIABLES
   ============================ */
.landing {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.30);
  --gold-faint: rgba(175, 143, 60, 0.12);
  --terracotta: #B74D34;
  --cream: #F7F0DE;
  --green: #1F2C23;
  --deep: #0E150F;
  --ink: #2c2419;

  /* Diamond proportions — tall & slender (ratio ~1:1.45) */
  --d-w: clamp(34px, 7vw, 50px);
  --d-h: clamp(50px, 10.2vw, 72px);
  --d-cell: clamp(52px, 14vw, 76px);
  --d-gap: clamp(6px, 1.8vw, 18px);

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
  opacity: 0.025;
  mix-blend-mode: overlay;
}

:global(.dark) .noise-layer {
  opacity: 0.04;
}

.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(175, 143, 60, 0.04) 100%);
}

:global(.dark) .vignette {
  background: radial-gradient(ellipse at center, transparent 30%, rgba(14, 21, 15, 0.3) 100%);
}

/* ============================
   WATERMARK LOGO
   ============================ */
.watermark {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(280px, 65vmin, 560px);
  height: clamp(280px, 65vmin, 560px);
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
  opacity: 0.035;
}

:global(.dark) .watermark-img {
  filter: brightness(0) invert(0.92);
  opacity: 0.04;
}

/* ============================
   GOLD FRAME & CORNERS
   ============================ */
.frame {
  position: fixed;
  inset: clamp(8px, 2vw, 16px);
  border: 1px solid var(--gold-faint);
  pointer-events: none;
  z-index: 0;
}

.corner {
  position: absolute;
  width: 22px;
  height: 22px;
}

.corner--tl { top: -1px; left: -1px; border-top: 2px solid var(--gold-dim); border-left: 2px solid var(--gold-dim); }
.corner--tr { top: -1px; right: -1px; border-top: 2px solid var(--gold-dim); border-right: 2px solid var(--gold-dim); }
.corner--bl { bottom: -1px; left: -1px; border-bottom: 2px solid var(--gold-dim); border-left: 2px solid var(--gold-dim); }
.corner--br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--gold-dim); border-right: 2px solid var(--gold-dim); }

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
  padding-bottom: clamp(4px, 1vh, 14px);
}

.zone--nav {
  flex: 5 1 0%;
  justify-content: center;
  padding: 0 16px;
}

.zone--footer {
  flex: 0 0 auto;
  justify-content: center;
  padding: clamp(6px, 1.2vh, 14px) 0;
}

/* ============================
   ZONE 1 : HEADER
   ============================ */
.landing-logo {
  height: clamp(48px, 9vh, 100px);
  width: auto;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s;
}

.is-visible .landing-logo {
  opacity: 1;
  transform: translateY(0);
}

:global(.dark) .landing-logo {
  filter: brightness(0) invert(0.92);
}

.landing-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.4rem, 3.5vw, 2.4rem);
  font-weight: 400;
  letter-spacing: 0.3em;
  margin-top: clamp(6px, 1.2vh, 14px);
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.8s ease 0.35s, transform 0.8s ease 0.35s;
}

.is-visible .landing-title {
  opacity: 1;
  transform: translateY(0);
}

/* Ornamental divider with fraktur G */
.ornament-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: clamp(4px, 0.8vh, 10px);
  opacity: 0;
  transition: opacity 0.8s ease 0.5s;
}

.is-visible .ornament-divider {
  opacity: 0.5;
}

.ornament-line {
  width: clamp(20px, 5vw, 44px);
  height: 1px;
  background: var(--gold);
}

.ornament-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(0.85rem, 1.8vw, 1.2rem);
  color: var(--gold);
  line-height: 1;
}

/* Motto — prominent */
.landing-motto {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(0.95rem, 2.5vw, 1.25rem);
  text-align: center;
  margin-top: clamp(6px, 1.2vh, 14px);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s;
  letter-spacing: 0.04em;
}

.is-visible .landing-motto {
  opacity: 0.85;
  transform: translateY(0);
}

.motto-latin {
  color: var(--gold);
}

:global(.dark) .motto-latin {
  color: var(--gold);
}

.landing-motto-translation {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.65rem, 1.4vw, 0.8rem);
  text-align: center;
  margin-top: 2px;
  letter-spacing: 0.06em;
  opacity: 0;
  transition: opacity 0.8s ease 0.75s;
}

.is-visible .landing-motto-translation {
  opacity: 0.4;
}

/* ============================
   ZONE 2 : DIAMOND GRID
   ============================ */
.diamond-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--d-gap);
  max-width: calc(var(--d-cell) * 4 + var(--d-gap) * 3);
}

@media (max-width: 479px) {
  .diamond-grid {
    max-width: calc(var(--d-cell) * 3 + var(--d-gap) * 2);
  }
}

.diamond-cell {
  width: var(--d-cell);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.6s ease calc(0.8s + var(--i) * 0.07s),
              transform 0.6s ease calc(0.8s + var(--i) * 0.07s);
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
   DIAMOND SHAPE (clip-path rhombus)
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
    170deg,
    rgba(247, 240, 222, 0.8) 0%,
    rgba(247, 240, 222, 0.5) 100%
  );
  transition: background 0.3s ease;
}

:global(.dark) .diamond::after {
  background: linear-gradient(
    170deg,
    rgba(31, 44, 35, 0.95) 0%,
    rgba(31, 44, 35, 0.75) 100%
  );
}

/* Hover: intensify border, add drop-shadow glow */
.diamond-link:hover .diamond::before {
  background: var(--gold);
}

.diamond-link:hover .diamond {
  filter: drop-shadow(0 3px 10px rgba(175, 143, 60, 0.2));
}

:global(.dark) .diamond-link:hover .diamond {
  filter: drop-shadow(0 3px 12px rgba(175, 143, 60, 0.25));
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
}

.diamond-icon--terracotta {
  color: var(--terracotta);
}

/* ============================
   DIAMOND VARIANTS
   ============================ */

/* Disabled */
.diamond--disabled {
  opacity: 0.25;
}

.diamond--disabled::before {
  background: rgba(175, 143, 60, 0.15);
}

/* Gold (Connexion) */
.diamond--gold::before {
  background: var(--gold);
}

.diamond--gold::after {
  background: linear-gradient(
    170deg,
    rgba(175, 143, 60, 0.12) 0%,
    rgba(247, 240, 222, 0.7) 100%
  );
}

:global(.dark) .diamond--gold::after {
  background: linear-gradient(
    170deg,
    rgba(175, 143, 60, 0.2) 0%,
    rgba(31, 44, 35, 0.85) 100%
  );
}

/* Terracotta (Nous soutenir) */
.diamond--terracotta::before {
  background: rgba(183, 77, 52, 0.4);
}

.diamond-link:hover .diamond--terracotta::before {
  background: var(--terracotta);
}

.diamond-link:hover .diamond--terracotta {
  filter: drop-shadow(0 3px 10px rgba(183, 77, 52, 0.2));
}

/* ============================
   DIAMOND LABELS
   ============================ */
.diamond-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(8px, 1.5vw, 10.5px);
  text-align: center;
  white-space: nowrap;
  opacity: 0.4;
  transition: opacity 0.3s ease;
  letter-spacing: 0.02em;
}

.diamond-cell:hover .diamond-label {
  opacity: 1;
}

@media (max-width: 639px) {
  .diamond-label {
    opacity: 0.6;
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
  opacity: 0.35;
}

.footer-row:hover {
  opacity: 0.65;
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
   MOBILE-SPECIFIC
   ============================ */
@media (max-height: 640px) {
  .landing {
    --d-w: clamp(30px, 6.5vw, 42px);
    --d-h: clamp(42px, 9vw, 60px);
    --d-cell: clamp(46px, 12vw, 64px);
  }

  .landing-logo {
    height: clamp(36px, 7vh, 64px);
  }

  .landing-title {
    font-size: clamp(1.1rem, 3vw, 1.6rem);
  }

  .landing-motto {
    font-size: clamp(0.8rem, 2vw, 1rem);
  }
}

@media (max-width: 379px) {
  .landing {
    --d-w: 32px;
    --d-h: 46px;
    --d-cell: 50px;
    --d-gap: 6px;
  }
}
</style>
