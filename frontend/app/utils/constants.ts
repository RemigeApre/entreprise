export const ROLE_NAMES = {
  DIRECTEUR: 'Directeur',
  EMPLOYE: 'Employe',
  FREELANCE: 'Freelance',
  ALTERNANT: 'Alternant',
  STAGIAIRE: 'Stagiaire'
} as const

export const ROLES_WITH_END_DATE_REQUIRED = [
  ROLE_NAMES.FREELANCE,
  ROLE_NAMES.ALTERNANT,
  ROLE_NAMES.STAGIAIRE
]

export const ROLES_WITH_SCHOOL_DAYS = [
  ROLE_NAMES.ALTERNANT,
  ROLE_NAMES.STAGIAIRE
]

export const ROLES_WITH_HOUR_TRACKING = [
  ROLE_NAMES.FREELANCE,
  ROLE_NAMES.ALTERNANT,
  ROLE_NAMES.STAGIAIRE
]

export const PLANNING_TYPES = {
  travail: { label: 'Travail', color: 'green', icon: 'i-lucide-briefcase' },
  teletravail: { label: 'Teletravail', color: 'green', icon: 'i-lucide-house' },
  conge: { label: 'Conge', color: 'neutral', icon: 'i-lucide-plane' },
  ecole: { label: 'Ecole', color: 'red', icon: 'i-lucide-graduation-cap' },
  absent: { label: 'Absent', color: 'red', icon: 'i-lucide-x-circle' },
  ferie: { label: 'Ferie', color: 'neutral', icon: 'i-lucide-calendar-off' }
} as const

export const PLANNING_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  travail: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-400',
    dot: 'bg-emerald-500'
  },
  teletravail: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-400',
    dot: 'bg-indigo-500'
  },
  ecole: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    dot: 'bg-red-400'
  },
  conge: {
    bg: 'bg-stone-100',
    text: 'text-stone-900',
    border: 'border-stone-500',
    dot: 'bg-stone-800'
  },
  absent: {
    bg: 'bg-red-200',
    text: 'text-red-900',
    border: 'border-red-500',
    dot: 'bg-red-600'
  },
  ferie: {
    bg: 'bg-stone-200',
    text: 'text-stone-600',
    border: 'border-stone-400',
    dot: 'bg-stone-500'
  }
}

export const PLANNING_STATUTS = {
  valide: { label: 'Valide', color: 'green' },
  en_attente: { label: 'En attente', color: 'yellow' },
  refuse: { label: 'Refuse', color: 'red' }
} as const

export const CONGE_TYPES = {
  conge_paye: 'Conge paye',
  rtt: 'RTT',
  maladie: 'Maladie',
  arret_maladie: 'Arret maladie',
  sans_solde: 'Sans solde',
  autre: 'Autre'
} as const

export const ORIGINES_PROSPECTION = {
  google_maps: { label: 'Google Maps', icon: 'i-simple-icons-googlemaps' },
  linkedin: { label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  pages_jaunes: { label: 'Pages Jaunes', icon: 'i-lucide-book-open' },
  bouche_a_oreille: { label: 'Bouche a oreille', icon: 'i-lucide-ear' },
  salon: { label: 'Salon / Evenement', icon: 'i-lucide-calendar' },
  site_web: { label: 'Site web', icon: 'i-lucide-globe' },
  autre: { label: 'Autre', icon: 'i-lucide-help-circle' }
} as const

export const NIVEAUX_SITE = {
  pas_de_site: { label: 'Pas de site', color: 'neutral', icon: 'i-lucide-globe-lock' },
  site_casse: { label: 'Site casse', color: 'red', icon: 'i-lucide-alert-triangle' },
  site_nul: { label: 'Site nul', color: 'orange', icon: 'i-lucide-thumbs-down' },
  site_passable: { label: 'Site passable', color: 'yellow', icon: 'i-lucide-minus' }
} as const

export const PROSPECT_STATUTS = {
  a_contacter: { label: 'A contacter', color: 'neutral', icon: 'i-lucide-phone-outgoing' },
  premier_contact: { label: 'Premier contact', color: 'blue', icon: 'i-lucide-phone-call' },
  en_discussion: { label: 'En discussion', color: 'yellow', icon: 'i-lucide-message-square' },
  client: { label: 'Client', color: 'green', icon: 'i-lucide-handshake' },
  cloture: { label: 'Cloture', color: 'red', icon: 'i-lucide-x-circle' }
} as const

export const MOTIFS_CLOTURE = {
  concurrent: { label: 'Deja chez un concurrent', icon: 'i-lucide-shield-x' },
  ferme: { label: 'Entreprise fermee', icon: 'i-lucide-building-2' },
  refus: { label: 'Refus', icon: 'i-lucide-thumbs-down' },
  autre: { label: 'Autre', icon: 'i-lucide-help-circle' }
} as const

export const CONTACT_CANAUX = {
  email: { label: 'Email', icon: 'i-lucide-mail' },
  telephone: { label: 'Telephone', icon: 'i-lucide-phone' },
  linkedin: { label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  en_personne: { label: 'En personne', icon: 'i-lucide-users' },
  site_web: { label: 'Site web', icon: 'i-lucide-globe' },
  autre: { label: 'Autre', icon: 'i-lucide-message-circle' }
} as const

export const CONTACT_RESULTATS = {
  refus: { label: 'Refus', color: 'red', icon: 'i-lucide-x' },
  attente: { label: 'En attente', color: 'yellow', icon: 'i-lucide-clock' },
  retenter: { label: 'A retenter', color: 'orange', icon: 'i-lucide-refresh-cw' },
  ligne_coupee: { label: 'Ligne coupee', color: 'neutral', icon: 'i-lucide-phone-off' },
  positif: { label: 'Positif', color: 'green', icon: 'i-lucide-check' },
  absent: { label: 'Absent', color: 'neutral', icon: 'i-lucide-user-x' }
} as const

export const OFFRE_PROSPECT_STATUTS = {
  a_proposer: { label: 'A proposer', color: 'neutral', icon: 'i-lucide-file-text' },
  proposee: { label: 'Proposee', color: 'blue', icon: 'i-lucide-send' },
  negociation: { label: 'Negociation', color: 'yellow', icon: 'i-lucide-message-square' },
  acceptee: { label: 'Acceptee', color: 'green', icon: 'i-lucide-check-circle' },
  refusee: { label: 'Refusee', color: 'red', icon: 'i-lucide-x-circle' }
} as const

export const VILLES_FRANCE = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Toulon', 'Saint-Etienne', 'Le Havre',
  'Grenoble', 'Dijon', 'Angers', 'Nimes', 'Clermont-Ferrand', 'Aix-en-Provence',
  'Le Mans', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Metz', 'Perpignan',
  'Besancon', 'Orleans', 'Rouen', 'Caen', 'Nancy', 'Avignon', 'Valence',
  'Cannes', 'Antibes', 'La Rochelle', 'Chambery', 'Annecy', 'Pau', 'Bayonne',
  'Poitiers', 'Troyes', 'Colmar', 'Mulhouse', 'Ajaccio', 'Bastia'
] as const

export const PROJECT_STATUTS = {
  brouillon: { label: 'Brouillon', color: 'neutral' },
  en_cours: { label: 'En cours', color: 'blue' },
  en_pause: { label: 'En pause', color: 'yellow' },
  termine: { label: 'Termine', color: 'green' },
  annule: { label: 'Annule', color: 'red' }
} as const

export const TASK_STATUTS = {
  a_faire: { label: 'A faire', color: 'neutral' },
  en_cours: { label: 'En cours', color: 'blue' },
  termine: { label: 'Termine', color: 'green' }
} as const

export const TASK_PRIORITES = {
  basse: { label: 'Basse', color: 'neutral' },
  normale: { label: 'Normale', color: 'blue' },
  haute: { label: 'Haute', color: 'orange' },
  urgente: { label: 'Urgente', color: 'red' }
} as const

export const STATUT_EMPLOI = {
  a_venir: { label: 'A venir', color: 'blue', icon: 'i-lucide-clock' },
  actif: { label: 'Actif', color: 'green', icon: 'i-lucide-check-circle' },
  test: { label: 'Test', color: 'orange', icon: 'i-lucide-flask-conical' },
  bloque: { label: 'Bloque', color: 'error', icon: 'i-lucide-lock' },
  termine: { label: 'Termine', color: 'neutral', icon: 'i-lucide-log-out' }
} as const

export const CONTRACT_TYPES = {
  CDI: 'CDI',
  CDD: 'CDD',
  Freelance: 'Freelance',
  Alternance: 'Alternance',
  Stage: 'Stage'
} as const

export const SCHEDULE_CATEGORIES = {
  reunion_client: { label: 'Reunion client', icon: 'i-lucide-handshake', color: 'emerald' },
  reunion_interne: { label: 'Reunion interne', icon: 'i-lucide-users', color: 'sky' },
  reunion_financement: { label: 'Financement', icon: 'i-lucide-landmark', color: 'violet' },
  entretien_rh: { label: 'Entretien RH', icon: 'i-lucide-user-search', color: 'purple' },
  indispo_perso: { label: 'Indisponibilite', icon: 'i-lucide-user-x', color: 'orange' },
  autre: { label: 'Autre', icon: 'i-lucide-calendar-clock', color: 'neutral' }
} as const

export const SCHEDULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  reunion_client: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-400'
  },
  reunion_interne: {
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-400'
  },
  reunion_financement: {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-400'
  },
  entretien_rh: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-400'
  },
  indispo_perso: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-400'
  },
  autre: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-400'
  }
}

export const PROJECT_ROLES = [
  // Gestion
  'Chef de projet',
  'Directeur artistique',
  'Consultant',
  // Developpement
  'Developpeur web',
  'Developpeur mobile',
  'Developpeur fullstack',
  'Integrateur',
  // Design & 3D
  'Designer UI/UX',
  'Graphiste',
  'Illustrateur',
  'Modeleur 3D',
  'Animateur 3D',
  'Textureur',
  // Ecriture & Edition
  'Auteur',
  'Correcteur',
  'Relecteur',
  'Editeur',
  'Redacteur',
  // Communication
  'Charge de communication',
  'Community manager',
  // Autres
  'Freelance',
  'Autre'
] as const

// --- Tickets ---

export const TICKET_TYPES = {
  bug: { label: 'Bug', icon: 'i-lucide-bug', color: 'orange' },
  faille_securite: { label: 'Faille securite', icon: 'i-lucide-shield-alert', color: 'red' },
  panne: { label: 'Panne / KO', icon: 'i-lucide-server-crash', color: 'red' },
  amelioration: { label: 'Amelioration', icon: 'i-lucide-sparkles', color: 'blue' },
  fonctionnalite: { label: 'Fonctionnalite', icon: 'i-lucide-puzzle', color: 'purple' },
  autre: { label: 'Autre', icon: 'i-lucide-ticket', color: 'neutral' }
} as const

export const TICKET_STATUTS = {
  ouvert: { label: 'Ouvert', color: 'orange' },
  en_cours: { label: 'En cours', color: 'blue' },
  resolu: { label: 'Resolu', color: 'green' },
  ferme: { label: 'Ferme', color: 'neutral' }
} as const

export const TICKET_PRIORITES = {
  basse: { label: 'Basse', color: 'neutral', icon: 'i-lucide-arrow-down' },
  normale: { label: 'Normale', color: 'blue', icon: 'i-lucide-minus' },
  haute: { label: 'Haute', color: 'orange', icon: 'i-lucide-arrow-up' },
  critique: { label: 'Critique', color: 'red', icon: 'i-lucide-alert-triangle' }
} as const

// --- Articles ---

export const ARTICLE_STATUTS = {
  brouillon: { label: 'Brouillon', color: 'neutral' },
  publie: { label: 'Publie', color: 'green' },
  programme: { label: 'Programme', color: 'blue' }
} as const

// --- Offres d'emploi ---

export const CONTRACT_OPTIONS = [
  { label: 'CDI', value: 'CDI' },
  { label: 'CDD', value: 'CDD' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Alternance', value: 'Alternance' },
  { label: 'Stage', value: 'Stage' }
]

export const SALAIRE_OPTIONS = [
  { label: 'Par heure', value: 'heure' },
  { label: 'Par mois', value: 'mois' },
  { label: 'Par annee', value: 'annee' }
]

export const CONTRACT_COLORS: Record<string, string> = {
  CDI: 'green',
  CDD: 'blue',
  Freelance: 'orange',
  Alternance: 'purple',
  Stage: 'yellow'
}

export const CONTRACT_HEX_COLORS: Record<string, string> = {
  CDI: '#22c55e',
  CDD: '#3B82F6',
  Freelance: '#F97316',
  Alternance: '#8B5CF6',
  Stage: '#EAB308'
}

// --- Emploi du temps : recurrence ---

// --- Finance ---

export const TRANSACTION_TYPES = {
  recette: { label: 'Recette', color: 'green', icon: 'i-lucide-trending-up' },
  depense: { label: 'Depense', color: 'red', icon: 'i-lucide-trending-down' }
} as const

export const TRANSACTION_CATEGORIES = {
  vente: { label: 'Vente', icon: 'i-lucide-shopping-bag' },
  prestation: { label: 'Prestation', icon: 'i-lucide-briefcase' },
  abonnement: { label: 'Abonnement', icon: 'i-lucide-repeat' },
  salaire: { label: 'Salaire', icon: 'i-lucide-wallet' },
  freelance: { label: 'Freelance', icon: 'i-lucide-user' },
  achat_materiel: { label: 'Achat materiel', icon: 'i-lucide-monitor' },
  logiciel: { label: 'Logiciel / SaaS', icon: 'i-lucide-code' },
  hebergement: { label: 'Hebergement', icon: 'i-lucide-server' },
  marketing: { label: 'Marketing', icon: 'i-lucide-megaphone' },
  deplacement: { label: 'Deplacement', icon: 'i-lucide-car' },
  administratif: { label: 'Administratif', icon: 'i-lucide-file-text' },
  autre: { label: 'Autre', icon: 'i-lucide-circle' }
} as const

export const TRANSACTION_RECURRENCES = {
  unique: { label: 'Unique' },
  mensuel: { label: 'Mensuel' },
  trimestriel: { label: 'Trimestriel' },
  annuel: { label: 'Annuel' }
} as const

// --- Materiel ---

export const MATERIEL_CATEGORIES = {
  informatique: { label: 'Informatique', icon: 'i-lucide-monitor' },
  commercial: { label: 'Commercial', icon: 'i-lucide-store' },
  bureau: { label: 'Bureau', icon: 'i-lucide-lamp-desk' },
  admin: { label: 'Admin', icon: 'i-lucide-folder' }
} as const

export const MATERIEL_TYPES: Record<string, { label: string, prefix: string, categorie: string }> = {
  // Informatique
  ordinateur_portable: { label: 'Ordinateur portable', prefix: 'OP', categorie: 'informatique' },
  ordinateur_fixe: { label: 'Ordinateur fixe', prefix: 'OF', categorie: 'informatique' },
  ecran: { label: 'Ecran', prefix: 'EC', categorie: 'informatique' },
  souris: { label: 'Souris', prefix: 'SO', categorie: 'informatique' },
  clavier: { label: 'Clavier', prefix: 'CL', categorie: 'informatique' },
  cable: { label: 'Cable', prefix: 'CA', categorie: 'informatique' },
  autre_it: { label: 'Autre IT', prefix: 'IT', categorie: 'informatique' },
  // Commercial
  table_pliante: { label: 'Table pliante', prefix: 'TP', categorie: 'commercial' },
  chaise_pliante: { label: 'Chaise pliante', prefix: 'CP', categorie: 'commercial' },
  presentoir_livres: { label: 'Presentoir livres', prefix: 'PL', categorie: 'commercial' },
  presentoir_prospectus: { label: 'Presentoir prospectus', prefix: 'PP', categorie: 'commercial' },
  plv: { label: 'PLV / Signalisation', prefix: 'PV', categorie: 'commercial' },
  autre_commercial: { label: 'Autre commercial', prefix: 'CM', categorie: 'commercial' },
  // Bureau
  mobilier: { label: 'Mobilier', prefix: 'MB', categorie: 'bureau' },
  fourniture: { label: 'Fourniture', prefix: 'FO', categorie: 'bureau' },
  autre_bureau: { label: 'Autre bureau', prefix: 'BU', categorie: 'bureau' },
  // Admin
  tampon: { label: 'Tampon / Cachet', prefix: 'TA', categorie: 'admin' },
  classeur: { label: 'Classeur / Archivage', prefix: 'AR', categorie: 'admin' },
  autre_admin: { label: 'Autre admin', prefix: 'AD', categorie: 'admin' }
} as const

export const MATERIEL_ETATS = {
  neuf: { label: 'Neuf', color: 'green' },
  bon: { label: 'Bon etat', color: 'blue' },
  use: { label: 'Use', color: 'yellow' },
  hs: { label: 'HS', color: 'red' },
  a_acquerir: { label: 'A acquerir', color: 'orange' },
  vendu: { label: 'Cede / Perdu', color: 'neutral' }
} as const

export const PRODUIT_TYPES = {
  livre: { label: 'Livre', prefix: 'LV', icon: 'i-lucide-book-open' },
  derive: { label: 'Produit derive', prefix: 'PD', icon: 'i-lucide-package' },
  service: { label: 'Service', prefix: 'SV', icon: 'i-lucide-briefcase' },
  autre: { label: 'Autre', prefix: 'PR', icon: 'i-lucide-tag' }
} as const

export const ACHAT_TYPES = {
  ponctuel: { label: 'Ponctuel' },
  recurrent: { label: 'Recurrent' }
} as const

export const ACHAT_STATUTS = {
  a_acheter: { label: 'A acheter', color: 'yellow', icon: 'i-lucide-shopping-cart' },
  commande: { label: 'Commande', color: 'blue', icon: 'i-lucide-package' },
  recu: { label: 'Recu', color: 'green', icon: 'i-lucide-check-circle' }
} as const

export const RECURRENCE_OPTIONS = [
  { label: 'Aucune', value: 'aucune' },
  { label: 'Chaque jour ouvre (lun-ven)', value: 'chaque_jour_ouvre' },
  { label: 'Chaque jour', value: 'chaque_jour' },
  { label: 'Chaque semaine', value: 'chaque_semaine' },
  { label: 'Toutes les 2 semaines', value: 'toutes_les_2_semaines' },
  { label: 'Chaque mois', value: 'chaque_mois' }
]

export type RecurrenceType = 'aucune' | 'chaque_jour_ouvre' | 'chaque_jour' | 'chaque_semaine' | 'toutes_les_2_semaines' | 'chaque_mois'

// --- Candidats (recrutement) ---

export const CANDIDAT_STATUTS = {
  premier_contact: { label: 'Premier contact', color: 'blue', icon: 'i-lucide-phone-outgoing', order: 1 },
  entretien_prevu: { label: 'Entretien prevu', color: 'violet', icon: 'i-lucide-calendar-clock', order: 2 },
  entretien_passe: { label: 'Entretien passe', color: 'sky', icon: 'i-lucide-message-square-check', order: 3 },
  promesse: { label: 'Promesse', color: 'amber', icon: 'i-lucide-handshake', order: 4 },
  convention_signee: { label: 'Convention signee', color: 'green', icon: 'i-lucide-file-check', order: 5 },
  echec: { label: 'Echec', color: 'red', icon: 'i-lucide-x-circle', order: 99 }
} as const

export const CANDIDAT_PIPELINE_ORDER: (keyof typeof CANDIDAT_STATUTS)[] = [
  'premier_contact', 'entretien_prevu', 'entretien_passe', 'promesse', 'convention_signee'
]

export const CANAL_ENTRETIEN_OPTIONS = [
  { value: 'presentiel', label: 'Présentiel', icon: 'i-lucide-map-pin' },
  { value: 'visio', label: 'Visio', icon: 'i-lucide-video' },
  { value: 'telephone', label: 'Téléphone', icon: 'i-lucide-phone' },
  { value: 'autre', label: 'Autre', icon: 'i-lucide-circle-help' }
] as const

export const CANDIDAT_SOURCES = [
  'Site web', 'LinkedIn', 'Indeed', 'Cooptation',
  'Candidature spontanee', 'Salon / Evenement', 'Ecole / Universite', 'Autre'
] as const
