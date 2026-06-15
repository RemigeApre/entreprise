// Offres Le Geai Informatique (FR).
// Source de verite : documents/plaquette_le_geai_informatique.pdf.
// Porte depuis l'ancien site Astro (data/formules.ts), version francaise uniquement.

export interface Formule {
  slug: string
  name: string
  tarif: string
  delai: string
  resume: string
  composition: string[]
}

export const creationFormules: Formule[] = [
  {
    slug: 'vitrine',
    name: 'Vitrine',
    tarif: '900 €',
    delai: '3 semaines',
    resume: '2 à 3 pages personnalisées, référencement local, mobile, RGPD, formation.',
    composition: [
      '2 à 3 pages personnalisées',
      'Référencement local',
      'Adaptation mobile',
      'Conformité RGPD',
      'Formation et documentation',
      '2 allers-retours de relecture',
    ],
  },
  {
    slug: 'gestion',
    name: 'Gestion',
    tarif: 'dès 2 800 €',
    delai: '6 à 8 semaines',
    resume: 'Vitrine + espace administrateur sécurisé et fonctionnalités interactives.',
    composition: [
      'Tout le contenu de la formule Vitrine',
      'Espace administrateur sécurisé',
      '1 à 3 fonctionnalités interactives au choix (réservations, planning, espace client, gestion des stocks)',
      'Formation administrateur',
    ],
  },
  {
    slug: 'e-commerce',
    name: 'E-commerce',
    tarif: 'dès 6 500 €',
    delai: '10 semaines',
    resume: 'Gestion + catalogue, panier, paiement sécurisé, commandes, tableau de bord.',
    composition: [
      'Tout le contenu de la formule Gestion',
      'Catalogue produits',
      'Panier sur mesure',
      'Paiement sécurisé via PayPal ou Stripe',
      'Gestion des commandes et des livraisons',
      'Tableau de bord des ventes',
    ],
  },
  {
    slug: 'logiciel-sur-mesure',
    name: 'Logiciel sur mesure',
    tarif: 'sur devis',
    delai: 'selon le projet',
    resume: 'Application web ou logiciel de bureau conçu sur cahier des charges.',
    composition: [
      'Application web ou logiciel de bureau',
      'Conception sur cahier des charges',
      'Développement par phases, avec validations intermédiaires',
      'Documentation et formation',
    ],
  },
]

export const maintenanceFormules: Formule[] = [
  {
    slug: 'essentiel',
    name: 'Essentiel',
    tarif: '39 € / mois',
    delai: 'engagement 12 mois',
    resume: 'Domaine, hébergement, SSL, sauvegarde, surveillance, incidents bloquants.',
    composition: [
      'Nom de domaine',
      'Hébergement',
      'Certificat SSL',
      'Sauvegarde mensuelle de la structure',
      'Surveillance',
      'Correction des incidents bloquants',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    tarif: '149 € / mois',
    delai: 'engagement 12 mois',
    resume: "Essentiel + 2 h d'amélioration mensuelle sur demande.",
    composition: [
      'Tout le contenu de la formule Essentiel',
      "2 h d'amélioration mensuelle sur demande, sur le design, les fonctionnalités, le contenu ou le SEO",
    ],
  },
  {
    slug: 'premium',
    name: 'Premium',
    tarif: '299 € / mois',
    delai: 'engagement 12 mois',
    resume: 'Pro + sauvegarde complète, 6 h au total, formation, intervention sous 24 h.',
    composition: [
      'Tout le contenu de la formule Pro',
      'Sauvegarde complète, structure et contenu',
      "4 h supplémentaires d'amélioration mensuelle (soit 6 h au total)",
      '1 h de formation utilisateur par mois',
      'Intervention sous 24 h ouvrées',
    ],
  },
  {
    slug: 'legendaire',
    name: 'Légendaire',
    tarif: '499 € / mois',
    delai: 'engagement 12 mois',
    resume: 'Premium + 1 h/semaine de gestion active du contenu, priorité maximale.',
    composition: [
      'Tout le contenu de la formule Premium',
      '1 h par semaine de gestion active du contenu, ajouts, mises à jour, utilisateurs',
      'Priorité maximale',
    ],
  },
]
