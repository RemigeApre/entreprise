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
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-400 dark:border-emerald-600',
    dot: 'bg-emerald-500'
  },
  teletravail: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/40',
    text: 'text-indigo-800 dark:text-indigo-200',
    border: 'border-indigo-400 dark:border-indigo-600',
    dot: 'bg-indigo-500'
  },
  ecole: {
    bg: 'bg-sky-100 dark:bg-sky-900/40',
    text: 'text-sky-800 dark:text-sky-200',
    border: 'border-sky-400 dark:border-sky-600',
    dot: 'bg-sky-500'
  },
  conge: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-800 dark:text-orange-200',
    border: 'border-orange-400 dark:border-orange-600',
    dot: 'bg-orange-500'
  },
  absent: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-400 dark:border-red-600',
    dot: 'bg-red-500'
  },
  ferie: {
    bg: 'bg-stone-200 dark:bg-stone-700/50',
    text: 'text-stone-600 dark:text-stone-300',
    border: 'border-stone-400 dark:border-stone-600',
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
