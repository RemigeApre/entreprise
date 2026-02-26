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
  conge: { label: 'Conge', color: 'orange', icon: 'i-lucide-plane' },
  ecole: { label: 'Ecole', color: 'blue', icon: 'i-lucide-graduation-cap' },
  absent: { label: 'Absent', color: 'red', icon: 'i-lucide-x-circle' },
  ferie: { label: 'Ferie', color: 'neutral', icon: 'i-lucide-calendar-off' }
} as const

export const PLANNING_COLORS: Record<string, { bg: string, text: string, border: string, dot: string }> = {
  travail: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500'
  },
  teletravail: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    dot: 'bg-teal-500'
  },
  ecole: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-300 dark:border-sky-700',
    dot: 'bg-sky-500'
  },
  conge: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    dot: 'bg-amber-500'
  },
  absent: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    dot: 'bg-red-500'
  },
  ferie: {
    bg: 'bg-stone-100 dark:bg-stone-800/50',
    text: 'text-stone-500 dark:text-stone-400',
    border: 'border-stone-300 dark:border-stone-700',
    dot: 'bg-stone-400'
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
  nouveau: { label: 'Nouveau', color: 'blue' },
  en_cours: { label: 'En cours', color: 'yellow' },
  converti: { label: 'Converti', color: 'green' },
  perdu: { label: 'Perdu', color: 'red' },
  en_pause: { label: 'En pause', color: 'neutral' }
} as const

export const CONTACT_CANAUX = {
  email: { label: 'Email', icon: 'i-lucide-mail' },
  telephone: { label: 'Telephone', icon: 'i-lucide-phone' },
  linkedin: { label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  en_personne: { label: 'En personne', icon: 'i-lucide-users' },
  autre: { label: 'Autre', icon: 'i-lucide-message-circle' }
} as const

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

export const CONTRACT_TYPES = {
  CDI: 'CDI',
  CDD: 'CDD',
  Freelance: 'Freelance',
  Alternance: 'Alternance',
  Stage: 'Stage'
} as const

export const PROJECT_ROLES = [
  'Chef de projet',
  'Developpeur',
  'Designer',
  'Redacteur',
  'Charge de communication',
  'Freelance',
  'Consultant',
  'Autre'
] as const
