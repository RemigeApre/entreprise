<script setup lang="ts">
const route = useRoute()

interface NavItem {
  label: string
  to?: string
  href?: string
  disabled?: boolean
}

const nav: NavItem[] = [
  { label: 'L\u2019entreprise', to: '/le-geai' },
  { label: 'Recrutement', to: '/recrutement' }
]

function isActive(item: NavItem) {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}
</script>

<template>
  <div class="public-layout">
    <!-- Noise -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="pub-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="pub-noise" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#pub-noise)" /></svg>
    </div>

    <!-- Top bar -->
    <header class="pub-header">
      <NuxtLink to="/" class="pub-home" aria-label="Accueil">
        <img src="/logo.svg" alt="" class="pub-home-logo" />
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

/* Header */
.pub-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px clamp(20px, 4vw, 48px);
  background: linear-gradient(180deg, var(--cream) 60%, transparent);
  transition: background 0.4s ease;
}
:global(.dark) .pub-header {
  background: linear-gradient(180deg, #1F2C23 60%, transparent);
}

.pub-home {
  display: flex; align-items: center;
}
.pub-home-logo {
  width: 28px; height: 28px;
  opacity: 0.15;
  transition: opacity 0.3s;
}
.pub-home:hover .pub-home-logo { opacity: 0.4; }
:global(.dark) .pub-home-logo {
  filter: brightness(0) invert(0.85);
}

.pub-nav {
  display: flex; align-items: center; gap: 32px;
}
.pub-nav-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: inherit;
  opacity: 0.4;
  padding: 4px 0;
  position: relative;
  transition: opacity 0.3s;
}
.pub-nav-link:hover { opacity: 0.8; }
.pub-nav-link.is-active { opacity: 1; color: var(--gold); }
.pub-nav-link.is-active::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 1px;
  background: var(--gold);
}

.pub-back {
  text-decoration: none;
  color: var(--gold);
  opacity: 0.5;
  transition: opacity 0.3s;
  display: flex; align-items: center;
}
.pub-back:hover { opacity: 1; }
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
