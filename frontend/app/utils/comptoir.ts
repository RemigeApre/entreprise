// Helpers partages du Comptoir (statuts de lieu, hierarchie).

export const LIEU_STATUTS = [
  { value: 'vente', label: 'Lieu de vente', icon: 'i-lucide-store', cls: 'bg-[#AF8F3C]/15 text-[#AF8F3C]', hex: '#AF8F3C' },
  { value: 'stockage', label: 'Lieu de stockage', icon: 'i-lucide-package', cls: 'bg-sky-900/30 text-sky-400', hex: '#0284c7' },
  { value: 'futur', label: 'Futur lieu', icon: 'i-lucide-clock', cls: 'bg-stone-700/50 text-stone-400', hex: '#78716c' }
] as const

export function lieuStatutMeta(s?: string) {
  return LIEU_STATUTS.find(x => x.value === s) || LIEU_STATUTS[1]
}

// Icones disponibles pour personnaliser un lieu
export const LIEU_ICONES = [
  'i-lucide-store', 'i-lucide-house', 'i-lucide-warehouse', 'i-lucide-package',
  'i-lucide-building', 'i-lucide-tent', 'i-lucide-archive', 'i-lucide-box',
  'i-lucide-shopping-bag', 'i-lucide-truck', 'i-lucide-landmark', 'i-lucide-map-pin'
] as const

// Icone/couleur affichees d'un lieu : valeur perso, sinon defaut du statut.
export function lieuIconeAffichee(l?: { icone?: string | null; statut?: string } | null): string {
  return l?.icone || lieuStatutMeta(l?.statut).icon
}
export function lieuCouleurAffichee(l?: { couleur?: string | null; statut?: string } | null): string {
  return l?.couleur || lieuStatutMeta(l?.statut).hex
}

// Renvoie l'id du lieu parent (gere m2o objet ou id brut), ou null si principal.
export function lieuParentId(l: unknown): number | null {
  const p = (l as { parent?: unknown })?.parent
  if (p == null) return null
  return typeof p === 'object' ? (p as { id: number }).id : (p as number)
}

// ── Roles vendeurs ──
export const VENDEUR_ROLES = [
  { value: 'directeur', label: 'Directeur' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'employe', label: 'Employé' },
  { value: 'general', label: 'Profil général' }
] as const

export function vendeurRoleLabel(r?: string): string {
  return VENDEUR_ROLES.find(x => x.value === r)?.label || 'Employé'
}

// ── Personnalisation des profils ──
export const VENDEUR_ICONES = [
  'i-lucide-user', 'i-lucide-crown', 'i-lucide-star', 'i-lucide-heart',
  'i-lucide-sparkles', 'i-lucide-smile', 'i-lucide-glasses', 'i-lucide-cat',
  'i-lucide-bird', 'i-lucide-feather', 'i-lucide-coffee', 'i-lucide-rocket',
  'i-lucide-ghost', 'i-lucide-flower-2', 'i-lucide-gem', 'i-lucide-music'
] as const

export const VENDEUR_COULEURS = [
  '#AF8F3C', '#b74d34', '#6B8F71', '#7A6A8A', '#4f7da3',
  '#c2710c', '#8B6F4E', '#9d4f6c', '#3f8f7a', '#5a6b8c'
] as const

export function vendeurIcone(v?: { icone?: string | null } | null): string {
  return v?.icone || 'i-lucide-user'
}
export function vendeurCouleur(v?: { couleur?: string | null } | null): string {
  return v?.couleur || '#AF8F3C'
}
