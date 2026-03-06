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

const { login: doLogin, user } = useAuth()

if (user.value) {
  await navigateTo('/dashboard')
}

const lang = ref<'fr' | 'en'>('fr')
function toggleLang() { lang.value = lang.value === 'fr' ? 'en' : 'fr' }

const t = computed(() => lang.value === 'fr' ? {
  motto: 'L\u2019obscurite nourrit la flamme.',
  copyright: `\u00A9 ${new Date().getFullYear()} Le Geai`,
  entreprise: 'L\u2019entreprise',
  recrutement: 'Recrutement',
  poles: 'Nos poles',
  connecter: 'Se connecter',
  email: 'Email',
  motdepasse: 'Mot de passe',
  erreur: 'Email ou mot de passe incorrect',
  retour: 'Retour'
} : {
  motto: 'Darkness feeds the flame.',
  copyright: `\u00A9 ${new Date().getFullYear()} Le Geai`,
  entreprise: 'The company',
  recrutement: 'Careers',
  poles: 'Our branches',
  connecter: 'Sign in',
  email: 'Email',
  motdepasse: 'Password',
  erreur: 'Invalid email or password',
  retour: 'Back'
})

const polesOpen = ref(false)

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

// Login
const loginMode = ref(false)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function openLogin() {
  loginMode.value = true
  nextTick(() => {
    const input = document.querySelector('.login-panel input[type="email"]') as HTMLInputElement
    if (input) setTimeout(() => input.focus(), 600)
  })
}

function closeLogin() {
  loginMode.value = false
  error.value = ''
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await doLogin(email.value, password.value)
    await navigateTo('/dashboard')
  } catch {
    error.value = t.value.erreur
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="landing" :class="{ 'is-visible': visible, 'login-mode': loginMode }">

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

    <!-- Watermark — massive, animates to left on login -->
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

    <!-- ===== TOP-RIGHT : key ===== -->
    <header class="top-bar">
      <button class="top-btn top-btn--key" aria-label="Connexion" @click="openLogin">
        <UIcon name="i-lucide-key-round" class="size-4" />
      </button>
    </header>

    <!-- ===== CENTER ===== -->
    <div class="center">
      <div class="center-inner">
        <h1 class="title">
          <span class="title-main">Le</span>
          <span class="title-main">Geai</span>
          <span class="title-sub">groupe</span>
        </h1>

        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>

        <p class="motto">Obscuritas nutrit flammam.</p>
        <p class="motto-sub">{{ t.motto }}</p>

        <!-- ===== NAV — 3 items ===== -->
        <nav class="landing-nav" aria-label="Navigation">
          <NuxtLink to="/le-geai" class="nav-item">
            <span class="nav-numeral" aria-hidden="true">I</span>
            <span class="nav-label">{{ t.entreprise }}</span>
          </NuxtLink>

          <div class="nav-divider" aria-hidden="true" />

          <NuxtLink to="/recrutement" class="nav-item">
            <span class="nav-numeral" aria-hidden="true">II</span>
            <span class="nav-label">{{ t.recrutement }}</span>
          </NuxtLink>

          <div class="nav-divider" aria-hidden="true" />

          <div class="nav-item nav-item--poles" @click="polesOpen = !polesOpen">
            <span class="nav-numeral" aria-hidden="true">III</span>
            <span class="nav-label">{{ t.poles }}</span>
            <!-- Poles dropdown -->
            <div class="poles-dropdown" :class="{ 'is-open': polesOpen }">
              <a href="https://legeai-informatique.fr" target="_blank" rel="noopener noreferrer" class="pole-link">Informatique&thinsp;&#x2197;</a>
              <a href="https://bergfrid.com" target="_blank" rel="noopener noreferrer" class="pole-link">Medias&thinsp;&#x2197;</a>
              <span class="pole-link pole-link--muted">Edition</span>
            </div>
          </div>
        </nav>
      </div>
    </div>

    <!-- ===== FOOTER ===== -->
    <div class="footer-bar">
      <span class="footer-text">{{ t.copyright }}</span>
      <span class="footer-sep">&middot;</span>
      <button class="footer-btn" @click="toggleLang">{{ lang === 'fr' ? 'EN' : 'FR' }}</button>
    </div>

    <!-- ===== LOGIN PANEL ===== -->
    <div class="login-panel">
      <button class="login-back" @click="closeLogin" :aria-label="t.retour">
        <UIcon name="i-lucide-arrow-left" class="size-4" />
        <span>{{ t.retour }}</span>
      </button>

      <div class="login-form-wrap">
        <h2 class="login-title">{{ t.connecter }}</h2>
        <div class="login-ornament">
          <div class="login-ornament-line" />
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="login-field">
            <label class="login-label" for="login-email">{{ t.email }}</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="login-input"
              placeholder="votre@email.fr"
            />
          </div>

          <div class="login-field">
            <label class="login-label" for="login-password">{{ t.motdepasse }}</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="login-input"
              placeholder="••••••••"
            />
          </div>

          <p v-if="error" class="login-error">{{ error }}</p>

          <button type="submit" class="login-submit" :disabled="loading">
            <span v-if="loading" class="login-spinner" />
            <span v-else>{{ t.connecter }}</span>
          </button>
        </form>
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
  width: clamp(500px, 100vmin, 920px);
  height: clamp(500px, 100vmin, 920px);
  pointer-events: none; z-index: 0;
  transition: left var(--transition), width var(--transition), height var(--transition);
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

/* Login mode — logo slides left, half visible, full color */
.login-mode .watermark {
  left: 0;
  width: clamp(600px, 100vh, 1100px);
  height: clamp(600px, 100vh, 1100px);
}
.login-mode .watermark-img {
  opacity: 1;
  filter: none;
}
:global(.dark) .login-mode .watermark-img {
  opacity: 1;
  filter: none;
}

/* ============================
   FRAME
   ============================ */
.frame {
  position: fixed;
  inset: clamp(10px, 2.5vw, 22px);
  border: 1px solid var(--gold-faint);
  pointer-events: none; z-index: 0;
  transition: opacity var(--transition);
}
.login-mode .frame { opacity: 0.3; }

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
.login-mode .top-bar { opacity: 0; pointer-events: none; }

.top-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--gold);
  border-radius: 50%;
  color: var(--gold);
  background: transparent;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.3s, background 0.3s;
}
.top-btn:hover {
  opacity: 1;
  background: rgba(175, 143, 60, 0.1);
}
.top-btn:focus-visible {
  opacity: 1;
  outline: 1px solid var(--gold-dim);
  outline-offset: 3px;
}
:global(.dark) .top-btn:hover { background: rgba(175, 143, 60, 0.16); }

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
  padding: 0 24px;
  transition: opacity 1s ease, transform 1s ease;
}
.login-mode .center {
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

/* Title */
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

.title-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.7rem, 1.6vw, 0.95rem);
  letter-spacing: 0.35em;
  text-transform: uppercase;
  opacity: 0.35;
  margin-top: clamp(6px, 1.2vh, 12px);
  display: block;
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
   LANDING NAV — 3 items
   ============================ */
.landing-nav {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: clamp(28px, 5vh, 48px);
  opacity: 0;
  transition: opacity 1s ease 1s;
}
.is-visible .landing-nav { opacity: 1; }

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px clamp(18px, 3.5vw, 36px);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.nav-item:hover {
  transform: translateY(-3px);
}
.nav-item:focus-visible {
  outline: 1px solid var(--gold-dim);
  outline-offset: 4px;
}

/* Gold underline that grows from center on hover */
.nav-item::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 1px;
  background: var(--gold);
  transform: translateX(-50%);
  transition: width 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.nav-item:hover::after {
  width: 60%;
}

.nav-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(0.7rem, 1.4vw, 0.9rem);
  color: var(--gold);
  opacity: 0.4;
  letter-spacing: 0.05em;
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.nav-item:hover .nav-numeral {
  opacity: 1;
  transform: translateY(-1px);
}

.nav-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(11px, 1.4vw, 13px);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.55;
  transition: opacity 0.5s ease, color 0.5s ease;
  white-space: nowrap;
}
.nav-item:hover .nav-label {
  opacity: 1;
  color: var(--gold);
}

.nav-divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(180deg, transparent, var(--gold-dim), transparent);
  flex-shrink: 0;
}

/* Poles dropdown */
.nav-item--poles {
  user-select: none;
}

.poles-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 24px;
  background: var(--cream);
  border: 1px solid var(--gold-faint);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
  z-index: 30;
}
:global(.dark) .poles-dropdown {
  background: #1F2C23;
}
.poles-dropdown.is-open {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(8px);
}

.pole-link {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0.7;
  padding: 4px 0;
  white-space: nowrap;
  transition: opacity 0.2s;
}
.pole-link:hover { opacity: 1; }

.pole-link--muted {
  opacity: 0.3;
  color: inherit;
  cursor: default;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0.06em;
}

@media (max-width: 500px) {
  .nav-item {
    padding: 10px clamp(12px, 3vw, 20px);
  }
  .nav-label {
    font-size: 10px;
    letter-spacing: 0.14em;
  }
  .nav-divider { height: 24px; }
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
.login-mode .footer-bar { opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }

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
   LOGIN PANEL
   ============================ */
.login-panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 50%;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(24px, 4vw, 48px);
  opacity: 0;
  transform: translateX(60px);
  pointer-events: none;
  transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
}
.login-mode .login-panel {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.login-back {
  position: absolute;
  top: clamp(20px, 3.5vw, 36px);
  left: clamp(20px, 3vw, 40px);
  display: flex; align-items: center; gap: 8px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.7;
  background: none; border: none;
  cursor: pointer;
  transition: opacity 0.3s, gap 0.3s;
}
.login-back:hover { opacity: 1; gap: 12px; }

.login-form-wrap {
  width: 100%;
  max-width: 380px;
}

.login-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  font-weight: 400;
  letter-spacing: 0.15em;
  text-align: center;
  margin-bottom: 10px;
}

.login-ornament {
  display: flex; justify-content: center;
  margin-bottom: clamp(28px, 5vh, 48px);
}
.login-ornament-line {
  width: 50px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  opacity: 0.6;
}

.login-input {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 16px;
  letter-spacing: 0.02em;
  padding: 14px 18px;
  background: rgba(175, 143, 60, 0.04);
  border: 1px solid var(--gold-dim);
  border-radius: 0;
  color: inherit;
  outline: none;
  transition: border-color 0.3s, background 0.3s;
}
:global(.dark) .login-input {
  background: rgba(175, 143, 60, 0.06);
}
.login-input::placeholder {
  color: inherit;
  opacity: 0.3;
}
.login-input:focus {
  border-color: var(--gold);
  background: rgba(175, 143, 60, 0.08);
}

.login-error {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 14px;
  color: var(--terracotta);
  text-align: center;
}

.login-submit {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 14px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 16px 28px;
  background: var(--gold);
  border: 1px solid var(--gold);
  color: var(--cream);
  cursor: pointer;
  transition: background 0.3s, color 0.3s, opacity 0.3s;
  margin-top: 8px;
}
:global(.dark) .login-submit {
  color: var(--ink);
}
.login-submit:hover:not(:disabled) {
  background: transparent;
  color: var(--gold);
}
.login-submit:disabled {
  opacity: 0.5;
  cursor: wait;
}

.login-spinner {
  display: inline-block;
  width: 16px; height: 16px;
  border: 1.5px solid var(--gold-dim);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .title-main { font-size: clamp(2rem, 7vw, 3.5rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 899px) {
  .login-panel {
    width: 100%;
  }
  .login-mode .watermark {
    left: 50%;
    width: clamp(350px, 90vmin, 600px);
    height: clamp(350px, 90vmin, 600px);
  }
}

@media (max-width: 379px) {
  .top-bar { top: 12px; right: 12px; }
  .top-btn { width: 36px; height: 36px; }
}
</style>
