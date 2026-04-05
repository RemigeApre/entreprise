<script setup lang="ts">
const toast = useToast()

const copiedColor = ref<string | null>(null)

function copyHex(hex: string) {
  navigator.clipboard.writeText(hex)
  copiedColor.value = hex
  toast.add({ title: `${hex} copie`, color: 'success' })
  setTimeout(() => { copiedColor.value = null }, 1500)
}

function downloadLogo() {
  const a = document.createElement('a')
  a.href = '/documents/LeGeai_logo_vecteur.svg'
  a.download = 'LeGeai_logo_vecteur.svg'
  a.click()
}

const colors = [
  { name: 'Sable des reves perdus', hex: '#af8f3c', role: 'Primaire - accents, liens, elements interactifs' },
  { name: 'Rouge antique', hex: '#b74d34', role: 'Erreurs, alertes, elements d\'urgence' },
  { name: 'Vert de minuit', hex: '#1f2c23', role: 'Fonds sombres, textes sur clair' },
  { name: 'Lune de lait', hex: '#f7f0de', role: 'Fonds clairs, cartes, surfaces' }
]

const typos = [
  { name: 'IM Fell DW Pica', usage: 'Titres et sous-titres', specimen: 'Obscuritas nutrit flammam', style: "font-family: 'IM Fell DW Pica', Georgia, serif; font-size: 1.3rem;" },
  { name: 'Crimson Pro', usage: 'Corps de texte', specimen: 'Dans l\'obscurite d\'une epoque qui oublie l\'exigence, nous portons les dernieres flammes.', style: "font-family: 'Crimson Pro', Georgia, serif; font-size: 1rem;" },
  { name: 'UnifrakturCook', usage: 'Accents decoratifs (monogramme G)', specimen: 'G', style: "font-family: 'UnifrakturCook', cursive; font-size: 2rem;" }
]

const references = [
  { cat: 'Litterature', items: 'Edgar Allan Poe, Oscar Wilde, HP Lovecraft, Dracula, Frankenstein, Alice au Pays des Merveilles' },
  { cat: 'Series & films', items: 'The Witcher, Game of Thrones, The Secret History, Le Cercle des Poetes Disparus' },
  { cat: 'Manga', items: 'Berserk, Chainsaw Man, Monster, 20th Century Boys' },
  { cat: 'Architecture & art', items: 'Neo-gothique anglais, art gothique, Victorien, art grec et romain' }
]

// Active section for scroll spy
const activeSection = ref('devise')
const sections = ['devise', 'logo', 'couleurs', 'typo', 'ambiance', 'references', 'ton']

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onScroll(e: Event) {
  const container = e.target as HTMLElement
  const scrollTop = container.scrollTop + 100
  for (const id of [...sections].reverse()) {
    const el = document.getElementById(id)
    if (el && el.offsetTop <= scrollTop) {
      activeSection.value = id
      break
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Notre identite">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/wiki" />
      </template>
      <template #right>
        <UButton
          label="Charte PDF"
          icon="i-lucide-download"
          size="sm"
          variant="soft"
          color="neutral"
          tag="a"
          href="/documents/charte_graphique.pdf"
          download="charte_graphique.pdf"
        />
      </template>
    </PageHeader>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar TOC (desktop) -->
      <nav class="hidden lg:flex flex-col w-48 shrink-0 border-r border-[rgba(175,143,60,0.1)] py-6 px-4 overflow-y-auto">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-[#AF8F3C] mb-3">Sommaire</p>
        <button
          v-for="id in sections"
          :key="id"
          class="text-left px-2.5 py-1.5 rounded-md text-sm transition-all mb-0.5"
          :class="activeSection === id
            ? 'text-[#AF8F3C] font-semibold bg-[rgba(175,143,60,0.06)]'
            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'"
          @click="scrollToSection(id)"
        >
          {{ { devise: 'Devise', logo: 'Logo', couleurs: 'Couleurs', typo: 'Typographie', ambiance: 'Ambiances', references: 'References', ton: 'Ton & voix' }[id] }}
        </button>
      </nav>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10" @scroll="onScroll">
        <div class="max-w-3xl mx-auto space-y-10">

          <!-- Devise -->
          <section id="devise" class="text-center py-8">
            <div class="flex items-center justify-center gap-3 mb-6 opacity-30">
              <div class="w-12 h-px bg-stone-400" />
              <div class="size-1.5 rotate-45 bg-[#AF8F3C]" />
              <div class="w-12 h-px bg-stone-400" />
            </div>
            <p class="font-heading text-2xl sm:text-3xl italic text-stone-800" style="font-family: 'IM Fell DW Pica', Georgia, serif;">
              Obscuritas nutrit flammam.
            </p>
            <p class="text-sm text-stone-500 mt-2">L'obscurite nourrit la flamme.</p>
            <p class="text-xs text-stone-400 mt-4 max-w-lg mx-auto leading-relaxed">
              Ce n'est pas un slogan. C'est une devise, en latin et en francais, car elle porte en son coeur un heritage.
              Plus le monde s'assombrit, plus la flamme grandit.
            </p>
          </section>

          <!-- Logo -->
          <section id="logo">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="size-4 text-[#AF8F3C]" />
              Logo et armoiries
            </h2>
            <div class="rounded-xl bg-white/70 border border-white/80 shadow-sm overflow-hidden">
              <div class="flex flex-col sm:flex-row">
                <!-- Logo preview -->
                <div class="sm:w-56 shrink-0 flex items-center justify-center p-8 bg-[rgba(175,143,60,0.03)] border-b sm:border-b-0 sm:border-r border-[rgba(175,143,60,0.08)]">
                  <img src="/logo.svg" alt="Armoiries Le Geai" class="w-32 h-32" />
                </div>
                <!-- Description -->
                <div class="flex-1 p-5 space-y-3">
                  <div class="prose prose-stone prose-sm max-w-none">
                    <p><strong>Description heraldique :</strong> d'argent, a l'aigle bicephale de sinople, becquee et armee de gueules, tenant sur sa poitrine un livre ouvert d'or, nimbee du meme, le tout pose en majeste.</p>
                    <p class="text-stone-500">L'aigle bicephale symbolise la famille, luttant contre les menaces exterieures et les faiblesses interieures, portant l'art comme le plus precieux des dons.</p>
                  </div>
                  <div class="flex items-center gap-2 pt-2">
                    <UButton
                      label="Telecharger SVG"
                      icon="i-lucide-download"
                      size="xs"
                      variant="soft"
                      @click="downloadLogo"
                    />
                    <span class="text-[10px] text-stone-400">Vectoriel, fond transparent</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Couleurs -->
          <section id="couleurs">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-palette" class="size-4 text-[#AF8F3C]" />
              Palette de couleurs
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="color in colors"
                :key="color.hex"
                class="group/color rounded-xl bg-white/70 border border-white/80 shadow-sm hover:shadow-md transition-all overflow-hidden text-left"
                @click="copyHex(color.hex)"
              >
                <div
                  class="h-20 sm:h-24 relative"
                  :style="{ backgroundColor: color.hex }"
                >
                  <!-- Copy overlay -->
                  <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/color:opacity-100 transition-opacity">
                    <span v-if="copiedColor === color.hex" class="text-white text-xs font-bold flex items-center gap-1">
                      <UIcon name="i-lucide-check" class="size-3.5" /> Copie !
                    </span>
                    <span v-else class="text-white text-xs font-medium flex items-center gap-1">
                      <UIcon name="i-lucide-copy" class="size-3.5" /> Copier
                    </span>
                  </div>
                </div>
                <div class="p-3">
                  <p class="text-xs font-semibold text-stone-900 leading-tight">{{ color.name }}</p>
                  <p class="text-[11px] font-mono text-stone-500 mt-0.5">{{ color.hex }}</p>
                  <p class="text-[10px] text-stone-400 mt-1 leading-tight">{{ color.role }}</p>
                </div>
              </button>
            </div>
          </section>

          <!-- Typographie -->
          <section id="typo">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-type" class="size-4 text-[#AF8F3C]" />
              Typographie
            </h2>
            <div class="space-y-3">
              <div
                v-for="typo in typos"
                :key="typo.name"
                class="rounded-xl bg-white/70 border border-white/80 shadow-sm p-4"
              >
                <div class="flex items-baseline justify-between gap-3 mb-2">
                  <p class="text-sm font-semibold text-stone-900">{{ typo.name }}</p>
                  <span class="text-[10px] text-stone-400 uppercase tracking-wider shrink-0">{{ typo.usage }}</span>
                </div>
                <p class="text-stone-700" :style="typo.style">{{ typo.specimen }}</p>
              </div>
            </div>
          </section>

          <!-- Ambiances -->
          <section id="ambiance">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-lamp" class="size-4 text-[#AF8F3C]" />
              Ambiances
            </h2>
            <div class="rounded-xl bg-white/70 border border-white/80 shadow-sm p-5">
              <div class="prose prose-stone prose-sm max-w-none space-y-3">
                <p><strong>Dark Academia realiste.</strong> Bibliotheques poussieureuses, cuisines foisonnantes, chambres d'artistes.</p>
                <p>Jardins de fleurs, potagers, forets, chemins de randonnee dans les montagnes, champs.</p>
                <p class="italic text-stone-500">L'odeur de pluie, les buches qui craquent, la douceur des plaids apres une journee de labeur.</p>
              </div>
            </div>
          </section>

          <!-- References -->
          <section id="references">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-library" class="size-4 text-[#AF8F3C]" />
              References artistiques
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                v-for="ref in references"
                :key="ref.cat"
                class="rounded-xl bg-white/70 border border-white/80 shadow-sm p-4"
              >
                <p class="text-xs font-semibold text-[#AF8F3C] uppercase tracking-wider mb-1.5">{{ ref.cat }}</p>
                <p class="text-sm text-stone-600 leading-relaxed">{{ ref.items }}</p>
              </div>
            </div>
          </section>

          <!-- Ton & Voix -->
          <section id="ton">
            <h2 class="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-message-circle" class="size-4 text-[#AF8F3C]" />
              Ton et voix
            </h2>
            <div class="rounded-xl bg-white/70 border border-white/80 shadow-sm p-5">
              <div class="prose prose-stone prose-sm max-w-none space-y-3">
                <p>Langage soutenu mais accessible, avec un vouvoiement affectif et doux. De l'ironie, une posture de Gentleman ou de Dame. Capable de duel a l'epee comme de douces caresses.</p>
                <p><strong>Eugenie</strong> : narratrice du journal, douce, maitresse de maison au caractere affirme et nuance.</p>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <div class="text-center text-xs text-stone-400 pb-8 pt-4 border-t border-[rgba(175,143,60,0.08)]">
            <p>Le Geai Editions - 31 rue Pasteur, 69007 Lyon</p>
            <p>SIRET 902 957 117 00010</p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
