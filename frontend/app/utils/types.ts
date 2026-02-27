export interface Category {
  id: string
  nom: string
  description: string | null
  couleur: string | null
}

export interface UserProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar: string | null
  role: Role | string
  telephone: string | null
  linkedin: string | null
  localisation: string | null
  bio: string | null
  date_debut_contrat: string | null
  date_fin_contrat: string | null
  date_fin_periode_essai: string | null
  actif: boolean
  categorie: Category | string | null
  type_contrat: TypeContrat | null
}

export interface Role {
  id: string
  name: string
  admin_access: boolean
  app_access: boolean
}

export type TypeContrat = 'CDI' | 'CDD' | 'Freelance' | 'Alternance' | 'Stage'
export type RoleName = 'Directeur' | 'Employe' | 'Freelance' | 'Alternant' | 'Stagiaire'

export type PlanningPeriode = 'matin' | 'apres_midi'
export type PlanningType = 'travail' | 'conge' | 'ecole' | 'absent' | 'ferie'
export type PlanningStatut = 'valide' | 'en_attente' | 'refuse'

export interface PlanningEntry {
  id: string
  utilisateur: UserProfile | string
  date: string
  periode: PlanningPeriode
  type: PlanningType
  statut: PlanningStatut
  motif: string | null
  heures: number | null
  commentaire: string | null
  valide_par: UserProfile | string | null
  date_validation: string | null
  date_created: string
  user_created: string
}

export type CongeType = 'conge_paye' | 'rtt' | 'maladie' | 'sans_solde' | 'arret_maladie' | 'autre'
export type CongeStatut = 'en_attente' | 'approuve' | 'refuse'

export interface CongeRequest {
  id: string
  demandeur: UserProfile | string
  date_debut: string
  date_fin: string
  motif: string
  type_conge: CongeType
  statut: CongeStatut
  reponse_commentaire: string | null
  traite_par: UserProfile | string | null
  date_traitement: string | null
  date_created: string
  user_created: string
}

export type ProspectStatut = 'nouveau' | 'en_cours' | 'converti' | 'perdu' | 'en_pause'
export type ContactCanal = 'email' | 'telephone' | 'linkedin' | 'en_personne' | 'autre'

export interface Prospect {
  id: string
  nom_entreprise: string
  secteur: string | null
  adresse: string | null
  telephone: string | null
  email: string | null
  site_web: string | null
  date_premier_contact: string
  notes: string | null
  prospecteur: UserProfile | string
  statut: ProspectStatut
  historique_contacts?: ContactHistory[]
  date_created: string
  user_created: string
}

export interface ContactHistory {
  id: string
  prospect: Prospect | string
  canal: ContactCanal
  date_contact: string
  notes: string
  contacte_par: UserProfile | string
  date_created: string
}

export type ProjectStatut = 'brouillon' | 'en_cours' | 'en_pause' | 'termine' | 'annule'
export type TaskStatut = 'a_faire' | 'en_cours' | 'termine'
export type TaskPriorite = 'basse' | 'normale' | 'haute' | 'urgente'

export interface Project {
  id: string
  nom: string
  description: string | null
  statut: ProjectStatut
  date_debut: string | null
  date_fin: string | null
  budget: number | null
  categorie: Category | string | null
  client: Prospect | string | null
  membres?: ProjectMember[]
  taches?: ProjectTask[]
  fichiers?: ProjectFile[]
  date_created: string
  user_created: string
}

export interface ProjectMember {
  id: number
  project: Project | string
  utilisateur: UserProfile | string
  role_projet: string | null
}

export interface ProjectTask {
  id: string
  project: Project | string
  titre: string
  description: string | null
  statut: TaskStatut
  priorite: TaskPriorite | null
  assigne_a: UserProfile | string | null
  date_echeance: string | null
  ordre: number | null
  date_created: string
  user_created: string
}

export interface ProjectFile {
  id: number
  project: Project | string
  fichier: string // directus_files id
  description: string | null
}

export interface OffreEmploi {
  id: string
  titre: string
  description: string
  type_contrat: TypeContrat
  localisation: string
  salaire_min: number | null
  salaire_max: number | null
  salaire_periode: 'heure' | 'mois' | 'annee' | null
  categorie: Category | string | null
  competences_requises: string | null
  avantages: string | null
  publie: boolean
  date_publication: string | null
  date_expiration: string | null
  date_created: string
  user_created: string
}

export interface Notification {
  id: string
  utilisateur: UserProfile | string
  message: string
  type: 'planning_modifie' | 'conge_statut' | 'info'
  lu: boolean
  lien: string | null
  date_created: string
}

export interface WikiPage {
  id: string
  titre: string
  slug: string
  contenu: string
  icone: string | null
  couleur: string | null
  ordre: number
  actif: boolean
  date_created: string
  date_updated: string | null
}

export type ScheduleCategorie = 'reunion_client' | 'reunion_interne' | 'reunion_financement' | 'indispo_perso' | 'autre'

export interface ScheduleEntry {
  id: string
  utilisateur: UserProfile | string
  date: string
  heure_debut: string // "09:00"
  heure_fin: string   // "10:30"
  titre: string
  categorie: ScheduleCategorie
  description: string | null
  date_created: string
  user_created: string
}

// Directus schema type for SDK
export interface DirectusSchema {
  categories: Category[]
  planning_entries: PlanningEntry[]
  conges_requests: CongeRequest[]
  prospects: Prospect[]
  contacts_history: ContactHistory[]
  projects: Project[]
  projects_members: ProjectMember[]
  project_tasks: ProjectTask[]
  project_files: ProjectFile[]
  offres_emploi: OffreEmploi[]
  notifications: Notification[]
  wiki_pages: WikiPage[]
  schedule_entries: ScheduleEntry[]
  directus_users: UserProfile[]
}
