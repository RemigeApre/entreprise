// Helpers partages du Comptoir (statuts de lieu, hierarchie).

export const LIEU_STATUTS = [
  { value: 'vente', label: 'Lieu de vente', icon: 'i-lucide-store', cls: 'bg-[#AF8F3C]/15 text-[#AF8F3C]', band: 'bg-[#AF8F3C]' },
  { value: 'stockage', label: 'Lieu de stockage', icon: 'i-lucide-package', cls: 'bg-sky-900/30 text-sky-400', band: 'bg-sky-600' },
  { value: 'futur', label: 'Futur lieu', icon: 'i-lucide-clock', cls: 'bg-stone-700/50 text-stone-400', band: 'bg-stone-500' }
] as const

export function lieuStatutMeta(s?: string) {
  return LIEU_STATUTS.find(x => x.value === s) || LIEU_STATUTS[1]
}

// Renvoie l'id du lieu parent (gere m2o objet ou id brut), ou null si principal.
export function lieuParentId(l: unknown): number | null {
  const p = (l as { parent?: unknown })?.parent
  if (p == null) return null
  return typeof p === 'object' ? (p as { id: number }).id : (p as number)
}
