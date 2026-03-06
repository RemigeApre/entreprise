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
      <svg width="100%" height="100%">
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>

    <!-- Vignette -->
    <div class="vignette" aria-hidden="true" />

    <!-- Gold frame -->
    <div class="frame" aria-hidden="true">
      <div class="corner corner--tl" />
      <div class="corner corner--tr" />
      <div class="corner corner--bl" />
      <div class="corner corner--br" />
    </div>

    <!-- ============ ZONE 1 : En-tete ============ -->
    <div class="zone zone--header">
      <!-- Logo -->
      <img
        src="/logo.svg"
        alt="Le Geai"
        class="landing-logo"
      />

      <!-- Title -->
      <h1 class="landing-title">LE GEAI</h1>

      <!-- Decorative divider with fraktur G -->
      <div class="ornament-divider">
        <div class="ornament-line" />
        <span class="ornament-glyph">G</span>
        <div class="ornament-line" />
      </div>

      <!-- Latin motto -->
      <p class="landing-motto">
        <em>Obscuritas nutrit flammam.</em>
        <br />
        <span class="motto-translation">{{ t.motto }}</span>
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
            <div
              class="diamond"
              :class="{
                'diamond--gold': item.accent === 'gold',
                'diamond--terracotta': item.accent === 'terracotta'
              }"
            >
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" />
              </div>
            </div>
          </a>

          <!-- Internal link diamond -->
          <NuxtLink
            v-else
            :to="item.to!"
            class="diamond-link"
          >
            <div
              class="diamond"
              :class="{
                'diamond--gold': item.accent === 'gold',
                'diamond--terracotta': item.accent === 'terracotta'
              }"
            >
              <div class="diamond-face">
                <UIcon :name="item.icon" class="diamond-icon" />
              </div>
            </div>
          </NuxtLink>

          <!-- Label -->
          <span class="diamond-label">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- ============ ZONE 3 : Pied de page ============ -->
    <div class="zone zone--footer">
      <div class="footer-row">
        <span class="footer-text">{{ t.copyright }}</span>
        <span class="footer-sep">&middot;</span>
        <button class="footer-btn" @click="toggleLang">
          {{ lang === 'fr' ? 'EN' : 'FR' }}
        </button>
        <span class="footer-sep">&middot;</span>
        <button class="footer-btn" :aria-label="isDark ? 'Mode clair' : 'Mode sombre'" @click="isDark = !isDark">
          <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-3" />
        </button>
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
  --gold-dim: rgba(175, 143, 60, 0.30);
  --gold-faint: rgba(175, 143, 60, 0.12);
  --terracotta: #B74D34;
  --cream: #F7F0DE;
  --green: #1F2C23;
  --deep: #0E150F;
  --ink: #2c2419;
  --d-size: clamp(46px, 8.5vw, 68px);
  --d-cell: clamp(62px, 16vw, 88px);
  --d-gap: clamp(8px, 2vw, 20px);

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
  background: radial-gradient(ellipse at center, transparent 35%, rgba(14, 21, 15, 0.25) 100%);
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
  padding-bottom: clamp(8px, 1.5vh, 16px);
}

.zone--nav {
  flex: 5 1 0%;
  justify-content: center;
}

.zone--footer {
  flex: 0 0 auto;
  justify-content: center;
  padding: clamp(8px, 1.5vh, 16px) 0;
}

/* ============================
   ZONE 1 : HEADER
   ============================ */
.landing-logo {
  height: clamp(56px, 10vh, 110px);
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
  font-size: clamp(1.6rem, 4vw, 2.6rem);
  font-weight: 400;
  letter-spacing: 0.3em;
  margin-top: clamp(8px, 1.5vh, 16px);
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
  margin-top: clamp(6px, 1vh, 12px);
  opacity: 0;
  transition: opacity 0.8s ease 0.5s;
}

.is-visible .ornament-divider {
  opacity: 0.5;
}

.ornament-line {
  width: clamp(24px, 6vw, 48px);
  height: 1px;
  background: var(--gold);
}

.ornament-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(0.9rem, 2vw, 1.3rem);
  color: var(--gold);
  line-height: 1;
}

/* Motto */
.landing-motto {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(0.7rem, 1.8vw, 0.9rem);
  text-align: center;
  line-height: 1.6;
  margin-top: clamp(6px, 1vh, 12px);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s;
}

.is-visible .landing-motto {
  opacity: 0.55;
  transform: translateY(0);
}

.motto-translation {
  font-size: 0.85em;
  opacity: 0.7;
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

@media (max-width: 639px) {
  .diamond-grid {
    max-width: calc(var(--d-cell) * 3 + var(--d-gap) * 2);
  }
}

.diamond-cell {
  width: var(--d-cell);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.6s ease calc(0.7s + var(--i) * 0.08s),
              transform 0.6s ease calc(0.7s + var(--i) * 0.08s);
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

/* Diamond shape */
.diamond {
  width: var(--d-size);
  height: var(--d-size);
  transform: rotate(45deg);
  border: 1px solid var(--gold-dim);
  background: linear-gradient(
    155deg,
    rgba(175, 143, 60, 0.07) 0%,
    rgba(175, 143, 60, 0.01) 100%
  );
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.06),
    inset -1px -1px 3px rgba(0, 0, 0, 0.06),
    0 1px 6px rgba(0, 0, 0, 0.06);
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
  position: relative;
}

:global(.dark) .diamond {
  background: linear-gradient(
    155deg,
    rgba(175, 143, 60, 0.10) 0%,
    rgba(175, 143, 60, 0.02) 100%
  );
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.03),
    inset -1px -1px 3px rgba(0, 0, 0, 0.15),
    0 1px 6px rgba(0, 0, 0, 0.15);
}

.diamond-link:hover .diamond {
  border-color: var(--gold);
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.08),
    inset -1px -1px 3px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(175, 143, 60, 0.12);
}

:global(.dark) .diamond-link:hover .diamond {
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.04),
    inset -1px -1px 3px rgba(0, 0, 0, 0.2),
    0 4px 16px rgba(175, 143, 60, 0.15);
}

/* Diamond face (counter-rotate to keep icon upright) */
.diamond-face {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-45deg);
}

.diamond-icon {
  width: clamp(18px, 3.5vw, 24px);
  height: clamp(18px, 3.5vw, 24px);
  color: var(--gold);
  transform: translate(0.5px, -0.5px); /* Slight offset for hand-crafted feel */
}

/* Diamond variants */
.diamond--disabled {
  opacity: 0.3;
  border-style: dashed;
}

.diamond--gold {
  border-color: var(--gold);
  background: linear-gradient(
    155deg,
    rgba(175, 143, 60, 0.14) 0%,
    rgba(175, 143, 60, 0.04) 100%
  );
}

:global(.dark) .diamond--gold {
  background: linear-gradient(
    155deg,
    rgba(175, 143, 60, 0.18) 0%,
    rgba(175, 143, 60, 0.06) 100%
  );
}

.diamond--terracotta .diamond-icon {
  color: var(--terracotta);
}

.diamond--terracotta {
  border-color: rgba(183, 77, 52, 0.35);
}

.diamond-link:hover .diamond--terracotta {
  border-color: var(--terracotta);
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.06),
    inset -1px -1px 3px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(183, 77, 52, 0.12);
}

/* Diamond label */
.diamond-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(9px, 1.6vw, 11px);
  text-align: center;
  white-space: nowrap;
  opacity: 0.45;
  transition: opacity 0.3s ease;
  letter-spacing: 0.02em;
}

.diamond-cell:hover .diamond-label {
  opacity: 1;
}

@media (max-width: 639px) {
  .diamond-label {
    opacity: 0.65;
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
  transition: opacity 0.8s ease 1.2s;
}

.is-visible .footer-row {
  opacity: 0.4;
}

.footer-row:hover {
  opacity: 0.7;
}

.footer-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(9px, 1.4vw, 11px);
}

.footer-sep {
  font-size: 8px;
  opacity: 0.4;
}

.footer-btn {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(9px, 1.4vw, 11px);
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
</style>
