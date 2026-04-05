<script setup lang="ts">
const activeArticle = ref('art1')

interface Article {
  id: string
  numero: string
  titre: string
  contenu: string[]
}

const articles: Article[] = [
  {
    id: 'art1',
    numero: 'Article 1',
    titre: 'Objet et champ d\'application',
    contenu: [
      'Le present reglement interieur a pour objet de definir les regles de vie et de fonctionnement au sein du groupe Le Geai Editions.',
      'Il s\'applique a l\'ensemble des collaborateurs : salaries, stagiaires, alternants et freelances intervenant dans les locaux ou a distance pour le compte de l\'entreprise.',
      'Chaque collaborateur est tenu d\'en prendre connaissance des son arrivee et de s\'y conformer pendant toute la duree de sa collaboration.'
    ]
  },
  {
    id: 'art2',
    numero: 'Article 2',
    titre: 'Horaires et organisation du travail',
    contenu: [
      'Les horaires de travail sont fixes en accord avec le responsable, en respectant le cadre legal et les besoins de l\'activite.',
      'Le teletravail est autorise selon les modalites definies avec la direction. Les jours de teletravail doivent etre renseignes dans l\'outil de planning de l\'intranet.',
      'Toute absence previsible doit etre signalee au plus tot via l\'intranet. Les absences imprevues doivent etre communiquees le jour meme par tout moyen disponible.'
    ]
  },
  {
    id: 'art3',
    numero: 'Article 3',
    titre: 'Comportement et respect mutuel',
    contenu: [
      'Chaque collaborateur doit faire preuve de respect, de courtoisie et de professionnalisme envers ses collegues, clients et partenaires.',
      'Toute forme de harcelement, discrimination ou comportement degradant est strictement interdite et pourra faire l\'objet de sanctions.',
      'Les desaccords professionnels doivent etre exprimes de maniere constructive. En cas de conflit persistant, la direction pourra etre saisie en tant que mediateur.'
    ]
  },
  {
    id: 'art4',
    numero: 'Article 4',
    titre: 'Outils et materiel',
    contenu: [
      'Le materiel mis a disposition par l\'entreprise (ordinateurs, logiciels, acces) est destine a un usage professionnel.',
      'Un usage personnel raisonnable est tolere dans la mesure ou il ne nuit pas a la productivite ni a la securite des systemes.',
      'Chaque collaborateur est responsable du materiel qui lui est confie et doit signaler tout dysfonctionnement ou perte sans delai.',
      'L\'installation de logiciels non autorises sur les machines de l\'entreprise est interdite.'
    ]
  },
  {
    id: 'art5',
    numero: 'Article 5',
    titre: 'Confidentialite et propriete intellectuelle',
    contenu: [
      'Toute information relative aux projets, clients, partenaires ou a la strategie de l\'entreprise est confidentielle.',
      'Cette obligation de confidentialite perdure apres la fin de la collaboration, sans limitation de duree pour les informations relevant du secret des affaires.',
      'Les creations realisees dans le cadre professionnel font l\'objet d\'une cession de droits d\'auteur selon les termes du contrat individuel de chaque collaborateur.',
      'Les donnees personnelles des collaborateurs, clients et partenaires sont traitees conformement au RGPD.'
    ]
  },
  {
    id: 'art6',
    numero: 'Article 6',
    titre: 'Communication et image',
    contenu: [
      'Les publications officielles sur les reseaux sociaux et les communications externes sont coordonnees par la direction.',
      'Un collaborateur souhaitant mentionner l\'entreprise dans une publication personnelle doit en informer la direction au prealable.',
      'L\'utilisation de l\'image des collaborateurs a des fins de communication fait l\'objet d\'une autorisation de droit a l\'image distincte.'
    ]
  },
  {
    id: 'art7',
    numero: 'Article 7',
    titre: 'Sanctions',
    contenu: [
      'Tout manquement aux dispositions du present reglement pourra donner lieu a des sanctions proportionnees a la gravite des faits.',
      'L\'echelle des sanctions comprend : l\'avertissement verbal, l\'avertissement ecrit, la mise a pied disciplinaire et, en dernier recours, la rupture du contrat.',
      'Aucune sanction ne pourra etre prononcee sans que le collaborateur ait ete prealablement entendu.'
    ]
  },
  {
    id: 'art8',
    numero: 'Article 8',
    titre: 'Dispositions finales',
    contenu: [
      'Le present reglement peut etre modifie par la direction apres consultation des collaborateurs.',
      'Toute modification sera communiquee par voie interne et accessible sur l\'intranet.',
      'En cas de doute sur l\'interpretation d\'un article, la direction est l\'interlocuteur competent.'
    ]
  }
]

function scrollToArticle(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onScroll(e: Event) {
  const container = e.target as HTMLElement
  const scrollTop = container.scrollTop + 100
  for (const art of [...articles].reverse()) {
    const el = document.getElementById(art.id)
    if (el && el.offsetTop <= scrollTop) {
      activeArticle.value = art.id
      break
    }
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Reglement interieur">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/wiki" />
      </template>
      <template #right>
        <UButton
          label="DOCX"
          icon="i-lucide-download"
          size="sm"
          variant="soft"
          color="neutral"
          tag="a"
          href="/documents/reglement_interieur.docx"
          download="reglement_interieur.docx"
        />
      </template>
    </PageHeader>

    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar TOC (desktop) -->
      <nav class="hidden lg:flex flex-col w-56 shrink-0 border-r border-[rgba(175,143,60,0.1)] py-6 px-3 overflow-y-auto">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-[#AF8F3C] mb-3 px-2">Articles</p>
        <button
          v-for="art in articles"
          :key="art.id"
          class="text-left px-2.5 py-2 rounded-md text-sm transition-all mb-0.5"
          :class="activeArticle === art.id
            ? 'text-[#AF8F3C] font-semibold bg-[rgba(175,143,60,0.06)]'
            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100/50'"
          @click="scrollToArticle(art.id)"
        >
          <span class="text-[10px] font-medium uppercase tracking-wider block mb-0.5 opacity-60">{{ art.numero }}</span>
          <span class="block leading-tight">{{ art.titre }}</span>
        </button>
      </nav>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-10" @scroll="onScroll">
        <div class="max-w-3xl mx-auto">

          <!-- Intro -->
          <div class="mb-10 text-center">
            <div class="flex items-center justify-center gap-3 mb-4 opacity-30">
              <div class="w-12 h-px bg-stone-400" />
              <div class="size-1.5 rotate-45 bg-[#AF8F3C]" />
              <div class="w-12 h-px bg-stone-400" />
            </div>
            <p class="text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
              Le present reglement interieur definit les regles de vie et de fonctionnement
              au sein du groupe Le Geai Editions. Il s'applique a tous les collaborateurs.
            </p>
          </div>

          <!-- Articles -->
          <div class="space-y-8">
            <section
              v-for="art in articles"
              :key="art.id"
              :id="art.id"
              class="rounded-xl bg-white/70 border border-white/80 shadow-sm p-5 sm:p-6"
            >
              <div class="flex items-baseline gap-3 mb-4">
                <span class="text-[10px] font-bold uppercase tracking-widest text-[#AF8F3C] bg-[rgba(175,143,60,0.08)] px-2 py-1 rounded shrink-0">
                  {{ art.numero }}
                </span>
                <h2 class="text-lg font-semibold text-stone-900" style="font-family: 'IM Fell DW Pica', Georgia, serif;">
                  {{ art.titre }}
                </h2>
              </div>
              <div class="space-y-3 pl-0 sm:pl-4 border-l-0 sm:border-l-2 border-[rgba(175,143,60,0.1)]">
                <p
                  v-for="(paragraph, idx) in art.contenu"
                  :key="idx"
                  class="text-sm text-stone-600 leading-relaxed sm:pl-4"
                >
                  {{ paragraph }}
                </p>
              </div>
            </section>
          </div>

          <!-- Footer -->
          <div class="text-center text-xs text-stone-400 pb-8 pt-8 space-y-1">
            <p>Le Geai Editions - SIRET 902 957 117 00010</p>
            <p>Document accessible egalement au format DOCX via la <NuxtLink to="/wiki/documents" class="text-[#AF8F3C] hover:underline">bibliotheque</NuxtLink>.</p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
