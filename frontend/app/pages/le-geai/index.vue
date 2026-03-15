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
  title: 'L\u2019entreprise - Le Geai',
  description: 'Découvrez les valeurs, la vision et les pôles du groupe Le Geai.',
  ogTitle: 'Le Geai - L\u2019entreprise',
  ogDescription: 'Un groupe fondé sur l\u2019exigence, la créativité et l\u2019accessibilité.'
})

const visible = ref(false)
const revealed = ref(false)

const deviseHover = ref(false)
const deviseOpen = ref(false)
const deviseX = ref(0)
const deviseY = ref(0)
const isMobile = ref(false)

function onDeviseMove(e: MouseEvent) {
  deviseX.value = e.clientX
  deviseY.value = e.clientY
}

function onDeviseClick() {
  if (isMobile.value) deviseOpen.value = !deviseOpen.value
}

const panelRef = ref<HTMLElement | null>(null)

function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  requestAnimationFrame(() => {
    visible.value = true
    setTimeout(() => { revealed.value = true }, 1200)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function goBack() {
  revealed.value = false
  setTimeout(() => { navigateTo('/') }, 1400)
}

function scrollToTop() {
  panelRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const values = [
  { numeral: 'I', title: 'Exigence', text: 'Un bon artiste transforme tout ce qu\u2019il expérimente pour y insuffler son âme. Retirer un de ces deux critères et vous avez un médiocre. Cette règle s\u2019applique à tout ce qui porte le nom Le Geai.', color: '#AF8F3C' },
  { numeral: 'II', title: 'Accessibilité', text: 'L\u2019art n\u2019appartient pas aux musées ni aux prix absurdes. Il appartient aux bureaux, aux ateliers, aux foyers. Nous refusons de fermer la porte aux petits budgets, à ceux qui pensent que l\u2019art n\u2019est pas pour eux.', color: '#6B8F71' },
  { numeral: 'III', title: 'Transparence', text: 'Nous publions nos comptes. Chiffre d\u2019affaires, charges, résultat. Nous disons quand nous galérons. Le mensonge est plus coûteux que la vérité.', color: '#8B6F4E' },
  { numeral: 'IV', title: 'Transmission', text: 'Nous prenons des stagiaires, le maximum légal, toute l\u2019année. Donner sa chance à quelqu\u2019un qui débute ou qui recommence, c\u2019est un devoir, pas une variable d\u2019ajustement.', color: '#7A6A8A' }
]

const engagements = [
  { title: 'Envers nos stagiaires', text: 'Un vrai travail, un vrai portfolio, une vraie lettre de recommandation pour ceux qui le méritent. Pas un stage café-photocopieuse. Étudiants en formation, personnes en réinsertion : la compétence et la volonté ne regardent pas d\u2019où l\u2019on vient.' },
  { title: 'Envers nos futurs employés', text: 'La compétence est le seul critère. Ceux qui sont bons passent en alternance, puis en poste fixe. On valorise et on garde ceux qui font du bon travail. C\u2019est la promesse.' },
  { title: 'Envers l\u2019art', text: 'Chaque euro gagné par Le Geai Informatique finance Le Geai Éditions. Nos livres sont vendus à prix réduit aux entreprises et aux CSE. L\u2019art dans un bureau n\u2019est pas un luxe, c\u2019est un acte.' },
  { title: 'Envers nos clients', text: 'Nos sites web sont conçus avec empathie. Se mettre à la place de chaque visiteur, faire preuve d\u2019une empathie réelle et pratique : ça ne se génère pas, ça se travaille.' }
]

const links = [
  { icon: 'i-lucide-feather', title: 'Nos articles', sub: 'Réflexions et actualités du groupe', to: '/articles' },
  { icon: 'i-lucide-pie-chart', title: 'Transparence financière', sub: 'Nos comptes, en toute clarté', to: '/le-geai/transparence' }
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

    <!-- Watermark -->
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

    <!-- CENTER - fades out -->
    <div class="center">
      <div class="center-inner">
        <h1 class="title">
          <span class="title-main">L'entreprise</span>
        </h1>
        <div class="ornament">
          <div class="ornament-line" />
          <span class="ornament-glyph">G</span>
          <div class="ornament-line" />
        </div>
        <p class="motto">Obscuritas nutrit flammam.</p>
        <p class="motto-sub">L'obscurité nourrit la flamme.</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <span class="footer-text">&copy; {{ new Date().getFullYear() }} Groupe Le Geai</span>
    </div>

    <!-- ==============================
         PANEL
         ============================== -->
    <!-- Back button outside panel so position:fixed works -->
    <button class="panel-back" :class="{ 'is-shown': revealed }" @click="goBack">
      <UIcon name="i-lucide-arrow-left" class="size-4 back-arrow" />
      <span>Retour à l'accueil</span>
    </button>

    <div ref="panelRef" class="valeurs-panel">
      <div class="panel-content">

        <!-- 0. PRESENTATION -->
        <div class="manifesto">
          <p class="manifesto-lead">Le Geai est une flamme.</p>
          <p>Né d'un refus : celui de plier face à la médiocrité et l'avarice. Nous ne venons pas d'un business plan, pas d'une étude de marché, ni même d'un incubateur. Nous venons de l'ambition et de la révolte.</p>
          <p>Nous ne vendons pas des livres, nous ouvrons des portes. Nous ne faisons pas des sites, nous créons des espaces sains et fiables. Nous ne diffusons pas du bruit, nous cherchons la vérité.</p>
          <p>Nous accueillons ceux qui en veulent plus. Les clients qui en ont assez du médiocre. Les artistes qui refusent de se vendre. Les esprits qui brûlent et qui n'ont pas encore trouvé où poser leur feu.</p>
          <p class="manifesto-closing">Si vous êtes tièdes, passez votre chemin. Nous ne sommes pas faits pour les tièdes. Si quelque chose brûle en vous : entrez. La porte est ouverte. La bougie est allumée.</p>
        </div>

        <!-- DEVISE - hover on desktop, click on mobile -->
        <div
          class="devise-zone"
          :class="{ 'is-open': deviseOpen }"
          @mouseenter="!isMobile && (deviseHover = true)"
          @mouseleave="!isMobile && (deviseHover = false)"
          @mousemove="!isMobile && onDeviseMove($event)"
          @click="onDeviseClick"
        >
          <div class="devise-ornament">
            <div class="devise-line" />
            <span class="devise-glyph">G</span>
            <div class="devise-line" />
          </div>
          <p class="devise-latin">Obscuritas nutrit flammam.</p>
          <p class="devise-fr">L'obscurité nourrit la flamme.</p>
          <p class="devise-hint">Touchez pour découvrir le sens</p>

          <!-- Mobile inline explanation -->
          <Transition name="devise-expand">
            <div v-if="deviseOpen" class="devise-inline">
              <p>Ce n'est pas un slogan. C'est une devise, en latin et en français, car elle porte en son cœur un héritage.</p>
              <p>Dans l'obscurité d'une modernité où le sens disparaît et où l'exigence s'envole, nous portons les dernières flammes. Cette flamme, notre flamme, brûle de l'obscurité. Elle s'en nourrit. Plus le monde s'assombrit, plus la flamme grandit.</p>
            </div>
          </Transition>
        </div>

        <!-- Tooltip overlay (desktop only) -->
        <Teleport to="body">
          <Transition name="tooltip">
            <div
              v-if="deviseHover && !isMobile"
              class="devise-tooltip"
              :style="{ left: deviseX + 20 + 'px', top: deviseY + 16 + 'px' }"
            >
              <p>Ce n'est pas un slogan. C'est une devise, en latin et en français, car elle porte en son cœur un héritage.</p>
              <p>Dans l'obscurité d'une modernité où le sens disparaît et où l'exigence s'envole, nous portons les dernières flammes. Cette flamme, notre flamme, brûle de l'obscurité. Elle s'en nourrit. Plus le monde s'assombrit, plus la flamme grandit.</p>
            </div>
          </Transition>
        </Teleport>

        <!-- 2. VALEURS -->
        <div class="section-separator" />
        <h2 class="section-title-big">Nos valeurs</h2>

        <div class="valeurs-grid">
          <div
            v-for="(val, i) in values"
            :key="val.title"
            class="valeur-card"
            :style="{ transitionDelay: `${1800 + i * 150}ms`, '--card-color': val.color }"
          >
            <span class="valeur-numeral">{{ val.numeral }}</span>
            <h3 class="valeur-title">{{ val.title }}</h3>
            <p class="valeur-text">{{ val.text }}</p>
          </div>
        </div>

        <!-- 3. HISTOIRE - grosse carte -->
        <div class="section-separator" />
        <h2 class="section-title-big">Notre histoire</h2>

        <div class="histoire-card">
          <p>En 2024, un éditeur a qualifié nos textes de &laquo;&nbsp;remarquables&nbsp;&raquo;. Puis il a refusé de les publier. Le format ne se vendait pas. Les lecteurs lents ne l'intéressaient pas. Nos histoires n'étaient, selon lui, que des &laquo;&nbsp;états d'âme&nbsp;&raquo; sans valeur marchande.</p>
          <p>Ce jour-là, une chose est devenue claire : nous ne voulions pas être publiés par des gens qui méprisent leurs lecteurs. Nous ne voulions pas financer des structures qui impriment sans respect pour l'humain ni la nature.</p>
          <p>Alors Le Geai est né. Légalement en 2021, concrètement en 2024 avec la publication du premier livre, et officiellement en 2025 comme maison d'édition. La vraie naissance est antérieure : celle d'un enfant qui écrivait parce que c'était vital, pas parce que c'était un métier.</p>
        </div>

        <!-- 4. BRANCHES - bien separees -->
        <div class="section-separator" />
        <h2 class="section-title-big">Trois branches, une seule maison</h2>

        <div class="branches-grid">
          <!-- Editions -->
          <article class="branch-card" style="--card-color: #AF8F3C">
            <div class="branch-header">
              <span class="branch-numeral">I</span>
              <h3 class="branch-title">Le Geai Éditions</h3>
            </div>
            <p class="branch-text">Maison d'édition spécialisée en dark fantasy et romantisme. Nous publions des œuvres exigeantes, imprimées dignement, accessibles à tous ceux qui veulent lire. Le livre n'est pas un objet de consommation. C'est une porte vers les profondeurs de l'âme de l'auteur.</p>
          </article>

          <!-- Informatique + reductions -->
          <article class="branch-card" style="--card-color: #6B8F71">
            <div class="branch-header">
              <span class="branch-numeral">II</span>
              <h3 class="branch-title">Le Geai Informatique</h3>
            </div>
            <p class="branch-text">Développement web, data engineering, support informatique. Notre métier n'est pas de faire des sites : c'est de tracer des sentiers. Simplifier, alléger, rendre chaque utilisation agréable. Le meilleur site est celui où l'on ne remarque jamais qu'il a été conçu.</p>
            <div class="branch-tarifs">
              <div class="tarif-item">
                <span class="tarif-pct">-20 %</span>
                <span class="tarif-label">Santé et environnement</span>
              </div>
              <div class="tarif-item">
                <span class="tarif-pct">-30 %</span>
                <span class="tarif-label">Associations et ONG</span>
              </div>
            </div>
          </article>

          <!-- Bergfrid -->
          <article class="branch-card" style="--card-color: #8B6F4E">
            <div class="branch-header">
              <span class="branch-numeral">III</span>
              <h3 class="branch-title">Bergfrid</h3>
            </div>
            <p class="branch-text">Média géopolitique indépendant. Des faits, du contexte, des sources contradictoires. Nous ne commentons pas l'actualité : nous donnons les éléments pour que nos lecteurs pensent par eux-mêmes. La vérité, pas le commentaire.</p>
          </article>
        </div>

        <!-- 5. ENGAGEMENTS - elegant -->
        <div class="section-separator" />
        <h2 class="section-title-big">Nos engagements</h2>

        <div class="engagements-grid">
          <article
            v-for="(e, i) in engagements"
            :key="e.title"
            class="eng-item"
          >
            <span class="eng-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <div class="eng-body">
              <h3 class="eng-title">{{ e.title }}</h3>
              <p class="eng-text">{{ e.text }}</p>
            </div>
          </article>
        </div>

        <!-- LIENS -->
        <div class="section-separator" />
        <div class="links-row">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="link-card"
          >
            <span class="link-icon">
              <UIcon :name="l.icon" class="size-4" />
            </span>
            <span class="link-content">
              <span class="link-title">{{ l.title }}</span>
              <span class="link-sub">{{ l.sub }}</span>
            </span>
            <UIcon name="i-lucide-chevron-right" class="size-4 link-chevron" />
          </NuxtLink>
        </div>

        <!-- Citation de fin -->
        <div class="closing-quote">
          <p>Nous étions chenilles, nous sommes en chrysalide. Bientôt, nous serons ces papillons de nuit, attirés par la bougie.</p>
        </div>

        <!-- Scroll to top -->
        <button class="scroll-top" @click="scrollToTop" aria-label="Remonter">
          <UIcon name="i-lucide-arrow-up" class="size-4" />
        </button>

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
  --cream: #EDE5D0;
  --ink: #1e1a14;
  --text: #3d3529;
  --text-secondary: #5c5244;
  --transition: 1.4s cubic-bezier(0.4, 0, 0.2, 1);

  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  font-family: 'Crimson Pro', Georgia, serif;
  color: var(--text);
  overflow: hidden;
}
:global(.dark) .landing {
  --cream: #1a2318;
  --ink: #e8e0ce;
  --text: #d4cbba;
  --text-secondary: #a89e8e;
  color: var(--text);
}

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
  background: radial-gradient(ellipse at center, transparent 30%, rgba(44, 36, 25, 0.10) 100%);
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
.revealed .watermark { top: 150%; }
.revealed .watermark-img { opacity: 0; }

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
  padding: 8px 16px 8px 12px;
  border: 1px solid var(--gold-dim);
  border-radius: 2px;
  background: rgba(175, 143, 60, 0.04);
  transition: opacity 0.3s, gap 0.3s, background 0.3s, border-color 0.3s;
  cursor: pointer;
}
.top-back:hover {
  opacity: 1;
  gap: 12px;
  background: rgba(175, 143, 60, 0.1);
  border-color: var(--gold);
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
.is-visible .title { opacity: 1; transform: translateY(0); }
.title-main {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(2.8rem, 8vw, 6rem);
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  display: block;
  line-height: 1;
  white-space: nowrap;
  color: var(--ink);
}

.ornament {
  display: flex; align-items: center; gap: 14px;
  margin-top: clamp(8px, 1.5vh, 16px);
  opacity: 0;
  transition: opacity 0.8s ease 0.5s;
}
.is-visible .ornament { opacity: 0.5; }
.ornament-line {
  width: clamp(32px, 8vw, 64px); height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.ornament-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  color: var(--gold); line-height: 1;
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
.is-visible .motto { opacity: 1; transform: translateY(0); }
.motto-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.62rem, 1.3vw, 0.78rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.8s ease 0.85s;
  color: var(--text-secondary);
}
.is-visible .motto-sub { opacity: 0.6; }

/* ============================
   FOOTER
   ============================ */
.footer-bar {
  position: relative; z-index: 2;
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
   PANEL
   ============================ */
.valeurs-panel {
  position: fixed; inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(24px, 4vw, 48px);
  padding-top: clamp(70px, 10vh, 100px);
  padding-bottom: clamp(40px, 6vh, 72px);
  overflow-y: auto;
  opacity: 0;
  transform: translateY(-60px);
  pointer-events: none;
  transition: opacity 1s ease 0.5s, transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s;
}
.revealed .valeurs-panel {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.panel-back {
  position: fixed;
  top: clamp(18px, 3.5vw, 32px);
  left: clamp(18px, 3.5vw, 32px);
  display: flex; align-items: center; gap: 10px;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--gold);
  opacity: 0; z-index: 30;
  padding: 8px 18px 8px 14px;
  border: 1px solid var(--gold-dim);
  border-radius: 2px;
  background: color-mix(in srgb, var(--cream) 85%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: opacity 0.4s ease, gap 0.3s, background 0.3s, border-color 0.3s;
  cursor: pointer;
}
.panel-back .back-arrow { transition: transform 0.3s ease; }
.panel-back.is-shown { opacity: 0.8; }
.panel-back:hover {
  opacity: 1;
  background: rgba(175, 143, 60, 0.1);
  border-color: var(--gold);
}
.panel-back:hover .back-arrow { transform: translateX(-3px); }

.panel-content {
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ============================
   MANIFESTO
   ============================ */
.manifesto {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  padding-bottom: 8px;
}
.manifesto-lead {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  color: var(--gold);
  letter-spacing: 0.06em;
  margin-bottom: 24px;
}
.manifesto p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.08rem;
  line-height: 2;
  color: var(--text);
  margin-bottom: 18px;
}
.manifesto-closing {
  margin-top: 28px;
  font-size: 1.1rem;
  color: var(--ink);
  font-weight: 600;
}

/* ============================
   DEVISE - hover zone
   ============================ */
.devise-zone {
  text-align: center;
  padding: 28px;
  width: 100%;
  cursor: default;
  margin-top: clamp(20px, 3vh, 36px);
}

.devise-ornament {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin-bottom: 18px;
}
.devise-line {
  width: clamp(28px, 7vw, 56px); height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
}
.devise-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.4rem;
  color: var(--gold);
  opacity: 0.5;
  line-height: 1;
}
.devise-latin {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: clamp(1.2rem, 3vw, 1.7rem);
  color: var(--gold);
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.devise-fr {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: clamp(0.72rem, 1.3vw, 0.85rem);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Mobile hint + inline explanation */
.devise-hint {
  display: none;
}
.devise-inline {
  text-align: center;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid var(--gold-faint);
}
.devise-inline p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.92rem;
  line-height: 1.9;
  color: var(--text);
  margin-bottom: 12px;
}
.devise-inline p:last-child { margin-bottom: 0; }

.devise-expand-enter-active { transition: opacity 0.4s ease, max-height 0.5s ease; }
.devise-expand-leave-active { transition: opacity 0.3s ease, max-height 0.4s ease; }
.devise-expand-enter-from, .devise-expand-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
.devise-expand-enter-to { max-height: 300px; overflow: hidden; }

/* ============================
   SHARED
   ============================ */
.section-separator {
  width: 50px; height: 1px;
  margin: clamp(44px, 7vh, 64px) auto;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}

.section-title-big {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
  color: var(--ink);
  margin-bottom: clamp(28px, 4vh, 44px);
}

/* ============================
   INTRO BLOCK
   ============================ */
.intro-block {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}
.intro-block p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.08rem;
  line-height: 2;
  color: var(--text);
  margin-bottom: 18px;
}
.intro-block p:last-child { margin-bottom: 0; }

/* ============================
   VALEURS - numeral centre, pas d'italique
   ============================ */
.valeurs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
}

.valeur-card {
  position: relative;
  padding: 32px 28px 28px;
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.valeur-card::before {
  content: '';
  position: absolute; inset: 0;
  border: 1px solid color-mix(in srgb, var(--card-color) 20%, transparent);
  pointer-events: none;
  transition: border-color 0.5s ease;
}
.valeur-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--card-color), transparent);
  opacity: 0.5;
  transition: opacity 0.4s ease;
}
.revealed .valeur-card { opacity: 1; transform: translateY(0); }
.valeur-card:hover::before { border-color: color-mix(in srgb, var(--card-color) 40%, transparent); }
.valeur-card:hover::after { opacity: 0.9; }

:global(.dark) .valeur-card::before { border-color: color-mix(in srgb, var(--card-color) 15%, transparent); }
:global(.dark) .valeur-card:hover::before { border-color: color-mix(in srgb, var(--card-color) 30%, transparent); }

.valeur-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.6rem;
  color: var(--card-color);
  opacity: 0.5;
  line-height: 1;
  display: block;
  margin-bottom: 16px;
  transition: opacity 0.4s ease;
}
.valeur-card:hover .valeur-numeral { opacity: 0.9; }

.valeur-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 14px;
  color: var(--ink);
  transition: color 0.4s ease;
}
.valeur-card:hover .valeur-title { color: var(--card-color); }

.valeur-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.85;
  color: var(--text-secondary);
  transition: color 0.4s ease;
}
.valeur-card:hover .valeur-text { color: var(--text); }

/* ============================
   HISTOIRE - grosse carte
   ============================ */
.histoire-card {
  width: 100%;
  position: relative;
  padding: clamp(32px, 5vw, 48px);
  border: 1px solid var(--gold-dim);
}
.histoire-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0.4;
}
.histoire-card p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  line-height: 2.1;
  color: var(--text);
  margin-bottom: 18px;
}
.histoire-card p:last-child { margin-bottom: 0; }

/* ============================
   BRANCHES - bien separees
   ============================ */
.branches-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.branch-card {
  position: relative;
  padding: 32px;
  border: 1px solid color-mix(in srgb, var(--card-color) 20%, transparent);
  transition: border-color 0.4s;
}
.branch-card:hover {
  border-color: color-mix(in srgb, var(--card-color) 40%, transparent);
}
.branch-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0; width: 3px;
  background: var(--card-color);
  opacity: 0.4;
  transition: opacity 0.4s;
}
.branch-card:hover::after { opacity: 0.8; }

.branch-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.branch-numeral {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.2rem;
  color: var(--card-color);
  opacity: 0.5;
  line-height: 1;
}

.branch-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--card-color);
}

.branch-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.98rem;
  line-height: 1.9;
  color: var(--text);
}

.branch-tarifs {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid color-mix(in srgb, var(--card-color) 15%, transparent);
}

.tarif-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tarif-pct {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.3rem;
  color: var(--card-color);
  line-height: 1;
  white-space: nowrap;
}

.tarif-label {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ============================
   ENGAGEMENTS - elegant
   ============================ */
.engagements-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

.eng-item {
  display: flex;
  gap: 24px;
  padding: 28px 0;
  border-bottom: 1px solid var(--gold-faint);
}
.eng-item:first-child {
  border-top: 1px solid var(--gold-faint);
}

.eng-num {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.1rem;
  color: var(--gold);
  opacity: 0.4;
  line-height: 1.6;
  flex-shrink: 0;
  width: 32px;
}

.eng-body { flex: 1; }

.eng-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  margin-bottom: 8px;
}

.eng-text {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.95rem;
  line-height: 1.85;
  color: var(--text-secondary);
}

/* ============================
   LINKS
   ============================ */
.links-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.link-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--gold-faint);
  background: transparent;
  transition: border-color 0.4s, background 0.3s;
}
.link-card:hover {
  border-color: var(--gold-dim);
  background: rgba(175, 143, 60, 0.03);
}

.link-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  color: var(--gold);
  opacity: 0.5;
  flex-shrink: 0;
  transition: opacity 0.3s;
}
.link-card:hover .link-icon { opacity: 0.9; }

.link-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.link-title {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 0.95rem;
  letter-spacing: 0.04em;
  color: var(--ink);
  transition: color 0.3s;
}
.link-card:hover .link-title { color: var(--gold); }
.link-sub {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.6;
  letter-spacing: 0.02em;
}

.link-chevron {
  color: var(--gold);
  opacity: 0.25;
  flex-shrink: 0;
  transition: opacity 0.3s, transform 0.3s;
}
.link-card:hover .link-chevron { opacity: 0.7; transform: translateX(3px); }

/* ============================
   CLOSING QUOTE
   ============================ */
.closing-quote {
  text-align: center;
  margin-top: clamp(44px, 7vh, 64px);
  padding: 28px 0;
  border-top: 1px solid var(--gold-faint);
}
.closing-quote p {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--gold);
  opacity: 0.7;
  max-width: 520px;
  margin: 0 auto;
}

/* ============================
   SCROLL TO TOP
   ============================ */
.scroll-top {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px; height: 44px;
  margin: clamp(28px, 4vh, 44px) auto 0;
  border: 1px solid var(--gold-dim);
  border-radius: 50%;
  background: transparent;
  color: var(--gold);
  opacity: 0.4;
  cursor: pointer;
  transition: opacity 0.3s, border-color 0.3s, transform 0.3s;
}
.scroll-top:hover {
  opacity: 1;
  border-color: var(--gold);
  transform: translateY(-3px);
}

/* ============================
   RESPONSIVE
   ============================ */
@media (max-height: 580px) {
  .title-main { font-size: clamp(2rem, 7vw, 3.5rem); }
  .motto { font-size: clamp(0.9rem, 2.2vw, 1.1rem); }
}

@media (max-width: 640px) {

  /* --- Center / loading page --- */
  .center { padding: 0 16px; }
  .title-main {
    font-size: clamp(1.8rem, 10vw, 2.8rem);
    letter-spacing: 0.15em;
  }
  .ornament { gap: 10px; margin-top: 10px; }
  .ornament-line { width: 28px; }
  .ornament-glyph { font-size: 1rem; }
  .motto { font-size: clamp(0.9rem, 3.5vw, 1.15rem); margin-top: 12px; }
  .motto-sub { font-size: 0.6rem; letter-spacing: 0.1em; }
  .watermark {
    width: clamp(280px, 80vmin, 400px);
    height: clamp(280px, 80vmin, 400px);
  }
  .frame { inset: 8px; }
  .corner { width: 18px; height: 18px; }
  .top-bar { top: 12px; left: 12px; }
  .top-back {
    font-size: 11px;
    padding: 6px 12px 6px 10px;
    gap: 6px;
  }
  .footer-text { font-size: 8px; }

  /* --- Panel --- */
  .valeurs-panel {
    padding: 16px;
    padding-top: 64px;
    padding-bottom: 32px;
  }
  .panel-back {
    top: 12px; left: 12px;
    font-size: 11px;
    padding: 6px 12px 6px 10px;
    gap: 6px;
  }
  .panel-content { max-width: 100%; }
  .section-title-big {
    font-size: 1.3rem;
    letter-spacing: 0.08em;
    margin-bottom: 20px;
  }
  .section-separator { margin: 32px auto; }

  /* --- Manifesto --- */
  .manifesto { padding-bottom: 0; }
  .manifesto-lead { font-size: 1.2rem; margin-bottom: 16px; }
  .manifesto p { font-size: 0.95rem; line-height: 1.85; margin-bottom: 14px; }
  .manifesto-closing { font-size: 0.98rem; margin-top: 20px; }

  /* --- Devise mobile: click to expand --- */
  .devise-zone {
    cursor: pointer;
    padding: 20px 16px;
    margin-top: 16px;
    border: 1px solid var(--gold-faint);
    transition: border-color 0.3s;
  }
  .devise-zone.is-open { border-color: var(--gold-dim); }
  .devise-hint {
    display: block;
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.5;
    margin-top: 10px;
    transition: opacity 0.3s;
  }
  .devise-zone.is-open .devise-hint { opacity: 0; height: 0; margin: 0; overflow: hidden; }

  /* --- Valeurs --- */
  .valeurs-grid { grid-template-columns: 1fr; gap: 14px; }
  .valeur-card { padding: 24px 20px 20px; }
  .valeur-numeral { font-size: 1.3rem; margin-bottom: 10px; }
  .valeur-title { font-size: 1.1rem; margin-bottom: 10px; }
  .valeur-text { font-size: 0.88rem; }

  /* --- Histoire --- */
  .histoire-card { padding: 22px 18px; }
  .histoire-card p { font-size: 0.92rem; line-height: 1.9; margin-bottom: 14px; }

  /* --- Branches --- */
  .branch-card { padding: 22px 18px; }
  .branch-text { font-size: 0.88rem; line-height: 1.8; }
  .branch-tarifs { flex-direction: column; gap: 10px; }
  .tarif-pct { font-size: 1.1rem; }
  .tarif-label { font-size: 0.78rem; }

  /* --- Engagements --- */
  .eng-item { gap: 16px; padding: 20px 0; }
  .eng-num { font-size: 0.95rem; width: 26px; }
  .eng-title { font-size: 0.92rem; }
  .eng-text { font-size: 0.88rem; line-height: 1.75; }

  /* --- Links --- */
  .links-row { grid-template-columns: 1fr; gap: 10px; }
  .link-card { padding: 14px 16px; gap: 12px; }
  .link-icon { width: 28px; height: 28px; }
  .link-title { font-size: 0.88rem; }
  .link-sub { font-size: 0.7rem; }

  /* --- Closing --- */
  .closing-quote p { font-size: 0.92rem; }
  .scroll-top { width: 38px; height: 38px; }
}
</style>

<style>
/* Tooltip - unscoped because teleported to body */
.devise-tooltip {
  position: fixed;
  z-index: 9999;
  max-width: 380px;
  padding: 24px 28px;
  background: #2a2218;
  border: 1px solid rgba(175, 143, 60, 0.3);
  pointer-events: none;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}
.dark .devise-tooltip {
  background: #1a1f16;
  border-color: rgba(175, 143, 60, 0.25);
}
.devise-tooltip p {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.92rem;
  line-height: 1.8;
  color: #d4cbba;
  margin: 0 0 12px;
}
.devise-tooltip p:last-child { margin-bottom: 0; }

.tooltip-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.tooltip-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.tooltip-enter-from, .tooltip-leave-to { opacity: 0; transform: translateY(6px); }
</style>
