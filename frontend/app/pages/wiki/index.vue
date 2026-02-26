<script setup lang="ts">
const { roleName } = useAuth()

const sections = [
  { id: 'identite', label: 'Notre identite', icon: 'i-lucide-palette' },
  { id: 'reglement', label: 'Reglement interieur', icon: 'i-lucide-scale' },
  { id: 'charte', label: 'Charte contractuelle', icon: 'i-lucide-file-lock' },
  { id: 'cession', label: 'Cession droits d\'auteur', icon: 'i-lucide-file-signature' }
]

const activeSection = ref('identite')

function scrollTo(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Observer pour mettre a jour la section active au scroll
const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
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

  for (const s of sections) {
    const el = document.getElementById(s.id)
    if (el) observer.value.observe(el)
  }
})

onUnmounted(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <UDashboardNavbar title="Wiki interne" />

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
        <!-- SECTION 2 : Reglement interieur                                  -->
        <!-- ================================================================ -->
        <section id="reglement" class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-scale" class="size-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">Reglement interieur</h2>
              <p class="text-sm text-stone-500 dark:text-stone-400">Le Geai Editions - Conforme au Code du travail</p>
            </div>
          </div>

          <!-- Preambule -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Preambule</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Le present reglement interieur est etabli par la direction de Le Geai Editions, conformement aux dispositions des articles L.1311-1 a L.1321-6 et R.1321-1 a R.1321-4 du Code du travail.</p>
              <p>Bien que l'entreprise emploie moins de 50 salaries et ne soit donc pas soumise a l'obligation legale d'etablir un reglement interieur, la direction a choisi de mettre en place le present document afin de garantir un cadre de travail clair, sur et equitable.</p>
              <p><strong>Champ d'application :</strong> le present reglement s'applique a l'ensemble des salaries de l'entreprise, quel que soit leur contrat de travail (CDI, CDD, contrat d'apprentissage, contrat de professionnalisation). Les stagiaires et travailleurs interimaires sont soumis aux dispositions relatives a l'hygiene, a la securite et a la discipline generale.</p>
            </div>
          </UCard>

          <!-- Titre I -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre I - Hygiene et securite</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Article 1 : Regles generales</p>
                <p>Chaque collaborateur est tenu de prendre soin de sa sante et de sa securite ainsi que de celles des autres personnes concernees par ses actes ou omissions au travail (art. L.4122-1). Les collaborateurs doivent respecter les regles d'utilisation des equipements et des locaux, signaler toute situation dangereuse et ne pas modifier les dispositifs de securite.</p>
              </div>
              <div>
                <p class="font-semibold">Article 2 : Teletravail</p>
                <p>Le collaborateur en teletravail reste soumis aux regles de securite applicables. Il s'engage a disposer d'un espace de travail conforme aux exigences d'ergonomie et de securite electrique. Tout accident survenu pendant les heures de travail sur le lieu de teletravail doit etre signale dans les 24 heures.</p>
              </div>
              <div>
                <p class="font-semibold">Article 3 : Retablissement des conditions de securite</p>
                <p>Lorsque les conditions protectrices de la sante et de la securite sont compromises, les collaborateurs sont tenus de participer a leur retablissement (formations, mesures correctives, procedures temporaires renforcees).</p>
              </div>
            </div>
          </UCard>

          <!-- Titre II -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre II - Discipline</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Article 4 : Regles generales de discipline</p>
                <ul>
                  <li>Respecter les horaires de travail ou les delais et livrables fixes</li>
                  <li>Adopter un comportement professionnel, courtois et respectueux</li>
                  <li>Se conformer aux directives de la direction</li>
                  <li>Justifier toute absence dans les 48 heures</li>
                  <li>Ne pas exercer d'activite concurrente</li>
                </ul>
              </div>
              <div>
                <p class="font-semibold">Article 5 : Outils et ressources</p>
                <p>Les outils, logiciels et ressources numeriques sont destines a un usage exclusivement professionnel, sauf tolerance de la direction. Toute utilisation abusive constitue une faute disciplinaire.</p>
              </div>
              <div>
                <p class="font-semibold">Article 6 : Systemes d'information</p>
                <p>L'acces est strictement nominatif. Il est interdit de communiquer ses identifiants, d'utiliser ceux d'un autre collaborateur ou de contourner les mesures de securite. Les acces sont desactives a la fin de la collaboration.</p>
              </div>
              <div>
                <p class="font-semibold">Article 7 : Comportements nuisibles</p>
                <p>Sont interdits : la diffusion de fausses informations, la mise en danger des donnees, l'introduction de contenus illicites (a l'exception des oeuvres editoriales de l'entreprise).</p>
              </div>
              <div>
                <p class="font-semibold">Article 8 : Communication des incidents</p>
                <p>Tout incident doit etre signale sans delai a la direction. Ce signalement ne peut donner lieu a des represailles.</p>
              </div>
            </div>
          </UCard>

          <!-- Titre III -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre III - Harcelement, discrimination et lanceurs d'alerte</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Article 9 : Harcelement moral</p>
                <p>Aucun collaborateur ne doit subir des agissements repetes de harcelement moral (art. L.1152-1 a L.1152-6). Toute victime peut saisir la direction, le medecin du travail ou l'inspection du travail.</p>
              </div>
              <div>
                <p class="font-semibold">Article 10 : Harcelement sexuel et agissements sexistes</p>
                <p>Aucun collaborateur ne doit subir de harcelement sexuel ou d'agissements sexistes (art. L.1153-1 a L.1153-6 et L.1142-2-1). Est assimile au harcelement sexuel toute pression grave exercee dans le but d'obtenir un acte de nature sexuelle.</p>
              </div>
              <div>
                <p class="font-semibold">Article 11 : Discriminations</p>
                <p>Aucune discrimination n'est toleree, conformement aux articles L.1132-1 et suivants du Code du travail (origine, sexe, age, orientation sexuelle, identite de genre, handicap, opinions politiques, convictions religieuses, etc.).</p>
              </div>
              <div>
                <p class="font-semibold">Article 12 : Lanceurs d'alerte</p>
                <p>Conformement a la loi du 21 mars 2022, un dispositif de recueil des signalements est en place. Aucune sanction ne peut etre prise contre un lanceur d'alerte de bonne foi.</p>
              </div>
            </div>
          </UCard>

          <!-- Titre IV -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre IV - Sanctions disciplinaires</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Echelle des sanctions, en fonction de la gravite :</p>
              <ol>
                <li><strong>Avertissement ecrit</strong> - observation ecrite rappelant les faits</li>
                <li><strong>Blame</strong> - reprimande versee au dossier</li>
                <li><strong>Mise a pied disciplinaire</strong> - suspension sans remuneration (max. 5 jours ouvres)</li>
                <li><strong>Retrogradation</strong> - sous reserve de l'accord du collaborateur</li>
                <li><strong>Licenciement pour faute</strong></li>
                <li><strong>Licenciement pour faute grave ou lourde</strong> - sans preavis ni indemnite</li>
              </ol>
              <p class="text-stone-500 dark:text-stone-400">Cette echelle n'implique pas une progressivite obligatoire. Aucune sanction ne peut etre prononcee sans entretien prealable (sauf avertissement/blame). Aucun fait fautif ne peut donner lieu a des poursuites au-dela de 2 mois.</p>
            </div>
          </UCard>
        </section>

        <!-- ================================================================ -->
        <!-- SECTION 3 : Charte contractuelle                                 -->
        <!-- ================================================================ -->
        <section id="charte" class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-file-lock" class="size-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h2 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">Charte contractuelle</h2>
              <p class="text-sm text-stone-500 dark:text-stone-400">Confidentialite, propriete intellectuelle & usage des ressources</p>
            </div>
          </div>

          <!-- Preambule -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Preambule</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
              <p>La presente charte constitue une annexe au contrat de travail (ou a la convention de stage). Elle definit les engagements reciproques en matiere de confidentialite, de propriete intellectuelle, de non-sollicitation et d'utilisation des ressources. Les obligations s'ajoutent aux dispositions du reglement interieur.</p>
            </div>
          </UCard>

          <!-- Titre I : Confidentialite -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre I - Confidentialite</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Article 1 : Informations confidentielles</p>
                <p>Sont confidentielles : les donnees, documents, oeuvres, manuscrits, strategies commerciales, listes de clients, conditions tarifaires, procedes techniques et savoir-faire. Cette obligation couvre les oeuvres en cours ou non publiees.</p>
              </div>
              <div>
                <p class="font-semibold">Article 2 : Obligations</p>
                <ul>
                  <li>Ne pas divulguer, reproduire ou exploiter les informations sans autorisation ecrite</li>
                  <li>Ne pas utiliser les informations a des fins personnelles</li>
                  <li>Proteger la confidentialite (verrouillage postes, stockage securise, chiffrement)</li>
                  <li>Restituer tous les documents a la fin de la collaboration</li>
                </ul>
              </div>
              <div>
                <p class="font-semibold">Article 3 : Duree</p>
                <p>L'obligation s'applique pendant et apres la collaboration, sans limitation de duree. Toute violation engage la responsabilite civile et penale du collaborateur.</p>
              </div>
            </div>
          </UCard>

          <!-- Titre II : Propriete intellectuelle -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre II - Propriete intellectuelle</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Article 4 : Cession des droits patrimoniaux</p>
                <p>Le collaborateur cede a Le Geai Editions l'integralite de ses droits patrimoniaux sur les oeuvres realisees dans le cadre de son contrat. Cession pour le monde entier et pour toute la duree de la protection legale :</p>
                <ul>
                  <li><strong>Reproduction</strong> : sur tout support connu ou a venir</li>
                  <li><strong>Representation</strong> : par tout procede de diffusion</li>
                  <li><strong>Adaptation</strong> : modification, traduction, integration</li>
                </ul>
              </div>
              <div>
                <p class="font-semibold">Article 5 : Droit moral</p>
                <p>Le droit moral reste inalienable. L'entreprise respecte la paternite de l'oeuvre et ne procede pas a des modifications portant atteinte a son integrite sans concertation.</p>
              </div>
            </div>
          </UCard>

          <!-- Titre III : Non-sollicitation -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Titre III - Non-sollicitation et loyaute</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Pendant la collaboration, le collaborateur s'interdit de :</p>
              <ul>
                <li>Demarcher les clients pour son propre compte</li>
                <li>Diffuser les coordonnees ou listes de clients</li>
                <li>Solliciter les partenaires commerciaux pour detourner du chiffre d'affaires</li>
              </ul>
              <p class="text-stone-500 dark:text-stone-400">L'obligation est applicable pendant toute la duree du contrat. Les clauses de non-concurrence eventuelles s'appliquent au-dela.</p>
            </div>
          </UCard>

          <!-- Dispositions finales -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Dispositions finales</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
              <p>Tout manquement constitue une faute susceptible d'entrainer des sanctions disciplinaires conformement au reglement interieur, sans prejudice de poursuites judiciaires.</p>
            </div>
          </UCard>
        </section>

        <!-- ================================================================ -->
        <!-- SECTION 4 : Cession droits d'auteur (stagiaires)                 -->
        <!-- ================================================================ -->
        <section id="cession" class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-file-signature" class="size-5 text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <h2 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">Cession de droits d'auteur</h2>
              <p class="text-sm text-stone-500 dark:text-stone-400">Applicable aux stagiaires - Art. L.131-1 et suivants du CPI</p>
            </div>
          </div>

          <!-- Objet -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Article 1 - Objet de la cession</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Le stagiaire cede ses droits patrimoniaux sur l'ensemble des oeuvres realisees dans le cadre du stage ou a l'aide des outils de l'entreprise. Les oeuvres incluent :</p>
              <ul>
                <li>Code source, scripts, modules logiciels, contributions techniques</li>
                <li>Illustrations, graphismes, maquettes, animations, videos, mises en page</li>
                <li>Contenus redactionnels, editoriaux et documentaires</li>
                <li>Toute autre creation originale produite dans le cadre du stage</li>
              </ul>
            </div>
          </UCard>

          <!-- Droits cedes -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Article 2 - Droits cedes</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-3">
              <p>Conformement a l'article L.131-3 du CPI :</p>
              <ul>
                <li><strong>Reproduction :</strong> fixation sur tout support materiel ou immateriel, en nombre illimite (impression, numerique, base de donnees, sites web, applications)</li>
                <li><strong>Representation :</strong> communication au public par tout procede (mise en ligne, reseaux sociaux, salons, projection)</li>
                <li><strong>Adaptation :</strong> modification, traduction, integration dans une oeuvre composite</li>
              </ul>
            </div>
          </UCard>

          <!-- Destination & etendue -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Article 3 - Destination</h3>
              </template>
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
                <ul>
                  <li>Edition et publication d'ouvrages (papier et numerique)</li>
                  <li>Sites web, applications mobiles, plateformes en ligne</li>
                  <li>Communication institutionnelle et promotionnelle</li>
                  <li>Exploitations derivees liees aux activites de l'entreprise</li>
                </ul>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Article 4 - Etendue</h3>
              </template>
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
                <ul>
                  <li><strong>Territoire :</strong> monde entier, sans restriction</li>
                  <li><strong>Duree :</strong> toute la duree legale de protection des droits d'auteur</li>
                </ul>
              </div>
            </UCard>
          </div>

          <!-- Contrepartie -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Article 5 - Contrepartie</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none">
              <p>La cession est consentie en contrepartie de la gratification de stage. En l'absence de gratification (stage &le; 2 mois), la cession est a titre gratuit, l'experience professionnelle constituant la contrepartie.</p>
            </div>
          </UCard>

          <!-- Droit moral, garanties, confidentialite -->
          <UCard class="mb-6">
            <template #header>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Articles 6, 7, 8 - Droit moral, garanties & confidentialite</h3>
            </template>
            <div class="prose prose-stone dark:prose-invert prose-sm max-w-none space-y-4">
              <div>
                <p class="font-semibold">Droit moral (art. 6)</p>
                <p>Le droit moral demeure inalienable. L'entreprise respecte l'integrite des oeuvres. Le stagiaire autorise l'exploitation sans mention systematique de son nom. Il conserve le droit de revendiquer la paternite de ses creations.</p>
              </div>
              <div>
                <p class="font-semibold">Garanties (art. 7)</p>
                <p>Le stagiaire garantit etre l'auteur des oeuvres, leur originalite, l'absence d'atteinte aux droits de tiers, et l'absence de cessions incompatibles.</p>
              </div>
              <div>
                <p class="font-semibold">Confidentialite (art. 8)</p>
                <p>Le stagiaire ne peut diffuser les oeuvres sans autorisation. Il conserve le droit d'integrer les oeuvres dans un portfolio personnel, sans divulguer d'informations confidentielles, en informant prealablement l'entreprise.</p>
              </div>
            </div>
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
