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

export const PROSPECT_STATUTS = {
  a_contacter: { label: 'A contacter', color: 'neutral', icon: 'i-lucide-phone-outgoing' },
  premier_contact: { label: 'Premier contact', color: 'blue', icon: 'i-lucide-phone-call' },
  en_discussion: { label: 'En discussion', color: 'yellow', icon: 'i-lucide-message-square' },
  client: { label: 'Client', color: 'green', icon: 'i-lucide-handshake' },
  cloture: { label: 'Cloture', color: 'red', icon: 'i-lucide-x-circle' }
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
