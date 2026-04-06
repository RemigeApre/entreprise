<script setup lang="ts">
import type { Produit, ProduitType } from '~/utils/types'
import { PRODUIT_TYPES } from '~/utils/constants'

const { isDirecteur } = useAuth()
if (!isDirecteur.value) navigateTo('/dashboard')

const { getAllProduits, createProduit, updateProduit, removeProduit } = useMateriel()
const toast = useToast()

const { data: produits, status, refresh } = useAsyncData('produits', getAllProduits)

const filterType = ref<ProduitType | 'all'>('all')

const filtered = computed(() => {
  if (!produits.value) return []
  return produits.value.filter(p => filterType.value === 'all' || p.type_produit === filterType.value)
})

const groupedByType = computed(() => {
  const groups: { type: ProduitType; config: typeof PRODUIT_TYPES[keyof typeof PRODUIT_TYPES]; items: Produit[] }[] = []
  const types = filterType.value === 'all'
    ? Object.keys(PRODUIT_TYPES) as ProduitType[]
    : [filterType.value]
  for (const t of types) {
    const items = (produits.value || []).filter(p => p.type_produit === t)
    if (items.length) groups.push({ type: t, config: PRODUIT_TYPES[t], items })
  }
  return groups
})

const stockItems = computed(() => filtered.value.filter(p => p.a_stock))
const totalStock = computed(() => stockItems.value.reduce((s, p) => s + (p.stock || 0), 0))
const totalValeur = computed(() => stockItems.value.reduce((s, p) => s + p.prix_vente * (p.stock || 0), 0))

const countByType = computed(() => {
  if (!produits.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const p of produits.value) c[p.type_produit] = (c[p.type_produit] || 0) + 1
  return c
})

// --- Form ---
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const form = reactive({
  nom: '',
  sous_titre: '',
  auteur: '',
  type_produit: 'livre' as ProduitType,
  prix_vente: null as number | null,
  prix_numerique: null as number | null,
  prix_physique: null as number | null,
  cout_impression: null as number | null,
  cout_fixe: null as number | null,
  prix_revient: null as number | null,
  a_stock: true,
  stock: 0,
  edition: '',
  fait_main: false,
  description: '',
  notes: ''
})

function resetForm() {
  form.nom = ''; form.sous_titre = ''; form.auteur = ''
  form.type_produit = filterType.value !== 'all' ? filterType.value : 'livre'
  form.prix_vente = null; form.prix_numerique = null; form.prix_physique = null
  form.cout_impression = null; form.cout_fixe = null; form.prix_revient = null
  form.a_stock = form.type_produit !== 'service'; form.stock = 0
  form.edition = ''; form.fait_main = false
  form.description = ''; form.notes = ''
  editingId.value = null
}

function openAdd() { resetForm(); showForm.value = true }

function openEdit(p: Produit) {
  editingId.value = p.id; form.nom = p.nom; form.sous_titre = p.sous_titre || ''
  form.auteur = p.auteur || ''; form.type_produit = p.type_produit
  form.prix_vente = p.prix_vente; form.prix_numerique = p.prix_numerique
  form.prix_physique = p.prix_physique; form.cout_impression = p.cout_impression
  form.cout_fixe = p.cout_fixe; form.prix_revient = p.prix_revient
  form.a_stock = p.a_stock; form.stock = p.stock || 0
  form.edition = p.edition || ''; form.fait_main = p.fait_main
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
  if (!form.nom.trim() || !form.prix_vente) return
  saving.value = true
  try {
    const data: any = {
      nom: form.nom.trim(),
      sous_titre: form.sous_titre.trim() || null,
      auteur: form.auteur.trim() || null,
      type_produit: form.type_produit,
      prix_vente: form.prix_vente,
      prix_numerique: form.prix_numerique || null,
      prix_physique: form.prix_physique || null,
      cout_impression: form.cout_impression || null,
      cout_fixe: form.cout_fixe || null,
      prix_revient: form.prix_revient || null,
      a_stock: form.a_stock,
      stock: form.a_stock ? (form.stock || 0) : null,
      edition: form.edition.trim() || null,
      fait_main: form.fait_main,
      description: form.description.trim() || null,
      notes: form.notes.trim() || null
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
  const newStock = Math.max(0, (p.stock || 0) + delta)
  try { await updateProduit(p.id, { stock: newStock }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function getDisplayPrice(p: Produit): string {
  const parts: string[] = []
  if (p.prix_physique) parts.push(`${formatMoney(p.prix_physique)} phys.`)
  if (p.prix_numerique) parts.push(`${formatMoney(p.prix_numerique)} num.`)
  if (!parts.length) return `${formatMoney(p.prix_vente)} \u20ac`
  return parts.join(' / ')
}
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
              <UIcon :name="config.icon" class="size-3" />
              {{ config.label }}
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

          <div v-else class="space-y-6">
            <div v-for="group in groupedByType" :key="group.type">
              <div class="flex items-center gap-2 mb-3">
                <UIcon :name="group.config.icon" class="size-4 text-[#AF8F3C]" />
                <p class="text-xs font-semibold text-stone-600 uppercase tracking-wider">{{ group.config.label }}s</p>
                <span class="text-xs text-stone-400 tabular-nums">{{ group.items.length }}</span>
                <div class="flex-1 h-px bg-stone-200/60" />
              </div>

              <div class="space-y-2">
                <div
                  v-for="p in group.items" :key="p.id"
                  class="group rounded-xl bg-white/60 border border-white/70 hover:border-[rgba(175,143,60,0.15)] hover:shadow-sm transition-all"
                >
                  <div class="flex items-center gap-3 px-4 py-3">
                    <div class="size-10 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(175,143,60,0.06)]">
                      <UIcon :name="group.config.icon" class="size-5 text-[#AF8F3C]" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="text-sm font-semibold text-stone-800 truncate">{{ p.nom }}</p>
                        <span v-if="p.edition" class="shrink-0 text-[10px] font-medium text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">{{ p.edition }}</span>
                        <span v-if="p.fait_main" class="shrink-0 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <UIcon name="i-lucide-hand" class="size-2.5" /> Fait main
                        </span>
                      </div>
                      <p v-if="p.sous_titre" class="text-xs text-stone-500 italic truncate">{{ p.sous_titre }}</p>
                      <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span class="text-[10px] font-mono text-stone-400">{{ p.code }}</span>
                        <span v-if="p.auteur" class="text-[11px] text-stone-500">par {{ p.auteur }}</span>
                        <span v-if="p.description" class="text-[11px] text-stone-400 truncate">{{ p.description }}</span>
                      </div>
                    </div>

                    <!-- Stock -->
                    <div v-if="p.a_stock" class="flex items-center gap-1 shrink-0">
                      <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, -1)">
                        <UIcon name="i-lucide-minus" class="size-3" />
                      </button>
                      <span class="text-sm font-bold tabular-nums w-8 text-center" :class="(p.stock || 0) === 0 ? 'text-red-500' : (p.stock || 0) <= 5 ? 'text-amber-600' : 'text-stone-800'">{{ p.stock || 0 }}</span>
                      <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, 1)">
                        <UIcon name="i-lucide-plus" class="size-3" />
                      </button>
                    </div>
                    <span v-else class="shrink-0 text-[10px] text-stone-400 bg-stone-50 px-2 py-1 rounded">Sans stock</span>

                    <!-- Prices -->
                    <div class="shrink-0 text-right min-w-[90px]">
                      <p class="text-sm font-bold text-stone-800 tabular-nums">{{ formatMoney(p.prix_vente) }} &euro;</p>
                      <div v-if="p.prix_numerique || p.prix_physique" class="text-[10px] text-stone-400 tabular-nums">
                        <span v-if="p.prix_physique">{{ formatMoney(p.prix_physique) }} phys.</span>
                        <span v-if="p.prix_physique && p.prix_numerique"> / </span>
                        <span v-if="p.prix_numerique">{{ formatMoney(p.prix_numerique) }} num.</span>
                      </div>
                      <p v-if="p.cout_impression || p.cout_fixe" class="text-[10px] text-stone-400 tabular-nums">
                        <span v-if="p.cout_impression">impr. {{ formatMoney(p.cout_impression) }}</span>
                        <span v-if="p.cout_impression && p.cout_fixe"> + </span>
                        <span v-if="p.cout_fixe">fixe {{ formatMoney(p.cout_fixe) }}</span>
                      </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button class="p-1 rounded hover:bg-stone-100 transition-colors" @click="openEdit(p)"><UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" /></button>
                      <button class="p-1 rounded hover:bg-red-50 transition-colors" @click="handleDelete(p.id)"><UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add/Edit modal -->
    <UModal :open="showForm" @update:open="val => { if (!val) { showForm = false; resetForm() } }">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">{{ editingId ? 'Modifier le produit' : 'Nouveau produit' }}</h3>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Type selector -->
            <div class="flex flex-wrap gap-2 justify-center">
              <button
                v-for="([key, config]) in Object.entries(PRODUIT_TYPES)" :key="key"
                type="button"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all"
                :class="form.type_produit === key ? 'bg-[#AF8F3C] text-white border-[#AF8F3C]' : 'bg-white/70 text-stone-600 border-stone-200 hover:border-stone-300'"
                @click="form.type_produit = key as ProduitType"
              >
                <UIcon :name="config.icon" class="size-4" /> {{ config.label }}
              </button>
            </div>

            <!-- Nom + Auteur -->
            <div :class="isLivre ? 'grid grid-cols-2 gap-3' : ''">
              <UFormField label="Nom" required>
                <UInput v-model="form.nom" :placeholder="isLivre ? 'Titre du livre' : 'Nom du produit'" icon="i-lucide-text" class="w-full" />
              </UFormField>
              <UFormField v-if="isLivre" label="Auteur">
                <UInput v-model="form.auteur" placeholder="Nom de l'auteur" icon="i-lucide-user" class="w-full" />
              </UFormField>
            </div>

            <!-- Sous-titre + Edition (livres) -->
            <div v-if="isLivre" class="grid grid-cols-2 gap-3">
              <UFormField label="Sous-titre">
                <UInput v-model="form.sous_titre" placeholder="Sous-titre ou accroche" class="w-full" />
              </UFormField>
              <UFormField label="Edition">
                <UInput v-model="form.edition" placeholder="1ere edition, collector, poche..." icon="i-lucide-layers" class="w-full" />
                <template #hint><span class="text-[10px] text-stone-400">Une fiche par edition</span></template>
              </UFormField>
            </div>

            <!-- Auteur (non-livres, optionnel) -->
            <UFormField v-if="!isLivre && (form.type_produit === 'artisanat' || form.type_produit === 'derive')" label="Createur / Artisan">
              <UInput v-model="form.auteur" placeholder="Optionnel" icon="i-lucide-user" class="w-full" />
            </UFormField>

            <!-- Prix de vente -->
            <div class="space-y-1">
              <p class="text-xs font-semibold text-stone-600">Prix de vente</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField label="Prix principal" required>
                  <UInput v-model.number="form.prix_vente" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" />
                </UFormField>
                <UFormField v-if="isLivre || form.type_produit === 'derive'" label="Prix numerique">
                  <UInput v-model.number="form.prix_numerique" type="number" :min="0" step="0.01" placeholder="Optionnel" class="w-full" />
                </UFormField>
                <UFormField v-if="isLivre || form.type_produit === 'derive'" label="Prix physique">
                  <UInput v-model.number="form.prix_physique" type="number" :min="0" step="0.01" placeholder="Optionnel" class="w-full" />
                </UFormField>
              </div>
            </div>

            <!-- Couts de production -->
            <div class="space-y-1">
              <p class="text-xs font-semibold text-stone-600">Couts de production</p>
              <div class="grid grid-cols-3 gap-3">
                <UFormField v-if="isLivre" label="Cout impression/unite">
                  <UInput v-model.number="form.cout_impression" type="number" :min="0" step="0.01" placeholder="Par exemplaire" icon="i-lucide-printer" class="w-full" />
                </UFormField>
                <UFormField label="Cout fixe">
                  <UInput v-model.number="form.cout_fixe" type="number" :min="0" step="0.01" :placeholder="isLivre ? 'Illustrations, maquette...' : 'Couts ponctuels'" icon="i-lucide-receipt" class="w-full" />
                </UFormField>
                <UFormField label="Prix de revient">
                  <UInput v-model.number="form.prix_revient" type="number" :min="0" step="0.01" placeholder="Cout total/unite" class="w-full" />
                  <template #hint><span class="text-[10px] text-stone-400">Pour calcul de marge</span></template>
                </UFormField>
              </div>
            </div>

            <!-- Stock + Fait main -->
            <div class="flex items-center gap-6 flex-wrap">
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="flex items-center justify-center size-5 rounded border-2 transition-all" :class="form.a_stock ? 'bg-primary border-primary' : 'border-stone-300'" @click="form.a_stock = !form.a_stock">
                  <UIcon v-if="form.a_stock" name="i-lucide-check" class="size-3 text-white" />
                </div>
                <span class="text-sm text-stone-700">Gestion de stock</span>
              </label>
              <UInput v-if="form.a_stock" v-model.number="form.stock" type="number" :min="0" placeholder="Quantite" size="sm" class="w-28" />

              <label v-if="form.type_produit === 'artisanat' || form.type_produit === 'derive'" class="flex items-center gap-2 cursor-pointer">
                <div class="flex items-center justify-center size-5 rounded border-2 transition-all" :class="form.fait_main ? 'bg-amber-500 border-amber-500' : 'border-stone-300'" @click="form.fait_main = !form.fait_main">
                  <UIcon v-if="form.fait_main" name="i-lucide-check" class="size-3 text-white" />
                </div>
                <span class="text-sm text-stone-700">Fait main</span>
              </label>
            </div>

            <!-- Description + Notes -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Description"><UInput v-model="form.description" placeholder="Description courte..." class="w-full" /></UFormField>
              <UFormField label="Notes"><UInput v-model="form.notes" placeholder="Notes internes..." class="w-full" /></UFormField>
            </div>

            <!-- Code preview -->
            <p v-if="!editingId" class="text-[11px] text-stone-400">Code auto : {{ PRODUIT_TYPES[form.type_produit]?.prefix || '??' }}-XXXX</p>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
              <UButton v-if="editingId" label="Supprimer" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDelete(editingId!); showForm = false; resetForm()" />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showForm = false; resetForm()" />
                <UButton type="submit" :label="editingId ? 'Enregistrer' : 'Ajouter'" :icon="editingId ? 'i-lucide-check' : 'i-lucide-plus'" :loading="saving" :disabled="!form.nom.trim() || !form.prix_vente" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
