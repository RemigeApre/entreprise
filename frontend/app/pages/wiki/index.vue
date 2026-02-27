<script setup lang="ts">
import type { WikiPage } from '~/utils/types'

const { getPages } = useWiki()

const { data: wikiPages, status } = useAsyncData('wiki-pages', getPages)

// Section statique + sections dynamiques
const identiteSection = { id: 'identite', label: 'Notre identite', icon: 'i-lucide-palette' }

const sections = computed(() => {
  const dynamic = (wikiPages.value || []).map((p: WikiPage) => ({
    id: p.slug,
    label: p.titre,
    icon: p.icone || 'i-lucide-file-text'
  }))
  return [identiteSection, ...dynamic]
})

const activeSection = ref('identite')

function scrollTo(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Observer pour mettre a jour la section active au scroll
const observer = ref<IntersectionObserver | null>(null)

function setupObserver() {
  observer.value?.disconnect()
  observer.value = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  )

  for (const s of sections.value) {
    const el = document.getElementById(s.id)
    if (el) observer.value.observe(el)
  }
}

onMounted(() => {
  setupObserver()
})

// Re-setup observer quand les pages dynamiques arrivent
watch(wikiPages, () => {
  nextTick(() => setupObserver())
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Wiki interne" />

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <!-- Navigation rapide -->
        <div class="flex flex-wrap gap-2 mb-8 sticky top-0 z-10 py-3 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm">
          <UButton
            v-for="s in sections"
            :key="s.id"
            :label="s.label"
            :icon="s.icon"
            :variant="activeSection === s.id ? 'subtle' : 'ghost'"
            :color="activeSection === s.id ? 'primary' : 'neutral'"
            size="sm"
            @click="scrollTo(s.id)"
          />
        </div>

        <!-- ================================================================ -->
        <!-- SECTION 1 : Notre identite (Charte graphique + Mood Board)       -->
        <!-- ================================================================ -->
        <section id="identite" class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-palette" class="size-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h2 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">Notre identite</h2>
              <p class="text-sm text-stone-500 dark:text-stone-400">Charte graphique & mood board</p>
            </div>
          </div>

          <!-- Devise -->
          <UCard class="mb-6">
            <div class="text-center py-4">
              <p class="font-heading text-xl italic text-stone-700 dark:text-stone-300">Obscuritas nutrit flammam.</p>
              <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">L'obscurite nourrit la flamme.</p>
            </div>
          </UCard>

          <!-- Naissance -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Naissance</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>2021, creation legale de l'entreprise. 2024, publication du premier livre. 2025, changement de statut pour etre reconnu comme maison d'edition.</p>
              <p>La Lune, pleine et lumineuse, s'elevait dans l'obscurite, dansant avec les etoiles. Sous son regard tendre un cri, le premier d'une vie. Nocturne saison, ou le voile des mondes se dechirait, la naissance eu lieu. Notre maison prit vie, a travers qui je suis.</p>
              <p>Il nous fallait alors une maison, un manoir sombre ou nos rencontrent se font a la bougie. Car, nous sommes les flammes se nourrissant des tenebres. Car nous sommes l'avenir sublime.</p>
              <p class="italic text-stone-500 dark:text-stone-400">Nous etions chenilles, nous sommes en chrysalide. Bientot, nous seront ces papillons de nuit, attires par la bougie.</p>
            </div>
          </UCard>

          <!-- Objectifs -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Objectifs</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Nous sommes des passeurs. Nous portons les ames des lecteurs vers d'autres rivages. Nous sommes des medecins, qui apaisons l'ame.</p>
              <p>Nous visons de ces etres qui revent de decouvrir d'autres mondes, qui revent de plonger et d'etre emporte en des recits.</p>
              <p>Mais nous allons aussi chercher ceux qui n'ont pas encore connu ce voyage, ceux qui en ont peur, ceux qui pensent ne pas en avoir le temps. Car la est notre role, les guider, les emporter.</p>
            </div>
          </UCard>

          <!-- References & Ambiances -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">References artistiques</h3>
              </template>
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
                <p>Edgar Allan Poe, Oscar Wilde, HP Lovecraft. The Witcher, GOT, The Secret History, Le Cercle des Poetes Disparus.</p>
                <p>Berserk, Chainsaw Man, Monster, 20th Century Boys, Alice au Pays des Merveilles, Dracula, Frankenstein.</p>
                <p>Neo-gothique anglais (Oxford), art gothique, Victorien, art grec et romain.</p>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Ambiances</h3>
              </template>
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
                <p>Dark Academia realiste : bibliotheques poussieureuses, cuisines foisonnantes, chambres d'artistes.</p>
                <p>Jardins de fleurs, potagers, forets, chemins de randonnee dans les montagnes, champs.</p>
                <p>L'odeur de pluie, les buches qui craquent, la douceur des plaids apres une journee de labeur.</p>
              </div>
            </UCard>
          </div>

          <!-- Ton & Voix -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Ton et voix</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
              <p>Langage soutenu mais accessible, avec un vouvoiement affectif et doux. De l'ironie, une posture de Gentleman ou de Dame. Capable de duel a l'epee comme de douces caresses.</p>
              <p><strong>Eugenie</strong> : narratrice du journal, douce, maitresse de maison au caractere affirme et nuance.</p>
            </div>
          </UCard>

          <!-- Logo -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Logo et armoiries</h3>
            </template>
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <div class="shrink-0 p-6 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                <img src="/logo.svg" alt="Armoiries Le Geai" class="w-32 h-32" />
              </div>
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-2">
                <p><strong>Description heraldique :</strong> d'argent, a l'aigle bicephale de sinople, becquee et armee de gueules, tenant sur sa poitrine un livre ouvert d'or, nimbee du meme, le tout pose en majeste.</p>
                <p>L'aigle bicephale symbolise la famille, luttant contre les menaces exterieures et les faiblesses interieures, portant l'art comme le plus precieux des dons.</p>
                <p class="text-stone-500 dark:text-stone-400 text-xs">Deux variantes : couleur et noir & blanc. Une troisieme en or/argent pour les editions rares.</p>
              </div>
            </div>
          </UCard>

          <!-- Palette de couleurs -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Palette de couleurs</h3>
            </template>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="h-20 rounded-lg mb-2" style="background-color: #af8f3c" />
                <p class="text-xs font-semibold text-stone-900 dark:text-white">Sable des reves perdus</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">#af8f3c</p>
              </div>
              <div class="text-center">
                <div class="h-20 rounded-lg mb-2" style="background-color: #b74d34" />
                <p class="text-xs font-semibold text-stone-900 dark:text-white">Rouge antique</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">#b74d34</p>
              </div>
              <div class="text-center">
                <div class="h-20 rounded-lg mb-2" style="background-color: #1f2c23" />
                <p class="text-xs font-semibold text-stone-900 dark:text-white">Vert de minuit</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">#1f2c23</p>
              </div>
              <div class="text-center">
                <div class="h-20 rounded-lg mb-2 border border-stone-200 dark:border-stone-700" style="background-color: #f7f0de" />
                <p class="text-xs font-semibold text-stone-900 dark:text-white">Lune de lait</p>
                <p class="text-xs text-stone-500 dark:text-stone-400">#f7f0de</p>
              </div>
            </div>
          </UCard>

          <!-- Typographie -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Typographie</h3>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div>
                <p class="font-semibold text-stone-900 dark:text-white mb-1">Titres et sous-titres</p>
                <p class="text-stone-500 dark:text-stone-400">IM Fell DW Pica</p>
              </div>
              <div>
                <p class="font-semibold text-stone-900 dark:text-white mb-1">Textes</p>
                <p class="text-stone-500 dark:text-stone-400">Crimson Pro</p>
              </div>
              <div>
                <p class="font-semibold text-stone-900 dark:text-white mb-1">Accents</p>
                <p class="text-stone-500 dark:text-stone-400">UnifrakturCook</p>
              </div>
            </div>
          </UCard>
        </section>

        <!-- ================================================================ -->
        <!-- SECTIONS DYNAMIQUES depuis Directus                              -->
        <!-- ================================================================ -->
        <div v-if="status === 'pending' && !wikiPages" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        </div>

        <section
          v-for="page in wikiPages"
          :id="page.slug"
          :key="page.id"
          class="mb-16"
        >
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-lg bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center">
              <UIcon :name="page.icone || 'i-lucide-file-text'" class="size-5 text-stone-700 dark:text-stone-400" />
            </div>
            <div>
              <h2 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">{{ page.titre }}</h2>
            </div>
          </div>

          <UCard>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none" v-html="page.contenu" />
          </UCard>
        </section>

        <!-- Footer info -->
        <div class="text-center text-xs text-stone-400 dark:text-stone-600 pb-8">
          <p>Le Geai Editions - 31 rue Pasteur, 69007 Lyon</p>
          <p>SIRET 902 957 117 00010 - Contact : administration@legeai-editions.com</p>
        </div>
      </div>
    </div>
  </div>
</template>
