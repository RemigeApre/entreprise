<script setup lang="ts">
import type { Produit, ProduitType, ProduitEdition } from '~/utils/types'
import { PRODUIT_TYPES } from '~/utils/constants'

const { isDirecteur } = useAuth()
if (!isDirecteur.value) navigateTo('/dashboard')

const { getAllProduits, createProduit, updateProduit, removeProduit, getAllEditions, createEdition, updateEdition, removeEdition } = useMateriel()
const toast = useToast()

const { data: rawProduits, status, refresh: refreshProduits } = useAsyncData('produits', getAllProduits)
const { data: rawEditions, refresh: refreshEditions } = useAsyncData('produit-editions', getAllEditions)

async function refresh() {
  await Promise.all([refreshProduits(), refreshEditions()])
}

// Merge editions into products
const produits = computed<Produit[]>(() => {
  if (!rawProduits.value) return []
  const editionsByProduit = new Map<number, ProduitEdition[]>()
  for (const e of (rawEditions.value || [])) {
    const pid = typeof e.produit === 'object' ? e.produit.id : e.produit
    const list = editionsByProduit.get(pid) || []
    list.push(e as ProduitEdition)
    editionsByProduit.set(pid, list)
  }
  return rawProduits.value.map(p => ({
    ...p,
    editions: (editionsByProduit.get(Number(p.id)) || []).sort((a, b) => a.numero - b.numero)
  }))
})

const filterType = ref<ProduitType | 'all'>('all')

const filtered = computed(() => {
  if (!produits.value) return []
  return produits.value.filter(p => filterType.value === 'all' || p.type_produit === filterType.value)
})

interface SubGroup { label: string | null; items: Produit[] }
interface TypeGroup { type: ProduitType; config: typeof PRODUIT_TYPES[keyof typeof PRODUIT_TYPES]; subGroups: SubGroup[] }

const groupedByType = computed<TypeGroup[]>(() => {
  const groups: TypeGroup[] = []
  const types = filterType.value === 'all' ? Object.keys(PRODUIT_TYPES) as ProduitType[] : [filterType.value]
  for (const t of types) {
    const items = (produits.value || []).filter(p => p.type_produit === t)
    if (!items.length) continue

    // Group by sous_categorie within each type
    const subMap = new Map<string | null, Produit[]>()
    for (const p of items) {
      const key = p.sous_categorie || null
      const list = subMap.get(key) || []
      list.push(p)
      subMap.set(key, list)
    }
    // Sort: named categories first (alphabetically), then null
    const subGroups = [...subMap.entries()]
      .sort((a, b) => {
        if (!a[0] && b[0]) return 1
        if (a[0] && !b[0]) return -1
        return (a[0] || '').localeCompare(b[0] || '')
      })
      .map(([label, items]) => ({ label, items }))

    groups.push({ type: t, config: PRODUIT_TYPES[t], subGroups })
  }
  return groups
})

const stockItems = computed(() => filtered.value.filter(p => p.a_stock))
const totalStock = computed(() => {
  let total = 0
  for (const p of stockItems.value) {
    if (p.editions?.length) {
      for (const e of p.editions) total += e.stock || 0
    } else {
      total += p.stock || 0
    }
  }
  return total
})
const totalValeur = computed(() => {
  let total = 0
  for (const p of stockItems.value) {
    if (p.editions?.length) {
      for (const e of p.editions) total += e.prix_vente * (e.stock || 0)
    } else {
      total += p.prix_vente * (p.stock || 0)
    }
  }
  return total
})

const countByType = computed(() => {
  if (!produits.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const p of produits.value) c[p.type_produit] = (c[p.type_produit] || 0) + 1
  return c
})

// --- Product Form ---
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive({
  nom: '', sous_titre: '', auteur: '', sous_categorie: '',
  type_produit: 'livre' as ProduitType,
  prix_vente: null as number | null,
  prix_numerique: null as number | null, prix_physique: null as number | null,
  cout_impression: null as number | null, cout_fixe: null as number | null,
  prix_revient: null as number | null,
  a_stock: true, stock: 0, fait_main: false,
  description: '', notes: ''
})

// Existing sous_categories for autocomplete
const existingSousCategories = computed(() => {
  if (!produits.value) return []
  const set = new Set<string>()
  for (const p of produits.value) {
    if (p.sous_categorie && p.type_produit === form.type_produit) set.add(p.sous_categorie)
  }
  return [...set].sort()
})

function resetForm() {
  form.nom = ''; form.sous_titre = ''; form.auteur = ''; form.sous_categorie = ''
  form.type_produit = filterType.value !== 'all' ? filterType.value : 'livre'
  form.prix_vente = null; form.prix_numerique = null; form.prix_physique = null
  form.cout_impression = null; form.cout_fixe = null; form.prix_revient = null
  form.a_stock = form.type_produit !== 'service'; form.stock = 0; form.fait_main = false
  form.description = ''; form.notes = ''; editingId.value = null
}

function openAdd() { resetForm(); showForm.value = true }
function openEdit(p: Produit) {
  editingId.value = p.id; form.nom = p.nom; form.sous_titre = p.sous_titre || ''
  form.auteur = p.auteur || ''; form.sous_categorie = p.sous_categorie || ''
  form.type_produit = p.type_produit
  form.prix_vente = p.prix_vente; form.prix_numerique = p.prix_numerique
  form.prix_physique = p.prix_physique; form.cout_impression = p.cout_impression
  form.cout_fixe = p.cout_fixe; form.prix_revient = p.prix_revient
  form.a_stock = p.a_stock; form.stock = p.stock || 0; form.fait_main = p.fait_main
  form.description = p.description || ''; form.notes = p.notes || ''
  showForm.value = true
}

watch(() => form.type_produit, t => {
  if (t === 'service') { form.a_stock = false; form.fait_main = false }
  else if (t === 'artisanat') form.fait_main = true
  else form.fait_main = false
})

const isLivre = computed(() => form.type_produit === 'livre')

async function handleSubmit() {
  if (!form.nom.trim() || (!isLivre.value && !form.prix_vente)) return
  // Livres avec editions : prix_vente peut etre 0 (les editions ont leur propre prix)
  saving.value = true
  try {
    const data: any = {
      nom: form.nom.trim(), sous_titre: form.sous_titre.trim() || null,
      auteur: form.auteur.trim() || null, sous_categorie: form.sous_categorie.trim() || null,
      type_produit: form.type_produit,
      prix_vente: form.prix_vente || 0,
      prix_numerique: form.prix_numerique || null, prix_physique: form.prix_physique || null,
      cout_impression: form.cout_impression || null, cout_fixe: form.cout_fixe || null,
      prix_revient: form.prix_revient || null,
      a_stock: form.a_stock, stock: form.a_stock ? (form.stock || 0) : null,
      fait_main: form.fait_main,
      description: form.description.trim() || null, notes: form.notes.trim() || null
    }
    if (editingId.value) {
      await updateProduit(editingId.value, data)
      toast.add({ title: 'Produit modifie', color: 'success' })
    } else {
      await createProduit(data)
      toast.add({ title: 'Produit ajoute', color: 'success' })
    }
    showForm.value = false; resetForm(); await refresh()
  } catch { toast.add({ title: 'Erreur', color: 'error' }) }
  finally { saving.value = false }
}

async function handleDelete(id: string) {
  try { await removeProduit(id); toast.add({ title: 'Supprime', color: 'success' }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

async function adjustStock(p: Produit, delta: number) {
  try { await updateProduit(p.id, { stock: Math.max(0, (p.stock || 0) + delta) }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

async function adjustEditionStock(e: ProduitEdition, delta: number) {
  try { await updateEdition(e.id, { stock: Math.max(0, (e.stock || 0) + delta) }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Edition Form ---
const showEditionForm = ref(false)
const editionForProduct = ref<Produit | null>(null)
const editingEditionId = ref<string | null>(null)
const savingEdition = ref(false)
const editionForm = reactive({
  nom_edition: '', prix_vente: null as number | null,
  prix_numerique: null as number | null, prix_physique: null as number | null,
  cout_impression: null as number | null, cout_fixe: null as number | null,
  prix_revient: null as number | null, stock: 0, notes: ''
})

function resetEditionForm() {
  editionForm.nom_edition = ''; editionForm.prix_vente = null
  editionForm.prix_numerique = null; editionForm.prix_physique = null
  editionForm.cout_impression = null; editionForm.cout_fixe = null
  editionForm.prix_revient = null; editionForm.stock = 0; editionForm.notes = ''
  editingEditionId.value = null
}

function openAddEdition(p: Produit) {
  editionForProduct.value = p; resetEditionForm(); showEditionForm.value = true
}

function openEditEdition(p: Produit, e: ProduitEdition) {
  editionForProduct.value = p; editingEditionId.value = e.id
  editionForm.nom_edition = e.nom_edition; editionForm.prix_vente = e.prix_vente
  editionForm.prix_numerique = e.prix_numerique; editionForm.prix_physique = e.prix_physique
  editionForm.cout_impression = e.cout_impression; editionForm.cout_fixe = e.cout_fixe
  editionForm.prix_revient = e.prix_revient; editionForm.stock = e.stock || 0
  editionForm.notes = e.notes || ''; showEditionForm.value = true
}

async function handleEditionSubmit() {
  if (!editionForm.nom_edition.trim() || !editionForm.prix_vente || !editionForProduct.value) return
  savingEdition.value = true
  try {
    const data: any = {
      produit: editionForProduct.value.id,
      nom_edition: editionForm.nom_edition.trim(),
      prix_vente: editionForm.prix_vente,
      prix_numerique: editionForm.prix_numerique || null,
      prix_physique: editionForm.prix_physique || null,
      cout_impression: editionForm.cout_impression || null,
      cout_fixe: editionForm.cout_fixe || null,
      prix_revient: editionForm.prix_revient || null,
      stock: editionForm.stock || 0,
      notes: editionForm.notes.trim() || null
    }
    if (editingEditionId.value) {
      await updateEdition(editingEditionId.value, data)
      toast.add({ title: 'Edition modifiee', color: 'success' })
    } else {
      const nextNum = (editionForProduct.value.editions?.length || 0) + 1
      data.numero = nextNum
      await createEdition(data)
      toast.add({ title: 'Edition ajoutee', color: 'success' })
    }
    showEditionForm.value = false; resetEditionForm(); await refresh()
  } catch { toast.add({ title: 'Erreur', color: 'error' }) }
  finally { savingEdition.value = false }
}

async function handleDeleteEdition(id: string) {
  try { await removeEdition(id); toast.add({ title: 'Edition supprimee', color: 'success' }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

function getEditionCode(p: Produit, e: ProduitEdition): string {
  return `${p.code}-${e.numero}`
}

function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Produits">
      <template #right>
        <UButton label="Ajouter" icon="i-lucide-plus" size="sm" @click="openAdd" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Summary -->
        <div class="px-4 sm:px-6 pt-4 pb-2">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Stock total</p>
              <p class="text-lg font-bold text-stone-800 tabular-nums">{{ totalStock }} <span class="text-xs font-normal text-stone-400">unites</span></p>
            </div>
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Valeur stock</p>
              <p class="text-lg font-bold text-stone-800 tabular-nums">{{ formatMoney(totalValeur) }} &euro;</p>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="px-4 sm:px-6 py-2.5 border-b border-stone-200/40">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'all' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = 'all'"
            >Tous <span class="opacity-60 tabular-nums">{{ produits?.length || 0 }}</span></button>
            <button
              v-for="(config, key) in PRODUIT_TYPES" :key="key"
              class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === key ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = filterType === key ? 'all' : (key as ProduitType)"
            >
              <UIcon :name="config.icon" class="size-3" /> {{ config.label }}
              <span v-if="countByType[key]" class="opacity-60 tabular-nums">{{ countByType[key] }}</span>
            </button>
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4 max-w-4xl mx-auto">
          <div v-if="!filtered.length" class="text-center py-12">
            <UIcon name="i-lucide-tag" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucun produit</p>
            <UButton label="Ajouter un produit" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="openAdd" />
          </div>

          <div v-else class="space-y-8">
            <div v-for="group in groupedByType" :key="group.type">
              <div class="flex items-center gap-2 mb-3">
                <UIcon :name="group.config.icon" class="size-4 text-[#AF8F3C]" />
                <p class="text-xs font-semibold text-stone-600 uppercase tracking-wider">{{ group.config.label }}s</p>
                <span class="text-xs text-stone-400 tabular-nums">{{ group.subGroups.reduce((s, g) => s + g.items.length, 0) }}</span>
                <div class="flex-1 h-px bg-stone-200/60" />
              </div>

              <div class="space-y-4">
                <div v-for="sub in group.subGroups" :key="sub.label || '_none'">
                  <!-- Sub-category label -->
                  <p v-if="sub.label" class="text-[11px] font-medium text-stone-500 mb-1.5 pl-1 flex items-center gap-1.5">
                    <UIcon name="i-lucide-tag" class="size-3 text-stone-400" />
                    {{ sub.label }}
                    <span class="text-stone-400 tabular-nums">{{ sub.items.length }}</span>
                  </p>

                  <div class="space-y-2">
                <div
                  v-for="p in sub.items" :key="p.id"
                  class="rounded-xl bg-white/60 border border-white/70 hover:border-[rgba(175,143,60,0.15)] hover:shadow-sm transition-all overflow-hidden"
                >
                  <!-- Main product row -->
                  <div class="group flex items-center gap-3 px-4 py-3">
                    <div class="size-10 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(175,143,60,0.06)]">
                      <UIcon :name="group.config.icon" class="size-5 text-[#AF8F3C]" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-stone-800 truncate">{{ p.nom }}</p>
                        <span v-if="p.fait_main" class="shrink-0 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <UIcon name="i-lucide-hand" class="size-2.5" /> Fait main
                        </span>
                        <span v-if="p.editions?.length" class="shrink-0 text-[10px] font-medium text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded-full">
                          {{ p.editions.length }} edition{{ p.editions.length > 1 ? 's' : '' }}
                        </span>
                      </div>
                      <p v-if="p.sous_titre" class="text-xs text-stone-500 italic truncate">{{ p.sous_titre }}</p>
                      <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span class="text-[10px] font-mono text-stone-400">{{ p.code }}</span>
                        <span v-if="p.auteur && p.type_produit === 'livre'" class="text-[11px] text-stone-500">par {{ p.auteur }}</span>
                        <span v-if="p.description" class="text-[11px] text-stone-400 truncate">{{ p.description }}</span>
                      </div>
                    </div>

                    <!-- Stock (only if no editions) -->
                    <template v-if="!p.editions?.length">
                      <div v-if="p.a_stock" class="flex items-center gap-1 shrink-0">
                        <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, -1)"><UIcon name="i-lucide-minus" class="size-3" /></button>
                        <span class="text-sm font-bold tabular-nums w-8 text-center" :class="(p.stock || 0) === 0 ? 'text-red-500' : (p.stock || 0) <= 5 ? 'text-amber-600' : 'text-stone-800'">{{ p.stock || 0 }}</span>
                        <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, 1)"><UIcon name="i-lucide-plus" class="size-3" /></button>
                      </div>
                      <span v-else class="shrink-0 text-[10px] text-stone-400 bg-stone-50 px-2 py-1 rounded">Sans stock</span>

                      <div class="shrink-0 text-right min-w-[90px]">
                        <p class="text-sm font-bold text-stone-800 tabular-nums">{{ formatMoney(p.prix_vente) }} &euro;</p>
                        <div v-if="p.prix_numerique || p.prix_physique" class="text-[10px] text-stone-400 tabular-nums">
                          <span v-if="p.prix_physique">{{ formatMoney(p.prix_physique) }} phys.</span>
                          <span v-if="p.prix_physique && p.prix_numerique"> / </span>
                          <span v-if="p.prix_numerique">{{ formatMoney(p.prix_numerique) }} num.</span>
                        </div>
                      </div>
                    </template>

                    <!-- Actions -->
                    <div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1 rounded hover:bg-stone-100 transition-colors" @click="openEdit(p)"><UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" /></button>
                      <button class="p-1 rounded hover:bg-red-50 transition-colors" @click="handleDelete(p.id)"><UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" /></button>
                    </div>
                  </div>

                  <!-- Editions (livres) -->
                  <div v-if="p.type_produit === 'livre'" class="border-t border-stone-100">
                    <!-- Existing editions -->
                    <div
                      v-for="e in (p.editions || [])" :key="e.id"
                      class="group/ed flex items-center gap-3 px-4 py-2.5 pl-14 hover:bg-stone-50/50 transition-colors border-b border-stone-50"
                    >
                      <div class="size-7 rounded flex items-center justify-center shrink-0 bg-primary/5">
                        <span class="text-[10px] font-bold text-primary/60">{{ e.numero }}</span>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-stone-700">{{ e.nom_edition }}</p>
                        <span class="text-[10px] font-mono text-stone-400">{{ getEditionCode(p, e) }}</span>
                        <span v-if="e.notes" class="text-[11px] text-stone-400 ml-2">{{ e.notes }}</span>
                      </div>

                      <!-- Edition stock -->
                      <div v-if="p.a_stock" class="flex items-center gap-1 shrink-0">
                        <button class="size-5 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustEditionStock(e, -1)"><UIcon name="i-lucide-minus" class="size-2.5" /></button>
                        <span class="text-xs font-bold tabular-nums w-6 text-center" :class="(e.stock || 0) === 0 ? 'text-red-500' : (e.stock || 0) <= 5 ? 'text-amber-600' : 'text-stone-700'">{{ e.stock || 0 }}</span>
                        <button class="size-5 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustEditionStock(e, 1)"><UIcon name="i-lucide-plus" class="size-2.5" /></button>
                      </div>

                      <!-- Edition price -->
                      <div class="shrink-0 text-right min-w-[80px]">
                        <p class="text-sm font-bold text-stone-700 tabular-nums">{{ formatMoney(e.prix_vente) }} &euro;</p>
                        <div v-if="e.prix_numerique || e.prix_physique" class="text-[10px] text-stone-400 tabular-nums">
                          <span v-if="e.prix_physique">{{ formatMoney(e.prix_physique) }} phys.</span>
                          <span v-if="e.prix_physique && e.prix_numerique"> / </span>
                          <span v-if="e.prix_numerique">{{ formatMoney(e.prix_numerique) }} num.</span>
                        </div>
                      </div>

                      <div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/ed:opacity-100 transition-opacity">
                        <button class="p-1 rounded hover:bg-stone-100 transition-colors" @click="openEditEdition(p, e)"><UIcon name="i-lucide-pencil" class="size-3 text-stone-400" /></button>
                        <button class="p-1 rounded hover:bg-red-50 transition-colors" @click="handleDeleteEdition(e.id)"><UIcon name="i-lucide-trash-2" class="size-3 text-stone-400 hover:text-red-400" /></button>
                      </div>
                    </div>

                    <!-- Add edition button -->
                    <button
                      class="flex items-center gap-2 w-full px-4 py-2 pl-14 text-xs text-primary/60 hover:text-primary hover:bg-primary/3 transition-colors"
                      @click="openAddEdition(p)"
                    >
                      <UIcon name="i-lucide-plus" class="size-3.5" />
                      Ajouter une edition
                    </button>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Product modal -->
    <UModal :open="showForm" @update:open="val => { if (!val) { showForm = false; resetForm() } }">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">{{ editingId ? 'Modifier le produit' : 'Nouveau produit' }}</h3>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <div class="flex flex-wrap gap-2 justify-center">
              <button v-for="([key, config]) in Object.entries(PRODUIT_TYPES)" :key="key" type="button"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all"
                :class="form.type_produit === key ? 'bg-[#AF8F3C] text-white border-[#AF8F3C]' : 'bg-white/70 text-stone-600 border-stone-200 hover:border-stone-300'"
                @click="form.type_produit = key as ProduitType"
              ><UIcon :name="config.icon" class="size-4" /> {{ config.label }}</button>
            </div>
            <!-- Nom + Auteur (livres) or Nom + Categorie (autres) -->
            <div :class="isLivre ? 'grid grid-cols-2 gap-3' : ''">
              <UFormField label="Nom" required><UInput v-model="form.nom" :placeholder="isLivre ? 'Titre du livre' : 'Nom du produit'" icon="i-lucide-text" class="w-full" /></UFormField>
              <UFormField v-if="isLivre" label="Auteur"><UInput v-model="form.auteur" placeholder="Nom de l'auteur" icon="i-lucide-user" class="w-full" /></UFormField>
            </div>
            <UFormField v-if="isLivre" label="Sous-titre"><UInput v-model="form.sous_titre" placeholder="Sous-titre ou accroche" class="w-full" /></UFormField>

            <!-- Categorie (non-livres) -->
            <UFormField v-if="!isLivre" label="Categorie">
              <UInput
                v-model="form.sous_categorie"
                :placeholder="form.type_produit === 'derive' ? 'Marque-page, Autocollant, Poster...' : form.type_produit === 'artisanat' ? 'Cotte de maille, Linogravure...' : form.type_produit === 'service' ? 'Site vitrine, Application, Maintenance...' : 'Categorie...'"
                icon="i-lucide-tag"
                class="w-full"
              />
              <div v-if="existingSousCategories.length" class="flex flex-wrap gap-1 mt-1.5">
                <button
                  v-for="c in existingSousCategories" :key="c"
                  type="button"
                  class="px-2 py-0.5 rounded-full text-[11px] transition-all border"
                  :class="form.sous_categorie === c
                    ? 'bg-[#AF8F3C] text-white border-[#AF8F3C]'
                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300'"
                  @click="form.sous_categorie = form.sous_categorie === c ? '' : c"
                >{{ c }}</button>
              </div>
            </UFormField>

            <!-- Prix (hidden for books with editions, they use edition prices) -->
            <template v-if="!isLivre">
              <div class="space-y-1">
                <p class="text-xs font-semibold text-stone-600">Prix</p>
                <div class="grid grid-cols-2 gap-3">
                  <UFormField label="Prix de vente" required><UInput v-model.number="form.prix_vente" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" /></UFormField>
                  <UFormField label="Prix de revient"><UInput v-model.number="form.prix_revient" type="number" :min="0" step="0.01" placeholder="Optionnel" class="w-full" /></UFormField>
                </div>
              </div>
            </template>
            <template v-else>
              <p class="text-xs text-stone-400 italic">Les prix et stocks se gerent par edition. Creez le livre puis ajoutez des editions.</p>
            </template>

            <div class="flex items-center gap-6 flex-wrap">
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="flex items-center justify-center size-5 rounded border-2 transition-all" :class="form.a_stock ? 'bg-primary border-primary' : 'border-stone-300'" @click="form.a_stock = !form.a_stock"><UIcon v-if="form.a_stock" name="i-lucide-check" class="size-3 text-white" /></div>
                <span class="text-sm text-stone-700">Gestion de stock</span>
              </label>
              <UInput v-if="form.a_stock && !isLivre" v-model.number="form.stock" type="number" :min="0" placeholder="Quantite" size="sm" class="w-28" />
              <label v-if="form.type_produit === 'artisanat' || form.type_produit === 'derive'" class="flex items-center gap-2 cursor-pointer">
                <div class="flex items-center justify-center size-5 rounded border-2 transition-all" :class="form.fait_main ? 'bg-amber-500 border-amber-500' : 'border-stone-300'" @click="form.fait_main = !form.fait_main"><UIcon v-if="form.fait_main" name="i-lucide-check" class="size-3 text-white" /></div>
                <span class="text-sm text-stone-700">Fait main</span>
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Description"><UInput v-model="form.description" placeholder="Description courte..." class="w-full" /></UFormField>
              <UFormField label="Notes"><UInput v-model="form.notes" placeholder="Notes internes..." class="w-full" /></UFormField>
            </div>
            <p v-if="!editingId" class="text-[11px] text-stone-400">Code auto : {{ PRODUIT_TYPES[form.type_produit]?.prefix || '??' }}-XXXX</p>
            <div class="flex items-center justify-between pt-2">
              <UButton v-if="editingId" label="Supprimer" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDelete(editingId!); showForm = false; resetForm()" />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showForm = false; resetForm()" />
                <UButton type="submit" :label="editingId ? 'Enregistrer' : 'Ajouter'" :icon="editingId ? 'i-lucide-check' : 'i-lucide-plus'" :loading="saving" :disabled="!form.nom.trim()" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Edition modal -->
    <UModal :open="showEditionForm" @update:open="val => { if (!val) { showEditionForm = false; resetEditionForm() } }">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 mb-1">
            {{ editingEditionId ? 'Modifier l\'edition' : 'Nouvelle edition' }}
          </h3>
          <p v-if="editionForProduct" class="text-sm text-stone-500 mb-5">
            {{ editionForProduct.nom }} <span class="font-mono text-xs text-stone-400">{{ editionForProduct.code }}-{{ (editionForProduct.editions?.length || 0) + (editingEditionId ? 0 : 1) }}</span>
          </p>
          <form class="space-y-4" @submit.prevent="handleEditionSubmit">
            <UFormField label="Nom de l'edition" required>
              <UInput v-model="editionForm.nom_edition" placeholder="Ex: 1ere edition, Edition collector, Poche..." icon="i-lucide-layers" class="w-full" />
            </UFormField>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-stone-600">Prix</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField label="Prix principal" required><UInput v-model.number="editionForm.prix_vente" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" /></UFormField>
                <UFormField label="Prix numerique"><UInput v-model.number="editionForm.prix_numerique" type="number" :min="0" step="0.01" placeholder="Optionnel" class="w-full" /></UFormField>
                <UFormField label="Prix physique"><UInput v-model.number="editionForm.prix_physique" type="number" :min="0" step="0.01" placeholder="Optionnel" class="w-full" /></UFormField>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-semibold text-stone-600">Couts</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField label="Impression/unite"><UInput v-model.number="editionForm.cout_impression" type="number" :min="0" step="0.01" placeholder="Par ex." icon="i-lucide-printer" class="w-full" /></UFormField>
                <UFormField label="Cout fixe"><UInput v-model.number="editionForm.cout_fixe" type="number" :min="0" step="0.01" placeholder="Illus, maquette..." icon="i-lucide-receipt" class="w-full" /></UFormField>
                <UFormField label="Revient/unite"><UInput v-model.number="editionForm.prix_revient" type="number" :min="0" step="0.01" placeholder="Total/unite" class="w-full" /></UFormField>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Stock"><UInput v-model.number="editionForm.stock" type="number" :min="0" placeholder="Quantite" class="w-full" /></UFormField>
              <UFormField label="Notes"><UInput v-model="editionForm.notes" placeholder="Optionnel..." class="w-full" /></UFormField>
            </div>
            <div class="flex items-center justify-between pt-2">
              <UButton v-if="editingEditionId" label="Supprimer" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDeleteEdition(editingEditionId!); showEditionForm = false; resetEditionForm()" />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showEditionForm = false; resetEditionForm()" />
                <UButton type="submit" :label="editingEditionId ? 'Enregistrer' : 'Ajouter'" :icon="editingEditionId ? 'i-lucide-check' : 'i-lucide-plus'" :loading="savingEdition" :disabled="!editionForm.nom_edition.trim() || !editionForm.prix_vente" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
