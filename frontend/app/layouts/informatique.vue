<script setup lang="ts">
// Layout sombre dedie a la sous-marque Le Geai Informatique.
// Theme scope a `.geai-info` pour ne pas alterer le reste du site (clair).
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400;1,500&display=swap',
    },
  ],
})

const navLinks = [
  { label: 'Création web', to: '/informatique/creation-web' },
  { label: 'Maintenance', to: '/informatique/maintenance-web' },
  { label: 'Portfolio', to: '/informatique/portfolio' },
  { label: 'Contact', to: '/informatique/contact' },
]

const year = new Date().getFullYear()
const mobileOpen = ref(false)
</script>

<template>
  <div class="geai-info">
    <a href="#geai-info-main" class="gi-skip">Aller au contenu</a>

    <header class="gi-header">
      <div class="gi-header-inner">
        <NuxtLink to="/informatique" class="gi-brand" @click="mobileOpen = false">
          <img src="/logo.svg" alt="" class="gi-brand-mark" />
          <span class="gi-brand-text">
            <span class="gi-brand-name">Le Geai</span>
            <span class="gi-brand-sub">Informatique</span>
          </span>
        </NuxtLink>

        <nav class="gi-nav" aria-label="Navigation Le Geai Informatique">
          <NuxtLink v-for="l in navLinks" :key="l.to" :to="l.to" class="gi-nav-link">{{ l.label }}</NuxtLink>
          <NuxtLink to="/" class="gi-nav-link gi-nav-link--muted">Le Geai ↗</NuxtLink>
        </nav>

        <button
          class="gi-burger"
          :aria-expanded="mobileOpen"
          aria-label="Menu"
          @click="mobileOpen = !mobileOpen"
        >
          <UIcon :name="mobileOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
        </button>
      </div>

      <transition name="gi-fade">
        <nav v-if="mobileOpen" class="gi-nav-mobile" aria-label="Navigation mobile">
          <NuxtLink v-for="l in navLinks" :key="l.to" :to="l.to" class="gi-nav-mobile-link" @click="mobileOpen = false">{{ l.label }}</NuxtLink>
          <NuxtLink to="/" class="gi-nav-mobile-link gi-nav-link--muted" @click="mobileOpen = false">Le Geai ↗</NuxtLink>
        </nav>
      </transition>
    </header>

    <main id="geai-info-main" class="gi-main">
      <slot />
    </main>

    <footer class="gi-footer">
      <div class="gi-footer-inner">
        <p class="gi-footer-motto">Obscuritas nutrit flammam.</p>
        <nav class="gi-footer-nav" aria-label="Pied de page">
          <NuxtLink to="/informatique/contact" class="gi-footer-link">Contact</NuxtLink>
          <NuxtLink to="/informatique/confidentialite" class="gi-footer-link">Confidentialité</NuxtLink>
          <NuxtLink to="/" class="gi-footer-link">Groupe Le Geai</NuxtLink>
        </nav>
        <p class="gi-footer-copy">© {{ year }} Le Geai · Micro-entreprise · TVA non applicable, art. 293 B du CGI</p>
      </div>
    </footer>
  </div>
</template>

<style>
/* ── Theme sombre, scope a .geai-info ─────────────────────────── */
.geai-info {
  --gi-noir: #1a1a1a;
  --gi-surface: #1a1a1a;
  --gi-surface-raised: #232220;
  --gi-surface-card: #2a2826;
  --gi-dore: #c9a961;
  --gi-dore-light: #d8bd7c;
  --gi-dore-brand: #8b6f2a;
  --gi-text: #f5f2ec;
  --gi-text-muted: rgba(245, 242, 236, 0.78);
  --gi-text-dim: rgba(245, 242, 236, 0.55);
  --gi-border: rgba(201, 169, 97, 0.22);
  --gi-border-hover: rgba(201, 169, 97, 0.42);
  --gi-serif: "EB Garamond", Garamond, Georgia, "Times New Roman", serif;

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gi-surface);
  color: var(--gi-text);
  font-family: var(--gi-serif);
  font-weight: 500;
  font-size: 19px;
  line-height: 1.65;
}

.geai-info ::selection { background: rgba(201, 169, 97, 0.28); color: #fff; }
.geai-info a { color: inherit; text-decoration: none; }
.geai-info h1, .geai-info h2, .geai-info h3, .geai-info h4 {
  font-family: var(--gi-serif);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.geai-info h1 { font-size: clamp(2.4rem, 5vw, 4rem); }
.geai-info h2 { font-size: clamp(1.8rem, 3.6vw, 2.6rem); }
.geai-info h3 { font-size: clamp(1.2rem, 2.2vw, 1.5rem); }

.gi-skip {
  position: absolute;
  top: -120%;
  left: 1rem;
  z-index: 200;
  padding: 0.6rem 1.2rem;
  background: var(--gi-dore);
  color: var(--gi-noir);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: top 0.2s ease;
}
.gi-skip:focus { top: 0.5rem; }

/* ── Header ─────────────────────────────────────────────────── */
.gi-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(26, 26, 26, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--gi-border);
}
.gi-header-inner {
  max-width: 1120px;
  margin-inline: auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.gi-brand { display: flex; align-items: center; gap: 0.7rem; }
.gi-brand-mark { width: 38px; height: 38px; }
.gi-brand-text { display: flex; flex-direction: column; line-height: 1.05; }
.gi-brand-name { font-size: 1.05rem; font-weight: 700; letter-spacing: 0.02em; }
.gi-brand-sub {
  font-size: 0.7rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gi-dore);
}
.gi-nav { display: flex; align-items: center; gap: 2rem; }
.gi-nav-link {
  font-size: 0.82rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gi-text-muted);
  position: relative;
  padding: 0.3rem 0;
  transition: color 0.3s ease;
}
.gi-nav-link::after {
  content: '';
  position: absolute;
  left: 0; bottom: 0;
  width: 0; height: 1px;
  background: var(--gi-dore);
  transition: width 0.3s ease;
}
.gi-nav-link:hover, .gi-nav-link.router-link-active { color: var(--gi-dore); }
.gi-nav-link:hover::after, .gi-nav-link.router-link-active::after { width: 100%; }
.gi-nav-link--muted { color: var(--gi-text-dim); }

.gi-burger { display: none; color: var(--gi-text); }

.gi-nav-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem 1.5rem 1.2rem;
  border-top: 1px solid var(--gi-border);
}
.gi-nav-mobile-link {
  padding: 0.7rem 0;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gi-text-muted);
}
.gi-nav-mobile-link:hover { color: var(--gi-dore); }

.gi-fade-enter-active, .gi-fade-leave-active { transition: opacity 0.2s ease; }
.gi-fade-enter-from, .gi-fade-leave-to { opacity: 0; }

/* ── Main ───────────────────────────────────────────────────── */
.gi-main { flex: 1; }

/* ── Footer ─────────────────────────────────────────────────── */
.gi-footer {
  border-top: 1px solid var(--gi-border);
  background: var(--gi-surface-raised);
  margin-top: 4rem;
}
.gi-footer-inner {
  max-width: 1120px;
  margin-inline: auto;
  padding: 2.5rem 1.5rem;
  text-align: center;
}
.gi-footer-motto {
  font-style: italic;
  color: var(--gi-dore);
  font-size: 1.1rem;
  margin-bottom: 1.2rem;
}
.gi-footer-nav { display: flex; justify-content: center; gap: 1.8rem; flex-wrap: wrap; margin-bottom: 1.2rem; }
.gi-footer-link {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gi-text-muted);
  transition: color 0.3s ease;
}
.gi-footer-link:hover { color: var(--gi-dore); }
.gi-footer-copy { font-size: 0.78rem; color: var(--gi-text-dim); }

/* ── Boutons partages (utilisables par les pages enfant) ──────── */
.geai-info .gi-btn-primary {
  display: inline-block;
  padding: 1rem 2.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gi-noir);
  background: var(--gi-dore);
  border: none;
  cursor: pointer;
  transition: opacity 0.3s ease;
}
.geai-info .gi-btn-primary:hover:not(:disabled) { opacity: 0.85; }
.geai-info .gi-btn-primary:disabled { opacity: 0.5; cursor: wait; }
.geai-info .gi-btn-ghost {
  display: inline-block;
  padding: 0.95rem 2rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gi-text);
  background: none;
  border: 1px solid var(--gi-border);
  cursor: pointer;
  transition: border-color 0.3s ease, color 0.3s ease;
}
.geai-info .gi-btn-ghost:hover { border-color: var(--gi-dore); color: var(--gi-dore); }

.geai-info .gi-container { max-width: 1120px; margin-inline: auto; padding-inline: 1.5rem; }
.geai-info .gi-container-narrow { max-width: 720px; margin-inline: auto; padding-inline: 1.5rem; }

@media (max-width: 800px) {
  .gi-nav { display: none; }
  .gi-burger { display: inline-flex; }
}
</style>
