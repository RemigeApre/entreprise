<script setup lang="ts">
const route = useRoute()

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

interface NavItem {
  label: string
  to?: string
}

const nav: NavItem[] = [
  { label: 'L\u2019entreprise', to: '/le-geai' },
  { label: 'Recrutement', to: '/recrutement' }
]

function isActive(item: NavItem) {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })
</script>

<template>
  <div class="public-layout" :class="{ 'is-visible': visible }">
    <!-- Noise filter -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="pub-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="pub-noise" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#pub-noise)" /></svg>
    </div>

    <!-- Vignette -->
    <div class="pub-vignette" aria-hidden="true" />

    <!-- Watermark (hidden on recrutement — has its own animated one) -->
    <div v-if="route.path !== '/recrutement'" class="pub-watermark" aria-hidden="true">
      <img src="/logo.svg" alt="" class="pub-watermark-img" />
    </div>

    <!-- Gold frame -->
    <div class="pub-frame" aria-hidden="true">
      <div class="pub-corner pub-corner--tl" />
      <div class="pub-corner pub-corner--tr" />
      <div class="pub-corner pub-corner--bl" />
      <div class="pub-corner pub-corner--br" />
      <div class="pub-frame-mark pub-frame-mark--top" />
      <div class="pub-frame-mark pub-frame-mark--bottom" />
    </div>

    <!-- Top bar -->
    <header class="pub-header">
      <NuxtLink to="/" class="pub-home" aria-label="Accueil">
        <span class="pub-home-glyph">G</span>
      </NuxtLink>

      <nav class="pub-nav" aria-label="Navigation">
        <template v-for="item in nav" :key="item.label">
          <NuxtLink
            v-if="item.to"
            :to="item.to"
            class="pub-nav-link"
            :class="{ 'is-active': isActive(item) }"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>

      <NuxtLink to="/" class="pub-back" aria-label="Retour">
        <span class="pub-back-arrow">&larr;</span>
        <span class="pub-back-label">Retour</span>
      </NuxtLink>
    </header>

    <!-- Content -->
    <main class="pub-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.public-layout {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.28);
  --gold-faint: rgba(175, 143, 60, 0.10);
  --cream: #F7F0DE;
  --ink: #2c2419;

  min-height: 100dvh;
  background-color: var(--cream);
  color: var(--ink);
  font-family: 'Crimson Pro', Georgia, serif;
  position: relative;
  transition: background-color 0.4s ease, color 0.4s ease;
}
:global(.dark) .public-layout {
  background-color: #1F2C23;
  color: var(--cream);
}

/* Noise */
.pub-noise {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
  opacity: 0.02; mix-blend-mode: overlay;
}
:global(.dark) .pub-noise { opacity: 0.035; }

/* Vignette */
.pub-vignette {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.15) 100%);
}
:global(.dark) .pub-vignette {
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.35) 100%);
}

/* Watermark */
.pub-watermark {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(400px, 60vw, 700px);
  height: clamp(400px, 60vw, 700px);
  pointer-events: none;
  z-index: 0;
}
.pub-watermark-img {
  width: 100%; height: 100%;
  object-fit: contain;
  opacity: 0.03;
}
:global(.dark) .pub-watermark-img {
  filter: brightness(0) invert(0.85);
  opacity: 0.04;
}

/* Frame */
.pub-frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
}
.pub-corner { position: absolute; width: 26px; height: 26px; }
.pub-corner--tl { top: -1px; left: -1px; border-top: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.pub-corner--tr { top: -1px; right: -1px; border-top: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }
.pub-corner--bl { bottom: -1px; left: -1px; border-bottom: 1.5px solid var(--gold-dim); border-left: 1.5px solid var(--gold-dim); }
.pub-corner--br { bottom: -1px; right: -1px; border-bottom: 1.5px solid var(--gold-dim); border-right: 1.5px solid var(--gold-dim); }
.pub-frame-mark { position: absolute; background: var(--gold-dim); }
.pub-frame-mark--top, .pub-frame-mark--bottom { width: 1px; height: 10px; left: 50%; transform: translateX(-50%); }
.pub-frame-mark--top { top: -1px; }
.pub-frame-mark--bottom { bottom: -1px; }

/* Header */
.pub-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(14px, 2.5vh, 24px) clamp(28px, 5vw, 56px);
  opacity: 0;
  transition: opacity 0.8s ease 0.2s;
}
.is-visible .pub-header { opacity: 1; }

.pub-home {
  display: flex; align-items: center;
  text-decoration: none;
}
.pub-home-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.6rem;
  color: var(--gold);
  opacity: 0.4;
  line-height: 1;
  transition: opacity 0.3s;
}
.pub-home:hover .pub-home-glyph { opacity: 0.8; }

.pub-nav {
  display: flex; align-items: center; gap: 40px;
}
.pub-nav-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: none;
  color: inherit;
  opacity: 0.4;
  padding: 4px 0;
  position: relative;
  transition: opacity 0.3s, letter-spacing 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.pub-nav-link:hover { opacity: 0.8; letter-spacing: 0.28em; }
.pub-nav-link.is-active { opacity: 1; color: var(--gold); }
.pub-nav-link.is-active::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.pub-back {
  text-decoration: none;
  color: var(--gold);
  opacity: 0.5;
  transition: opacity 0.3s, gap 0.3s;
  display: flex; align-items: center;
  gap: 6px;
}
.pub-back:hover { opacity: 1; gap: 10px; }
.pub-back-arrow {
  font-size: 14px;
  transition: transform 0.3s;
}
.pub-back:hover .pub-back-arrow { transform: translateX(-2px); }
.pub-back-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* Content */
.pub-content {
  position: relative;
  z-index: 1;
  padding-bottom: 40px;
}
</style>

<style>
html:has(.public-layout) {
  background-color: #F7F0DE;
  transition: background-color 0.4s ease;
}
html.dark:has(.public-layout) {
  background-color: #1F2C23;
}
</style>
