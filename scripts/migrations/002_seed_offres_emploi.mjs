/**
 * Insere les 5 offres de stage du document "offres d'emplois.docx" dans la collection offres_emploi,
 * et leur assigne des categories via la table de junction offres_emploi_categories.
 */
export default async function ({ api, safeApi }) {
  // Map offre title keyword → category names to assign
  const offreCategoriesMap = {
    'commercial': ['Administration'],
    'Illustrateur': ['Design 2D/3D'],
    'Developpeur': ['Informatique'],
    'UI/UX': ['Design 2D/3D', 'Informatique'],
    'communication': ['Communication']
  }

  const offres = [
    {
      titre: 'Charge·e de developpement commercial — Stage',
      type_contrat: 'Stage',
      localisation: 'Lyon',
      teletravail: '90%',
      description: `Le Geai — Trois branches, une meme exigence : sites web et IT, edition de livres, media geopolitique. On cherche quelqu'un pour aller chercher nos premiers clients et batir la strategie qui les amene a nous.

Missions :
- Identifier et qualifier des prospects (independants, associations, PME)
- Rediger et envoyer des emails de prospection cibles
- Assurer le suivi des echanges et les relances
- Construire une strategie d'acquisition adaptee a une petite structure
- Participer a la definition de l'argumentaire commercial
- Suivre les resultats, analyser, ajuster
- Explorer des canaux complementaires : partenariats, reseaux, evenements locaux`,
      competences_requises: `- Initiative et autonomie : vous serez seul·e sur le sujet
- Communication ecrite irreprochable
- Interet pour le numerique et le tissu economique local
- Le culot d'aller chercher les gens sans le ton commercial qui fait fuir`,
      avantages: `- Impact direct et mesurable : chaque client signe sera le votre
- Autonomie totale sur votre perimetre
- Experience concrete de construire une strategie commerciale de zero
- Teletravail flexible, un jour de presence sur dix
- Lettre de recommandation`,
      publie: true
    },
    {
      titre: 'Illustrateur·rice 2D / 3D — Stage',
      type_contrat: 'Stage',
      localisation: 'Lyon',
      teletravail: '90%',
      description: `Le Geai — Trois branches, un meme soin du detail : sites web et IT, edition de livres, media geopolitique. On cherche un oeil et une main pour donner forme a tout ca.

Missions :
- Creer des visuels pour les sites web de nos clients et nos propres supports
- Illustrer des ouvrages pour Le Geai Editions (couvertures, interieurs, ornements)
- Modeliser en 3D pour l'impression de figurines et produits derives
- Participer a la conception visuelle de futurs projets interactifs
- Decliner une identite graphique coherente sur l'ensemble des branches`,
      competences_requises: `- Un univers personnel, pas un portfolio generique
- Maitrise d'au moins un outil 2D (Procreate, Photoshop, Clip Studio, Krita)
- Idealement un outil 3D (Blender, ZBrush)
- Capacite a travailler a partir d'un brief litteraire ou narratif
- Autonomie, curiosite, et le reflexe de proposer plutot qu'attendre`,
      avantages: `- Liberte creative rare : vous ne remplirez pas des templates, vous creerez un univers
- Projets varies (web, print, 3D, editorial)
- Teletravail flexible, un jour de presence sur dix
- Du vrai travail publie a votre nom
- Lettre de recommandation`,
      publie: true
    },
    {
      titre: 'Developpeur·se Web / App — Stage',
      type_contrat: 'Stage',
      localisation: 'Lyon',
      teletravail: '90%',
      description: `Le Geai — Trois branches, une meme exigence : sites web et IT, edition de livres, media geopolitique. On cherche un·e dev qui veut construire des vrais projets, pas des maquettes qui finissent dans un tiroir.

Missions :
- Developper et maintenir des sites web clients (vitrine, gestion, e-commerce)
- Participer a la conception et au developpement des outils internes du Geai
- Integrer des designs fournis par l'equipe creative
- Mettre en place et optimiser des environnements de deploiement
- Tester, debuguer, documenter
- Contribuer ponctuellement aux plateformes editoriales (Bergfrid, Le Geai Editions)`,
      competences_requises: `- Maitrise solide d'au moins un stack web (HTML/CSS/JS minimum, un framework front ou back en plus)
- Capacite de lire un brief, poser les bonnes questions et livrer proprement
- Habitude de versionner son code (Git)
- Curiosite technique : on ne vous demande pas de tout savoir, on vous demande de chercher quand vous ne savez pas`,
      avantages: `- Du code en production, pas en exercice : chaque ligne livree sera visible et utilisee
- Variete de projets (sites clients, outils internes, plateformes media)
- Choix de specialisation : front, back ou fullstack selon votre profil
- Teletravail flexible, un jour de presence sur dix
- Lettre de recommandation`,
      publie: true
    },
    {
      titre: 'UI/UX Designer — Stage',
      type_contrat: 'Stage',
      localisation: 'Lyon',
      teletravail: '90%',
      description: `Le Geai — Trois branches, une meme exigence : sites web et IT, edition de livres, media geopolitique. On cherche quelqu'un qui pense l'experience avant le pixel.

Missions :
- Analyser les besoins utilisateurs pour les sites clients et les plateformes internes
- Concevoir des wireframes, prototypes et parcours utilisateurs
- Proposer des interfaces coherentes avec l'identite visuelle de chaque projet
- Collaborer avec les developpeurs pour garantir la faisabilite des maquettes
- Penser responsive, accessibilite, lisibilite
- Iterer a partir des retours clients et des donnees d'usage`,
      competences_requises: `- Regard critique sur ce qui existe, pas copier des tendances Dribbble
- Maitrise d'au moins un outil de design (Figma, Sketch, Adobe XD)
- Sensibilite typographique et oeil pour la hierarchie visuelle
- Capacite de defendre vos choix autrement que par "c'est joli"`,
      avantages: `- Projets reels avec des vrais utilisateurs, pas des cas d'ecole
- Univers tres differents : sites vitrines PME, plateforme editoriale, media geopolitique
- Collaboration directe avec le fondateur sur la direction artistique
- Teletravail flexible, un jour de presence sur dix
- Lettre de recommandation`,
      publie: true
    },
    {
      titre: 'Charge·e de communication — Stage',
      type_contrat: 'Stage',
      localisation: 'Lyon',
      teletravail: '90%',
      description: `Le Geai — Trois branches, une meme exigence : sites web et IT, edition de livres, media geopolitique. On cherche quelqu'un qui sait parler de nous sans parler comme tout le monde.

Missions :
- Gerer et animer les reseaux sociaux des trois branches (LinkedIn, X, Discord, Instagram)
- Rediger des contenus varies : posts, articles, newsletters, documents internes
- Construire et tenir un calendrier editorial coherent
- Adapter le ton et le message a chaque plateforme et chaque audience
- Participer a la conception de campagnes d'emailing (La Vigie, annonces, prospection)
- Creer des visuels simples pour les reseaux (Canva, Figma ou equivalent)
- Suivre les metriques, analyser ce qui prend, ajuster ce qui ne prend pas`,
      competences_requises: `- Francais impeccable, non negociable
- Aisance redactionnelle, capacite de passer d'un ton institutionnel a un ton direct
- Curiosite pour nos sujets : tech, edition, geopolitique
- Instinct de ce qui fonctionne sur les reseaux, sans tomber dans le racolage`,
      avantages: `- La main sur toute la communication d'une entreprise en construction
- Sujets denses et varies (un jour site web livre, le lendemain analyse geopolitique)
- Une voix d'entreprise a forger, pas a imiter
- Teletravail flexible, un jour de presence sur dix
- Lettre de recommandation`,
      publie: true
    }
  ]

  // Load categories for M2M assignment
  let categoriesMap = {}
  try {
    const cats = await api('GET', '/items/categories?fields=id,nom&limit=-1')
    if (cats) {
      for (const cat of cats) {
        categoriesMap[cat.nom] = cat.id
      }
    }
  } catch {
    console.log('  ⚠ Impossible de charger les categories (collection peut-etre absente)')
  }

  for (const offre of offres) {
    // Check if already exists by title
    let existingId = null
    try {
      const existing = await api('GET', `/items/offres_emploi?filter[titre][_eq]=${encodeURIComponent(offre.titre)}&fields=id&limit=1`)
      if (existing && existing.length > 0) {
        existingId = existing[0].id
        console.log(`  ⊘ Offre "${offre.titre.substring(0, 40)}..." existe deja`)
      }
    } catch {
      // Collection may not exist yet, continue with create
    }

    let offreId = existingId
    if (!existingId) {
      const created = await safeApi('POST', '/items/offres_emploi', {
        ...offre,
        date_publication: new Date().toISOString()
      }, `Offre "${offre.titre.substring(0, 45)}..."`)
      if (created) offreId = created.id
    }

    // Assign categories via M2M junction
    if (offreId && Object.keys(categoriesMap).length) {
      for (const [keyword, catNames] of Object.entries(offreCategoriesMap)) {
        if (offre.titre.toLowerCase().includes(keyword.toLowerCase())) {
          for (const catName of catNames) {
            const catId = categoriesMap[catName]
            if (!catId) continue
            // Check if junction already exists
            try {
              const existing = await api('GET', `/items/offres_emploi_categories?filter[offres_emploi_id][_eq]=${offreId}&filter[categories_id][_eq]=${catId}&limit=1`)
              if (existing && existing.length > 0) continue
            } catch { /* junction table may not exist yet */ }
            await safeApi('POST', '/items/offres_emploi_categories', {
              offres_emploi_id: offreId,
              categories_id: catId
            }, `  Junction offre → ${catName}`)
          }
          break
        }
      }
    }
  }
}
