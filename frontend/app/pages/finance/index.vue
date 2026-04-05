<script setup lang="ts">
import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Transaction, TransactionType, TransactionRecurrence, RecurrenceCertitude } from '~/utils/types'
import { TRANSACTION_RECURRENCES } from '~/utils/constants'

const { isDirecteur } = useAuth()
const { $directus } = useNuxtApp()
const { getAll, create, update, remove } = useFinance()
const { categories, loaded: catsLoaded, loadCategories, createCategory, getCategoriesByType, getCategoryLabel, getCategoryIcon } = useFinanceCategories()
const toast = useToast()

const { data: transactions, status, refresh } = useAsyncData('transactions', getAll)

onMounted(() => { if (!catsLoaded.value) loadCategories() })

// --- View mode ---
const view = ref<'transactions' | 'graphiques' | 'fondateur'>('transactions')
watch(view, v => { if (v === 'fondateur' && !depensesFondateur.value.length) loadDepensesFondateur() })

// --- Filters (transactions view) ---
const search = ref('')

const filtered = computed(() => {
  if (!transactions.value) return []
  if (!search.value) return transactions.value
  const q = search.value.toLowerCase()
  return transactions.value.filter(t =>
    t.libelle.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)
  )
})

// --- Totals on ALL transactions ---
const totals = computed(() => {
  if (!transactions.value) return { recettes: 0, depenses: 0, fondateur: 0, solde: 0 }
  const recettes = transactions.value.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0)
  const depenses = transactions.value.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  const fondateur = transactions.value.filter(t => t.type === 'fondateur').reduce((s, t) => s + t.montant, 0)
  return { recettes, depenses, fondateur, solde: recettes + fondateur - depenses }
})

// --- Pagination ---
const { paginatedItems: pagedTransactions, page, totalPages, showPagination, next, prev } = usePagination(filtered, 50)

// --- Group paginated transactions by date ---
interface DateGroup { label: string; date: string; transactions: Transaction[] }

const groupedByDate = computed<DateGroup[]>(() => {
  const map = new Map<string, Transaction[]>()
  for (const t of pagedTransactions.value) {
    const key = t.date
    const list = map.get(key) || []
    list.push(t)
    map.set(key, list)
  }
  return [...map.entries()].map(([date, txs]) => ({ label: formatDateLong(date), date, transactions: txs }))
})

// ==============================
// GRAPHIQUES
// ==============================

interface MonthPoint { label: string; month: string; recettes: number; depenses: number; solde: number; forecast?: boolean }

const chartMonths = computed<MonthPoint[]>(() => {
  if (!transactions.value?.length) return []
  const monthly = new Map<string, { recettes: number; depenses: number }>()
  for (const t of transactions.value) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = monthly.get(key) || { recettes: 0, depenses: 0 }
    if (t.type === 'depense') m.depenses += t.montant
    else m.recettes += t.montant
    monthly.set(key, m)
  }
  const sortedKeys = [...monthly.keys()].sort()
  const points: MonthPoint[] = []
  let balance = 0
  for (const key of sortedKeys) {
    const m = monthly.get(key)!
    balance += m.recettes - m.depenses
    const [y, mo] = key.split('-')
    points.push({ label: new Date(+y, +mo - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), month: key, recettes: m.recettes, depenses: m.depenses, solde: balance })
  }
  // Forecast 2 months
  const recurNet = getMonthlyRecurringNet()
  const now = new Date()
  for (let i = 1; i <= 2; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i)
    balance += recurNet
    points.push({ label: futureDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), month: '', recettes: 0, depenses: 0, solde: balance, forecast: true })
  }
  return points.slice(-10)
})

function getMonthlyRecurringNet(): number {
  if (!transactions.value) return 0
  let net = 0
  const now = new Date()
  for (const t of transactions.value) {
    if (t.recurrence === 'unique') continue
    if (t.recurrence_fin && new Date(t.recurrence_fin) < now) continue
    const weight = t.recurrence_certitude === 'theorique' ? 0.5 : 1
    let m = t.montant
    if (t.recurrence === 'trimestriel') m /= 3
    if (t.recurrence === 'annuel') m /= 12
    if (t.type === 'depense') net -= m * weight
    else net += m * weight
  }
  return net
}

// SVG chart helpers
const CW = 600; const CH = 180; const CP = { t: 20, r: 20, b: 30, l: 10 }

function svgPath(values: number[]): string {
  if (values.length < 2) return ''
  const w = CW - CP.l - CP.r; const h = CH - CP.t - CP.b
  const min = Math.min(...values, 0); const max = Math.max(...values, 1); const range = max - min || 1
  return 'M' + values.map((v, i) => `${CP.l + (i / (values.length - 1)) * w},${CP.t + h - ((v - min) / range) * h}`).join(' L')
}
function svgArea(values: number[]): string {
  if (values.length < 2) return ''
  const w = CW - CP.l - CP.r; const h = CH - CP.t - CP.b; const bottom = CP.t + h
  const min = Math.min(...values, 0); const max = Math.max(...values, 1); const range = max - min || 1
  const pts = values.map((v, i) => `${CP.l + (i / (values.length - 1)) * w},${CP.t + h - ((v - min) / range) * h}`).join(' L')
  return `M${CP.l},${bottom} L${pts} L${CP.l + w},${bottom} Z`
}
function svgZeroY(values: number[]): number {
  const h = CH - CP.t - CP.b; const min = Math.min(...values, 0); const max = Math.max(...values, 1); const range = max - min || 1
  return CP.t + h - ((0 - min) / range) * h
}
function svgDotY(value: number, values: number[]): number {
  const h = CH - CP.t - CP.b; const min = Math.min(...values, 0); const max = Math.max(...values, 1); const range = max - min || 1
  return CP.t + h - ((value - min) / range) * h
}
function svgDotX(i: number, total: number): number {
  return CP.l + (i / (total - 1)) * (CW - CP.l - CP.r)
}

// --- Intermediary / Tax stats ---
const intermediaryStats = computed(() => {
  if (!transactions.value) return { totalPaye: 0, totalRecu: 0, commission: 0, count: 0 }
  let totalPaye = 0; let totalRecu = 0; let count = 0
  for (const t of transactions.value) {
    if (t.montant_reel && t.montant_reel > t.montant) {
      totalPaye += t.montant_reel; totalRecu += t.montant; count++
    }
  }
  return { totalPaye, totalRecu, commission: totalPaye - totalRecu, count }
})

const taxStats = computed(() => {
  if (!transactions.value) return { totalBrut: 0, totalTaxe: 0, count: 0 }
  let totalBrut = 0; let totalTaxe = 0; let count = 0
  for (const t of transactions.value) {
    if (t.taux_taxe && t.taux_taxe > 0 && t.type === 'recette') {
      totalBrut += t.montant; totalTaxe += t.montant * (t.taux_taxe / 100); count++
    }
  }
  return { totalBrut, totalTaxe, count }
})

const monthlyRecurring = computed(() => getMonthlyRecurringNet())

// --- Fondateur tab (depenses perso, hors solde) ---
interface DepenseFondateur {
  id: string
  libelle: string
  montant: number
  recurrent: boolean
  frequence: string | null
  notes: string | null
  date_created: string
}

const depensesFondateur = ref<DepenseFondateur[]>([])
const depensesFondateurLoading = ref(false)

async function loadDepensesFondateur() {
  depensesFondateurLoading.value = true
  try {
    depensesFondateur.value = await $directus.request(readItems('depenses_fondateur', {
      fields: ['*'],
      sort: ['-date_created'],
      limit: -1
    })) as DepenseFondateur[]
  } catch { depensesFondateur.value = [] }
  finally { depensesFondateurLoading.value = false }
}

const fondateurPonctuels = computed(() => depensesFondateur.value.filter(d => !d.recurrent))
const fondateurRecurrents = computed(() => depensesFondateur.value.filter(d => d.recurrent))

const fondateurTotal = computed(() => depensesFondateur.value.reduce((s, d) => s + d.montant, 0))
const fondateurMensuel = computed(() => {
  let total = 0
  for (const d of fondateurRecurrents.value) {
    let m = d.montant
    if (d.frequence === 'trimestriel') m /= 3
    if (d.frequence === 'annuel') m /= 12
    total += m
  }
  return total
})

// Fondateur form
const showFondateurForm = ref(false)
const editingFondateurId = ref<string | null>(null)
const savingFondateur = ref(false)
const fondateurForm = reactive({
  libelle: '',
  montant: null as number | null,
  recurrent: false,
  frequence: 'mensuel' as string,
  notes: ''
})

function resetFondateurForm() {
  fondateurForm.libelle = ''; fondateurForm.montant = null
  fondateurForm.recurrent = false; fondateurForm.frequence = 'mensuel'
  fondateurForm.notes = ''; editingFondateurId.value = null
}

function openAddFondateur() { resetFondateurForm(); showFondateurForm.value = true }
function openEditFondateur(d: DepenseFondateur) {
  editingFondateurId.value = d.id; fondateurForm.libelle = d.libelle
  fondateurForm.montant = d.montant; fondateurForm.recurrent = d.recurrent
  fondateurForm.frequence = d.frequence || 'mensuel'; fondateurForm.notes = d.notes || ''
  showFondateurForm.value = true
}

async function handleFondateurSubmit() {
  if (!fondateurForm.libelle.trim() || !fondateurForm.montant) return
  savingFondateur.value = true
  try {
    const data = {
      libelle: fondateurForm.libelle.trim(),
      montant: fondateurForm.montant,
      recurrent: fondateurForm.recurrent,
      frequence: fondateurForm.recurrent ? fondateurForm.frequence : null,
      notes: fondateurForm.notes.trim() || null
    }
    if (editingFondateurId.value) {
      await $directus.request(updateItem('depenses_fondateur', editingFondateurId.value, data))
      toast.add({ title: 'Modifie', color: 'success' })
    } else {
      await $directus.request(createItem('depenses_fondateur', data))
      toast.add({ title: 'Ajoute', color: 'success' })
    }
    showFondateurForm.value = false; resetFondateurForm(); await loadDepensesFondateur()
  } catch { toast.add({ title: 'Erreur', color: 'error' }) }
  finally { savingFondateur.value = false }
}

async function handleDeleteFondateur(id: string) {
  try { await $directus.request(deleteItem('depenses_fondateur', id)); toast.add({ title: 'Supprime', color: 'success' }); await loadDepensesFondateur() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Form state ---
const showForm = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  libelle: '',
  montant: null as number | null,
  montant_reel: null as number | null,
  taux_taxe: null as number | null,
  type: 'depense' as TransactionType,
  categorie: null as string | null,
  date: new Date().toISOString().split('T')[0],
  recurrence: 'unique' as TransactionRecurrence,
  recurrence_certitude: 'stricte' as RecurrenceCertitude,
  recurrence_debut: '' as string,
  recurrence_fin: '' as string,
  notes: ''
})

const recOptions = Object.entries(TRANSACTION_RECURRENCES).map(([value, c]) => ({ label: c.label, value }))
const formCategories = computed(() => getCategoriesByType(form.type).map(c => ({ label: c.sous_categorie ? `${c.label} (${c.sous_categorie})` : c.label, value: c.id })))

watch(() => form.type, () => { const cats = getCategoriesByType(form.type); form.categorie = cats.length ? cats[0].id : null })

function resetForm() {
  form.libelle = ''; form.montant = null; form.montant_reel = null; form.taux_taxe = null
  form.type = 'depense'; form.date = new Date().toISOString().split('T')[0]
  form.recurrence = 'unique'; form.recurrence_certitude = 'stricte'
  form.recurrence_debut = ''; form.recurrence_fin = ''; form.notes = ''
  editingId.value = null
  const cats = getCategoriesByType('depense'); form.categorie = cats.length ? cats[0].id : null
}
function openAdd() { resetForm(); showForm.value = true }
function openAddFondateur() { resetForm(); form.type = 'fondateur'; const cats = getCategoriesByType('fondateur'); form.categorie = cats.length ? cats[0].id : null; showForm.value = true }
function openEdit(t: Transaction) {
  editingId.value = t.id; form.libelle = t.libelle; form.montant = t.montant
  form.montant_reel = t.montant_reel; form.taux_taxe = t.taux_taxe; form.type = t.type
  form.date = t.date; form.recurrence = t.recurrence
  form.recurrence_certitude = t.recurrence_certitude || 'stricte'
  form.recurrence_debut = t.recurrence_debut || ''; form.recurrence_fin = t.recurrence_fin || ''
  form.notes = t.notes || ''
  form.categorie = t.categorie && typeof t.categorie === 'object' ? t.categorie.id : (t.categorie as string | null)
  showForm.value = true
}

async function handleSubmit() {
  if (!form.libelle.trim() || !form.montant) return
  saving.value = true
  try {
    const data: any = {
      libelle: form.libelle.trim(), montant: form.montant, montant_reel: form.montant_reel || null,
      taux_taxe: form.taux_taxe || null, type: form.type, categorie: form.categorie || null,
      date: form.date, recurrence: form.recurrence,
      recurrence_certitude: form.recurrence !== 'unique' ? form.recurrence_certitude : null,
      recurrence_debut: form.recurrence !== 'unique' && form.recurrence_debut ? form.recurrence_debut : null,
      recurrence_fin: form.recurrence !== 'unique' && form.recurrence_fin ? form.recurrence_fin : null,
      notes: form.notes.trim() || null
    }
    if (editingId.value) { await update(editingId.value, data); toast.add({ title: 'Transaction modifiee', color: 'success' }) }
    else { await create(data); toast.add({ title: 'Transaction ajoutee', color: 'success' }) }
    showForm.value = false; resetForm(); await refresh()
  } catch { toast.add({ title: 'Erreur', color: 'error' }) } finally { saving.value = false }
}

async function handleDelete(id: string) {
  try { await remove(id); toast.add({ title: 'Supprimee', color: 'success' }); await refresh() }
  catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Add category inline ---
const showAddCat = ref(false); const newCatLabel = ref(''); const newCatSousCat = ref(''); const addingCat = ref(false)
async function handleAddCategory() {
  if (!newCatLabel.value.trim()) return; addingCat.value = true
  try {
    const cat = await createCategory({ label: newCatLabel.value.trim(), type: form.type, sous_categorie: newCatSousCat.value.trim() || undefined })
    form.categorie = cat.id; showAddCat.value = false; newCatLabel.value = ''; newCatSousCat.value = ''
    toast.add({ title: 'Categorie ajoutee', color: 'success' })
  } catch { toast.add({ title: 'Erreur', color: 'error' }) } finally { addingCat.value = false }
}

// --- Helpers ---
function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatDateLong(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }
function getProjetName(t: Transaction): string | null { if (!t.projet) return null; if (typeof t.projet === 'object') return t.projet.nom; return null }
function txIsPositive(t: Transaction): boolean { return t.type === 'recette' || t.type === 'fondateur' }
const TYPE_STYLES: Record<string, { text: string; icon: string }> = {
  recette: { text: 'text-emerald-600', icon: 'bg-emerald-50 text-emerald-600' },
  depense: { text: 'text-red-500', icon: 'bg-red-50 text-red-400' },
  fondateur: { text: 'text-amber-600', icon: 'bg-amber-50 text-amber-600' }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Solde hero -->
        <div class="px-4 sm:px-6 pt-6 pb-3">
          <div class="max-w-md mx-auto text-center">
            <p class="text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-1.5">Solde total</p>
            <p class="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight leading-none" :class="totals.solde >= 0 ? 'text-emerald-600' : 'text-red-500'">
              {{ totals.solde >= 0 ? '+' : '' }}{{ formatMoney(totals.solde) }} <span class="text-2xl">&euro;</span>
            </p>
          </div>
        </div>

        <!-- Recettes / Depenses rectangles -->
        <div class="flex items-center justify-center gap-3 px-4 sm:px-6 pb-4 flex-wrap">
          <div class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
            <UIcon name="i-lucide-trending-up" class="size-4 text-emerald-600" />
            <div>
              <p class="text-[10px] text-emerald-600/70 uppercase tracking-wider font-medium">Recettes</p>
              <p class="text-sm font-bold text-emerald-700 tabular-nums">{{ formatMoney(totals.recettes) }} &euro;</p>
            </div>
          </div>
          <div class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200/60">
            <UIcon name="i-lucide-trending-down" class="size-4 text-red-500" />
            <div>
              <p class="text-[10px] text-red-500/70 uppercase tracking-wider font-medium">Depenses</p>
              <p class="text-sm font-bold text-red-600 tabular-nums">{{ formatMoney(totals.depenses) }} &euro;</p>
            </div>
          </div>
          <div v-if="totals.fondateur > 0" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/60">
            <UIcon name="i-lucide-heart-handshake" class="size-4 text-amber-600" />
            <div>
              <p class="text-[10px] text-amber-600/70 uppercase tracking-wider font-medium">Fondateur</p>
              <p class="text-sm font-bold text-amber-700 tabular-nums">{{ formatMoney(totals.fondateur) }} &euro;</p>
            </div>
          </div>
        </div>

        <!-- Sub-nav : Transactions | Fondateur | Graphiques -->
        <div class="px-4 sm:px-6 border-b border-stone-200/40">
          <div class="flex items-center gap-0 max-w-3xl mx-auto">
            <button
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all"
              :class="view === 'transactions' ? 'border-[#AF8F3C] text-[#AF8F3C]' : 'border-transparent text-stone-400 hover:text-stone-600'"
              @click="view = 'transactions'"
            >Transactions</button>
            <button
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all"
              :class="view === 'fondateur' ? 'border-amber-500 text-amber-600' : 'border-transparent text-stone-400 hover:text-stone-600'"
              @click="view = 'fondateur'"
            >Fondateur</button>
            <button
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all"
              :class="view === 'graphiques' ? 'border-[#AF8F3C] text-[#AF8F3C]' : 'border-transparent text-stone-400 hover:text-stone-600'"
              @click="view = 'graphiques'"
            >Graphiques</button>

            <!-- Search + Add (transactions or fondateur) -->
            <template v-if="view === 'transactions' || view === 'fondateur'">
              <UInput v-if="view === 'transactions'" v-model="search" placeholder="Rechercher..." icon="i-lucide-search" size="xs" class="ml-auto w-40 shrink-0" />
              <div v-else class="ml-auto" />
              <UButton v-if="isDirecteur" label="Ajouter" icon="i-lucide-plus" size="xs" class="ml-2" @click="view === 'fondateur' ? openAddFondateur() : openAdd()" />
            </template>
          </div>
        </div>

        <!-- ==================== TRANSACTIONS VIEW ==================== -->
        <div v-if="view === 'transactions'" class="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
          <div v-if="!filtered.length" class="text-center py-12">
            <UIcon name="i-lucide-landmark" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucune transaction</p>
          </div>

          <div v-else class="space-y-6">
            <div v-for="group in groupedByDate" :key="group.date">
              <div class="flex items-center gap-3 mb-2">
                <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider capitalize">{{ group.label }}</p>
                <div class="flex-1 h-px bg-stone-200/60" />
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="t in group.transactions" :key="t.id"
                  class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-white/70 hover:border-[rgba(175,143,60,0.15)] hover:shadow-sm transition-all"
                >
                  <div class="size-9 rounded-lg flex items-center justify-center shrink-0" :class="TYPE_STYLES[t.type]?.icon">
                    <UIcon :name="getCategoryIcon(t.categorie)" class="size-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium text-stone-800 truncate">{{ t.libelle }}</p>
                      <span v-if="t.recurrence !== 'unique' && t.recurrence_certitude === 'theorique'" class="shrink-0 text-[9px] font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">theorique</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] text-stone-400">{{ getCategoryLabel(t.categorie) }}</span>
                      <span v-if="t.recurrence !== 'unique'" class="text-[11px] text-stone-400">- {{ TRANSACTION_RECURRENCES[t.recurrence]?.label }}<template v-if="t.recurrence_certitude === 'theorique'"> ~</template></span>
                      <span v-if="t.montant_reel" class="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">paye {{ formatMoney(t.montant_reel) }}&euro;</span>
                      <span v-if="t.taux_taxe" class="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">taxe {{ t.taux_taxe }}%</span>
                      <span v-if="getProjetName(t)" class="inline-flex items-center gap-0.5 text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full"><UIcon name="i-lucide-folder" class="size-2.5" /> {{ getProjetName(t) }}</span>
                      <span v-if="t.notes" class="text-[11px] text-stone-400 truncate">- {{ t.notes }}</span>
                    </div>
                  </div>
                  <span class="text-sm font-bold tabular-nums shrink-0" :class="TYPE_STYLES[t.type]?.text">{{ txIsPositive(t) ? '+' : '-' }}{{ formatMoney(t.montant) }} &euro;</span>
                  <div v-if="isDirecteur" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 rounded hover:bg-stone-100 transition-colors" @click="openEdit(t)"><UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" /></button>
                    <button class="p-1 rounded hover:bg-red-50 transition-colors" @click="handleDelete(t.id)"><UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="showPagination" class="flex items-center justify-center gap-3 pt-6 pb-2">
            <UButton icon="i-lucide-chevron-left" size="xs" color="neutral" variant="ghost" :disabled="page <= 1" @click="prev" />
            <span class="text-xs text-stone-500 tabular-nums">{{ page }} / {{ totalPages }}</span>
            <UButton icon="i-lucide-chevron-right" size="xs" color="neutral" variant="ghost" :disabled="page >= totalPages" @click="next" />
          </div>
        </div>

        <!-- ==================== FONDATEUR VIEW ==================== -->
        <div v-else-if="view === 'fondateur'" class="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">

          <p class="text-xs text-stone-400 text-center leading-relaxed">
            Ce que le fondateur paye de son compte personnel pour l'entreprise. Informatif uniquement, n'impacte pas le solde.
          </p>

          <!-- Summary -->
          <div class="rounded-xl bg-amber-50/50 border border-amber-200/60 p-5 text-center">
            <p class="text-[10px] text-amber-600/70 uppercase tracking-widest mb-1">Total depense du compte perso</p>
            <p class="text-3xl font-bold text-amber-700 tabular-nums">{{ formatMoney(fondateurTotal) }} &euro;</p>
            <p v-if="fondateurMensuel > 0" class="text-xs text-amber-600/60 mt-1">
              dont ~{{ formatMoney(fondateurMensuel) }} &euro;/mois en recurrent
            </p>
          </div>

          <div v-if="depensesFondateurLoading" class="flex justify-center py-8">
            <UIcon name="i-lucide-loader-circle" class="size-6 text-amber-500 animate-spin" />
          </div>

          <template v-else>
            <!-- Recurrents -->
            <div v-if="fondateurRecurrents.length">
              <div class="flex items-center gap-3 mb-3">
                <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Mensuels / recurrents</p>
                <div class="flex-1 h-px bg-amber-200/40" />
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="d in fondateurRecurrents" :key="d.id"
                  class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-white/70 hover:border-amber-200/40 hover:shadow-sm transition-all"
                >
                  <div class="size-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                    <UIcon name="i-lucide-repeat" class="size-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-stone-800">{{ d.libelle }}</p>
                    <p v-if="d.notes" class="text-[11px] text-stone-400">{{ d.notes }}</p>
                  </div>
                  <span class="text-sm font-bold text-amber-600 tabular-nums shrink-0">{{ formatMoney(d.montant) }} &euro;/{{ { mensuel: 'mois', trimestriel: 'trim.', annuel: 'an' }[d.frequence || 'mensuel'] }}</span>
                  <div v-if="isDirecteur" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 rounded hover:bg-stone-100" @click="openEditFondateur(d)"><UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" /></button>
                    <button class="p-1 rounded hover:bg-red-50" @click="handleDeleteFondateur(d.id)"><UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ponctuels -->
            <div v-if="fondateurPonctuels.length">
              <div class="flex items-center gap-3 mb-3">
                <p class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Ponctuels</p>
                <div class="flex-1 h-px bg-amber-200/40" />
              </div>
              <div class="space-y-1.5">
                <div
                  v-for="d in fondateurPonctuels" :key="d.id"
                  class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-white/70 hover:border-amber-200/40 hover:shadow-sm transition-all"
                >
                  <div class="size-9 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
                    <UIcon name="i-lucide-receipt" class="size-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-stone-800">{{ d.libelle }}</p>
                    <p v-if="d.notes" class="text-[11px] text-stone-400">{{ d.notes }}</p>
                  </div>
                  <span class="text-xs text-stone-400 shrink-0 tabular-nums">{{ new Date(d.date_created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
                  <span class="text-sm font-bold text-amber-600 tabular-nums shrink-0">{{ formatMoney(d.montant) }} &euro;</span>
                  <div v-if="isDirecteur" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 rounded hover:bg-stone-100" @click="openEditFondateur(d)"><UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" /></button>
                    <button class="p-1 rounded hover:bg-red-50" @click="handleDeleteFondateur(d.id)"><UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" /></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty -->
            <div v-if="!depensesFondateur.length" class="text-center py-12">
              <UIcon name="i-lucide-heart-handshake" class="size-10 text-amber-300 mx-auto mb-3" />
              <p class="text-stone-500">Aucune depense personnelle enregistree</p>
              <UButton v-if="isDirecteur" label="Ajouter" icon="i-lucide-plus" variant="subtle" size="sm" class="mt-3" @click="openAddFondateur()" />
            </div>
          </template>
        </div>

        <!-- ==================== GRAPHIQUES VIEW ==================== -->
        <div v-else class="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">

          <!-- Evolution du solde -->
          <div class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-stone-800">Evolution du solde</h3>
              <div class="flex items-center gap-3 text-[10px]">
                <span class="flex items-center gap-1 text-stone-500"><span class="w-4 h-0.5 bg-emerald-500 rounded" /> Reel</span>
                <span class="flex items-center gap-1 text-stone-400"><span class="w-4 h-0.5 bg-emerald-300 rounded" style="border-bottom: 1px dashed" /> Prevision</span>
              </div>
            </div>
            <svg v-if="chartMonths.length >= 2" :viewBox="`0 0 ${CW} ${CH}`" class="w-full h-36 sm:h-44">
              <line :x1="CP.l" :x2="CW - CP.r" :y1="svgZeroY(chartMonths.map(d => d.solde))" :y2="svgZeroY(chartMonths.map(d => d.solde))" stroke="#d6d3d1" stroke-width="0.5" stroke-dasharray="4,4" />
              <path :d="svgArea(chartMonths.map(d => d.solde))" fill="url(#g-solde)" opacity="0.3" />
              <path :d="svgPath(chartMonths.map(d => d.solde))" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(pt, i) in chartMonths" :key="i" :cx="svgDotX(i, chartMonths.length)" :cy="svgDotY(pt.solde, chartMonths.map(d => d.solde))" :r="pt.forecast ? 3 : 4" :fill="pt.forecast ? '#6ee7b7' : '#10b981'" :stroke="pt.forecast ? '#6ee7b7' : 'white'" :stroke-width="pt.forecast ? 1 : 2" />
              <text v-for="(pt, i) in chartMonths" :key="'l'+i" :x="svgDotX(i, chartMonths.length)" :y="CH - 5" text-anchor="middle" class="text-[10px]" :fill="pt.forecast ? '#a8a29e' : '#78716c'" :font-style="pt.forecast ? 'italic' : 'normal'">{{ pt.label }}</text>
              <defs><linearGradient id="g-solde" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.4" /><stop offset="100%" stop-color="#10b981" stop-opacity="0" /></linearGradient></defs>
            </svg>
            <div class="flex items-center justify-center gap-4 mt-2 text-xs">
              <span class="text-stone-500">Recurrent net : <strong :class="monthlyRecurring >= 0 ? 'text-emerald-600' : 'text-red-500'">{{ monthlyRecurring >= 0 ? '+' : '' }}{{ formatMoney(monthlyRecurring) }} /mois</strong></span>
              <span v-if="transactions?.some(t => t.recurrence !== 'unique' && t.recurrence_certitude === 'theorique')" class="text-stone-400 flex items-center gap-1"><UIcon name="i-lucide-help-circle" class="size-3" /> Theoriques a 50%</span>
            </div>
          </div>

          <!-- Ce que prennent les intermediaires -->
          <div class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-stone-800 mb-1">Commissions des intermediaires</h3>
            <p class="text-[11px] text-stone-400 mb-4">Difference entre ce que paye le client et ce qui arrive sur le compte (Tipeee, Stripe, etc.)</p>

            <div v-if="intermediaryStats.count === 0" class="text-center py-6 text-sm text-stone-400">
              Aucune donnee. Renseignez le "montant paye par le client" sur vos recettes.
            </div>
            <template v-else>
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center p-3 rounded-lg bg-stone-50">
                  <p class="text-[10px] text-stone-500 uppercase tracking-wider">Paye par clients</p>
                  <p class="text-lg font-bold text-stone-800 tabular-nums">{{ formatMoney(intermediaryStats.totalPaye) }} &euro;</p>
                </div>
                <div class="text-center p-3 rounded-lg bg-emerald-50">
                  <p class="text-[10px] text-emerald-600/70 uppercase tracking-wider">Recu</p>
                  <p class="text-lg font-bold text-emerald-600 tabular-nums">{{ formatMoney(intermediaryStats.totalRecu) }} &euro;</p>
                </div>
                <div class="text-center p-3 rounded-lg bg-red-50">
                  <p class="text-[10px] text-red-500/70 uppercase tracking-wider">Commission prise</p>
                  <p class="text-lg font-bold text-red-500 tabular-nums">{{ formatMoney(intermediaryStats.commission) }} &euro;</p>
                </div>
              </div>
              <p class="text-xs text-stone-500 text-center">
                Sur {{ intermediaryStats.count }} transaction{{ intermediaryStats.count > 1 ? 's' : '' }}, les plateformes ont pris
                <strong class="text-red-500">{{ intermediaryStats.totalPaye > 0 ? ((intermediaryStats.commission / intermediaryStats.totalPaye) * 100).toFixed(1) : 0 }}%</strong>
              </p>
            </template>
          </div>

          <!-- Ce que prend l'Etat -->
          <div class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
            <h3 class="text-sm font-semibold text-stone-800 mb-1">Pression fiscale</h3>
            <p class="text-[11px] text-stone-400 mb-4">Estimation de ce que l'Etat preleveera sur les recettes declarees (informatif, base sur le taux renseigne)</p>

            <div v-if="taxStats.count === 0" class="text-center py-6 text-sm text-stone-400">
              Aucune donnee. Renseignez le "taux de taxe" sur vos recettes.
            </div>
            <template v-else>
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center p-3 rounded-lg bg-emerald-50">
                  <p class="text-[10px] text-emerald-600/70 uppercase tracking-wider">Recettes brutes</p>
                  <p class="text-lg font-bold text-emerald-600 tabular-nums">{{ formatMoney(taxStats.totalBrut) }} &euro;</p>
                </div>
                <div class="text-center p-3 rounded-lg bg-orange-50">
                  <p class="text-[10px] text-orange-600/70 uppercase tracking-wider">Estimation impots</p>
                  <p class="text-lg font-bold text-orange-600 tabular-nums">{{ formatMoney(taxStats.totalTaxe) }} &euro;</p>
                </div>
                <div class="text-center p-3 rounded-lg bg-stone-50">
                  <p class="text-[10px] text-stone-500 uppercase tracking-wider">Net apres impots</p>
                  <p class="text-lg font-bold text-stone-800 tabular-nums">{{ formatMoney(taxStats.totalBrut - taxStats.totalTaxe) }} &euro;</p>
                </div>
              </div>
              <p class="text-xs text-stone-500 text-center">
                Sur {{ taxStats.count }} recette{{ taxStats.count > 1 ? 's' : '' }} taxees, l'Etat preleveera environ
                <strong class="text-orange-600">{{ taxStats.totalBrut > 0 ? ((taxStats.totalTaxe / taxStats.totalBrut) * 100).toFixed(1) : 0 }}%</strong>
              </p>
            </template>
          </div>

        </div>
      </template>
    </div>

    <!-- Add/Edit modal -->
    <UModal :open="showForm" @update:open="val => { if (!val) { showForm = false; resetForm() } }">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">{{ editingId ? 'Modifier la transaction' : 'Nouvelle transaction' }}</h3>
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Type toggle -->
            <div class="flex items-center justify-center">
              <div class="inline-flex items-center rounded-xl border-2 overflow-hidden transition-colors" :class="{ 'border-red-300': form.type === 'depense', 'border-emerald-300': form.type === 'recette', 'border-amber-300': form.type === 'fondateur' }">
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5" :class="form.type === 'depense' ? 'bg-red-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'" @click="form.type = 'depense'"><UIcon name="i-lucide-trending-down" class="size-4" /> Depense</button>
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5" :class="form.type === 'recette' ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'" @click="form.type = 'recette'"><UIcon name="i-lucide-trending-up" class="size-4" /> Recette</button>
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5" :class="form.type === 'fondateur' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'" @click="form.type = 'fondateur'"><UIcon name="i-lucide-heart-handshake" class="size-4" /> Fondateur</button>
              </div>
            </div>
            <!-- Libelle + Montant -->
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Libelle" required class="col-span-2"><UInput v-model="form.libelle" placeholder="Description..." icon="i-lucide-text" class="w-full" /></UFormField>
              <UFormField label="Montant recu" required><UInput v-model.number="form.montant" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" /></UFormField>
            </div>
            <!-- Montant reel + Taxe (recettes) -->
            <div v-if="form.type === 'recette'" class="grid grid-cols-2 gap-3">
              <UFormField label="Montant paye par le client"><UInput v-model.number="form.montant_reel" type="number" :min="0" step="0.01" placeholder="Optionnel" icon="i-lucide-receipt" class="w-full" /><template #hint><span class="text-[10px] text-stone-400">Avant commission plateforme</span></template></UFormField>
              <UFormField label="Taux de taxe (%)"><UInput v-model.number="form.taux_taxe" type="number" :min="0" :max="100" step="0.1" placeholder="Ex: 23" icon="i-lucide-percent" class="w-full" /><template #hint><span class="text-[10px] text-stone-400">Informatif, n'impacte pas le solde</span></template></UFormField>
            </div>
            <!-- Categorie + Date -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Categorie">
                <div class="flex items-center gap-1.5">
                  <USelect v-if="formCategories.length" v-model="form.categorie" :items="formCategories" value-key="value" class="flex-1" />
                  <span v-else class="flex-1 text-sm text-stone-400 italic">Aucune</span>
                  <UTooltip text="Nouvelle categorie"><UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" @click="showAddCat = !showAddCat" /></UTooltip>
                </div>
                <div v-if="showAddCat" class="mt-2 p-3 rounded-lg bg-stone-50 border border-stone-200/60 space-y-2">
                  <UInput v-model="newCatLabel" placeholder="Nom de la categorie" size="sm" />
                  <UInput v-model="newCatSousCat" placeholder="Sous-categorie (optionnel)" size="sm" />
                  <div class="flex justify-end gap-1.5">
                    <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showAddCat = false; newCatLabel = ''; newCatSousCat = ''" />
                    <UButton label="Creer" size="xs" icon="i-lucide-check" :loading="addingCat" :disabled="!newCatLabel.trim()" @click="handleAddCategory" />
                  </div>
                </div>
              </UFormField>
              <UFormField label="Date"><UInput v-model="form.date" type="date" class="w-full" /></UFormField>
            </div>
            <!-- Recurrence -->
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Recurrence"><USelect v-model="form.recurrence" :items="recOptions" value-key="value" class="w-full" /></UFormField>
                <UFormField label="Notes"><UInput v-model="form.notes" placeholder="Optionnel..." class="w-full" /></UFormField>
              </div>
              <div v-if="form.recurrence !== 'unique'" class="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-3">
                <div class="flex items-center gap-2">
                  <p class="text-xs font-semibold text-stone-600">Certitude</p>
                  <div class="inline-flex items-center rounded-lg border overflow-hidden" :class="form.recurrence_certitude === 'stricte' ? 'border-emerald-300' : 'border-amber-300'">
                    <button type="button" class="px-3 py-1.5 text-xs font-medium transition-all" :class="form.recurrence_certitude === 'stricte' ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400'" @click="form.recurrence_certitude = 'stricte'">Stricte</button>
                    <button type="button" class="px-3 py-1.5 text-xs font-medium transition-all" :class="form.recurrence_certitude === 'theorique' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'" @click="form.recurrence_certitude = 'theorique'">Theorique</button>
                  </div>
                </div>
                <p class="text-[10px] text-stone-400 leading-relaxed">
                  <template v-if="form.recurrence_certitude === 'stricte'">Stricte : montant garanti (abonnement fixe, loyer, etc.)</template>
                  <template v-else>Theorique : montant incertain (dons, revenus variables). Compte a 50% dans les previsions.</template>
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <UFormField label="Debut"><UInput v-model="form.recurrence_debut" type="date" class="w-full" /></UFormField>
                  <UFormField label="Fin"><UInput v-model="form.recurrence_fin" type="date" class="w-full" /></UFormField>
                </div>
              </div>
            </div>
            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
              <UButton v-if="editingId" label="Supprimer" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDelete(editingId!); showForm = false; resetForm()" />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showForm = false; resetForm()" />
                <UButton type="submit" :label="editingId ? 'Enregistrer' : 'Ajouter'" :icon="editingId ? 'i-lucide-check' : 'i-lucide-plus'" :loading="saving" :disabled="!form.libelle.trim() || !form.montant" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Fondateur modal -->
    <UModal :open="showFondateurForm" @update:open="val => { if (!val) { showFondateurForm = false; resetFondateurForm() } }">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">
            {{ editingFondateurId ? 'Modifier' : 'Depense personnelle du fondateur' }}
          </h3>
          <form class="space-y-4" @submit.prevent="handleFondateurSubmit">
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Libelle" required class="col-span-2">
                <UInput v-model="fondateurForm.libelle" placeholder="Ex: Hebergement OVH, Domaine..." icon="i-lucide-text" class="w-full" />
              </UFormField>
              <UFormField label="Montant" required>
                <UInput v-model.number="fondateurForm.montant" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" />
              </UFormField>
            </div>

            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <div
                  class="flex items-center justify-center size-5 rounded border-2 transition-all"
                  :class="fondateurForm.recurrent ? 'bg-amber-500 border-amber-500' : 'border-stone-300'"
                  @click="fondateurForm.recurrent = !fondateurForm.recurrent"
                >
                  <UIcon v-if="fondateurForm.recurrent" name="i-lucide-check" class="size-3 text-white" />
                </div>
                <span class="text-sm text-stone-700">Recurrent</span>
              </label>
              <USelect
                v-if="fondateurForm.recurrent"
                v-model="fondateurForm.frequence"
                :items="[{ label: 'Mensuel', value: 'mensuel' }, { label: 'Trimestriel', value: 'trimestriel' }, { label: 'Annuel', value: 'annuel' }]"
                value-key="value"
                size="sm"
                class="w-36"
              />
            </div>

            <UFormField label="Notes">
              <UInput v-model="fondateurForm.notes" placeholder="Optionnel..." class="w-full" />
            </UFormField>

            <div class="flex items-center justify-between pt-2">
              <UButton v-if="editingFondateurId" label="Supprimer" icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDeleteFondateur(editingFondateurId!); showFondateurForm = false; resetFondateurForm()" />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showFondateurForm = false; resetFondateurForm()" />
                <UButton type="submit" :label="editingFondateurId ? 'Enregistrer' : 'Ajouter'" :icon="editingFondateurId ? 'i-lucide-check' : 'i-lucide-plus'" :loading="savingFondateur" :disabled="!fondateurForm.libelle.trim() || !fondateurForm.montant" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
