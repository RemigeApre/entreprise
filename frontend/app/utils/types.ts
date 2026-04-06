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
  actif_prospection: boolean
  objectif_prospection: number | null
  date_naissance: string | null
  visibilite_profil: VisibiliteProfil | null
  ecole: string | null
  statut_emploi: StatutEmploi | null
}

export type VisibiliteNiveau = 'tous' | 'pole' | 'admin'

export interface VisibiliteProfil {
  telephone?: VisibiliteNiveau
  linkedin?: VisibiliteNiveau
  localisation?: VisibiliteNiveau
  bio?: VisibiliteNiveau
  date_naissance?: VisibiliteNiveau
}

export interface Role {
  id: string
  name: string
  admin_access: boolean
  app_access: boolean
}

export type TypeContrat = 'CDI' | 'CDD' | 'Freelance' | 'Alternance' | 'Stage'
export type StatutEmploi = 'a_venir' | 'actif' | 'test' | 'bloque' | 'termine'
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

export type ProspectStatut = 'a_contacter' | 'premier_contact' | 'en_discussion' | 'client' | 'cloture'
export type MotifCloture = 'concurrent' | 'ferme' | 'refus' | 'autre'
export type ContactCanal = 'email' | 'telephone' | 'linkedin' | 'en_personne' | 'site_web' | 'autre'
export type ContactResultat = 'refus' | 'attente' | 'retenter' | 'ligne_coupee' | 'positif' | 'absent'
export type OffreProspectStatut = 'a_proposer' | 'proposee' | 'negociation' | 'acceptee' | 'refusee'
export type OrigineProspection = 'google_maps' | 'linkedin' | 'pages_jaunes' | 'bouche_a_oreille' | 'salon' | 'site_web' | 'autre'
export type NiveauSite = 'pas_de_site' | 'site_casse' | 'site_nul' | 'site_passable'

export interface Prospect {
  id: string
  nom_entreprise: string
  ville: string
  secteur: string | null
  adresse: string | null
  telephone: string | null
  telephones_secondaires: string | null
  email: string | null
  emails_secondaires: string | null
  site_web: string | null
  contact_nom: string | null
  notes: string | null
  prospecteur: UserProfile | string
  statut: ProspectStatut
  motif_cloture: MotifCloture | null
  origine: OrigineProspection | null
  niveau_site: NiveauSite | null
  nb_contacts: number
  historique_contacts?: ContactHistory[]
  offres?: ProspectOffre[]
  date_created: string
  date_updated: string | null
  user_created: string
}

export interface ContactHistory {
  id: string
  prospect: Prospect | string
  canal: ContactCanal
  resultat: ContactResultat
  date_contact: string
  notes: string
  contacte_par: UserProfile | string
  date_created: string
}

export interface ProspectOffre {
  id: string
  prospect: Prospect | string
  titre: string
  montant: number | null
  statut: OffreProspectStatut
  notes: string | null
  ajoutee_par: UserProfile | string
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

export interface UserDocument {
  id: number
  utilisateur: UserProfile | string
  fichier: string // directus_files id
  nom: string
  date_created: string
}

export interface OffreEmploiCategoryJunction {
  offres_emploi_id: string
  categories_id: Category | string
}

export interface OffreEmploi {
  id: string
  titre: string
  duree: string | null           // durée du contrat (pour CDD, Stage, Alternance)
  description: string            // présentation de l'entreprise
  missions: string | null        // missions du poste
  type_contrat: TypeContrat
  localisation: string
  teletravail: string | null
  salaire_min: number | null
  salaire_max: number | null
  salaire_periode: 'heure' | 'mois' | 'annee' | null
  categorie: Category | string | null
  categories?: OffreEmploiCategoryJunction[]
  competences_requises: string | null  // attendus
  avantages: string | null             // ce que vous gagnez
  conditions: string | null            // conditions
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

export interface MonitoredSite {
  id: string
  nom: string
  url: string
  actif: boolean
  utilisateurs?: MonitoredSiteUser[]
}

export interface MonitoredSiteUser {
  id: number
  monitored_site: MonitoredSite | string
  utilisateur: UserProfile | string
}

export type CandidatStatut = 'premier_contact' | 'entretien_prevu' | 'entretien_passe' | 'promesse' | 'convention_signee' | 'echec'
export type ContactOrigin = 'sortant' | 'entrant'
export type RetourAttenduDe = 'nous' | 'candidat'
export type CanalEntretien = 'presentiel' | 'visio' | 'telephone' | 'autre'

export interface Candidat {
  id: string
  prenom: string
  nom: string
  email: string | null
  telephone: string | null
  linkedin: string | null
  source: string | null
  statut: CandidatStatut
  contact_origin: ContactOrigin | null
  date_contact: string | null
  retour_attendu_de: RetourAttenduDe | null
  date_entretien: string | null
  canal_entretien: CanalEntretien | null
  second_entretien: boolean | null
  discord_id: string | null
  date_debut_stage: string | null
  date_fin_stage: string | null
  notes: string | null
  offre: OffreEmploi | string | null
  cv: string | null
  commentaires?: CandidatCommentaire[]
  date_created: string
  date_updated: string | null
  user_created: string
}

export interface CandidatCommentaire {
  id: string
  candidat: Candidat | string
  contenu: string
  auteur: UserProfile | string
  date_created: string
}

export type TicketType = 'bug' | 'faille_securite' | 'panne' | 'amelioration' | 'fonctionnalite' | 'autre'
export type TicketStatut = 'ouvert' | 'en_cours' | 'resolu' | 'ferme'
export type TicketPriorite = 'basse' | 'normale' | 'haute' | 'critique'

export interface Ticket {
  id: string
  projet: Project | string
  titre: string
  description: string | null
  type: TicketType
  statut: TicketStatut
  priorite: TicketPriorite
  assigne_a: UserProfile | string | null
  rapporte_par: UserProfile | string | null
  date_created: string
  date_updated: string | null
  user_created: string
}

export type ScheduleCategorie = 'reunion_client' | 'reunion_interne' | 'reunion_financement' | 'entretien_rh' | 'indispo_perso' | 'autre'

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

export type ArticleStatut = 'brouillon' | 'publie' | 'programme'

export interface Article {
  id: string
  titre: string
  contenu: string
  statut: ArticleStatut
  date_publication: string | null
  auteur: UserProfile | string
  date_created: string
  date_updated: string | null
  user_created: string
}

export type EvenementType = 'personnel' | 'equipe' | 'entreprise'
export type EvenementParticipantStatut = 'invite' | 'accepte' | 'refuse'

export interface EvenementParticipant {
  id: string
  evenement: string
  user: UserProfile | string
  statut: EvenementParticipantStatut
}

export interface Evenement {
  id: string
  titre: string
  description: string | null
  lieu: string | null
  date_debut: string  // ISO: '2026-03-16T09:00:00'
  date_fin: string    // ISO: '2026-03-16T10:00:00'
  toute_journee: boolean
  couleur: string | null
  type: EvenementType
  organisateur: UserProfile | string
  participants?: EvenementParticipant[]
  date_created: string
  user_created: string
}

export type CanalRdv = 'visio' | 'telephone' | 'physique'

export interface RecruteurDisponibilite {
  id: string
  jour_semaine: number // 1=Lun..5=Ven
  heure_debut: string  // "09:00"
  heure_fin: string    // "12:00"
  canaux: CanalRdv[]
  note: string | null
  actif: boolean
}

export interface CandidatBookingToken {
  id: string
  token: string
  candidat: string
  expires_at: string
  utilise: boolean
}

// --- Finance ---

export type TransactionType = 'recette' | 'depense' | 'fondateur'
export type TransactionRecurrence = 'unique' | 'mensuel' | 'trimestriel' | 'annuel'
export type RecurrenceCertitude = 'stricte' | 'theorique'

export interface CategorieFinance {
  id: string
  label: string
  type: TransactionType
  icone: string | null
  sous_categorie: string | null
  date_created: string
}

export interface Transaction {
  id: string
  libelle: string
  montant: number
  montant_reel: number | null
  taux_taxe: number | null
  type: TransactionType
  categorie: CategorieFinance | string | null
  date: string
  recurrence: TransactionRecurrence
  recurrence_certitude: RecurrenceCertitude | null
  recurrence_debut: string | null
  recurrence_fin: string | null
  notes: string | null
  projet: Project | string | null
  date_created: string
  user_created: string
}

// --- Materiel ---

export type MaterielEtat = 'neuf' | 'bon' | 'use' | 'hs' | 'a_acquerir' | 'vendu'
export type MaterielCategorie = 'informatique' | 'commercial' | 'bureau' | 'admin'
export type AchatType = 'ponctuel' | 'recurrent'
export type AchatStatut = 'a_acheter' | 'commande' | 'recu'
export type ProduitType = 'livre' | 'derive' | 'artisanat' | 'service' | 'autre'

export interface Materiel {
  id: string
  code: string
  nom: string
  type_materiel: string
  categorie: MaterielCategorie
  description: string | null
  quantite: number
  etat: MaterielEtat
  affecte_a: UserProfile | string | null
  cout: number | null
  notes: string | null
  date_created: string
  user_created: string
}

export interface ProduitEdition {
  id: string
  produit: Produit | string
  numero: number
  nom_edition: string
  prix_vente: number
  prix_numerique: number | null
  prix_physique: number | null
  cout_impression: number | null
  cout_fixe: number | null
  prix_revient: number | null
  stock: number | null
  notes: string | null
  date_created: string
}

export interface Produit {
  id: string
  code: string
  nom: string
  sous_titre: string | null
  auteur: string | null
  sous_categorie: string | null
  type_produit: ProduitType
  prix_numerique: number | null
  prix_physique: number | null
  prix_vente: number
  cout_impression: number | null
  cout_fixe: number | null
  prix_revient: number | null
  stock: number | null
  a_stock: boolean
  fait_main: boolean
  editions: ProduitEdition[]
  description: string | null
  notes: string | null
  date_created: string
  user_created: string
}

export interface AchatPrevu {
  id: string
  nom: string
  categorie: MaterielCategorie
  prix_estime: number | null
  quantite: number
  type: AchatType
  statut: AchatStatut
  prochaine_date: string | null
  recurrence_mois: number | null
  notes: string | null
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
  prospect_offres: ProspectOffre[]
  projects: Project[]
  projects_members: ProjectMember[]
  project_tasks: ProjectTask[]
  project_files: ProjectFile[]
  offres_emploi: OffreEmploi[]
  offres_emploi_categories: OffreEmploiCategoryJunction[]
  notifications: Notification[]
  wiki_pages: WikiPage[]
  schedule_entries: ScheduleEntry[]
  monitored_sites: MonitoredSite[]
  monitored_sites_users: MonitoredSiteUser[]
  project_tickets: Ticket[]
  candidats: Candidat[]
  candidat_commentaires: CandidatCommentaire[]
  articles: Article[]
  evenements: Evenement[]
  evenements_participants: EvenementParticipant[]
  transactions: Transaction[]
  materiels: Materiel[]
  produits: Produit[]
  achats_prevus: AchatPrevu[]
  directus_users: UserProfile[]
  recruteur_disponibilites: RecruteurDisponibilite[]
  candidat_booking_tokens: CandidatBookingToken[]
}
