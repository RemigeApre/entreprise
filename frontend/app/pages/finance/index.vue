<script setup lang="ts">
import type { Transaction, TransactionType, TransactionRecurrence, RecurrenceCertitude } from '~/utils/types'
import { TRANSACTION_RECURRENCES } from '~/utils/constants'

const { isDirecteur } = useAuth()
const { getAll, create, update, remove } = useFinance()
const { categories, loaded: catsLoaded, loadCategories, createCategory, getCategoriesByType, getCategoryLabel, getCategoryIcon } = useFinanceCategories()
const toast = useToast()

const { data: transactions, status, refresh } = useAsyncData('transactions', getAll)

onMounted(() => { if (!catsLoaded.value) loadCategories() })

// --- Filters ---
const filterType = ref<TransactionType | 'all'>('all')
const search = ref('')

const filtered = computed(() => {
  if (!transactions.value) return []
  return transactions.value.filter(t => {
    if (filterType.value !== 'all' && t.type !== filterType.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!t.libelle.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q)) return false
    }
    return true
  })
})

// --- Totals on ALL transactions ---
const totals = computed(() => {
  if (!transactions.value) return { recettes: 0, depenses: 0, fondateur: 0, solde: 0 }
  const recettes = transactions.value.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0)
  const depenses = transactions.value.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  const fondateur = transactions.value.filter(t => t.type === 'fondateur').reduce((s, t) => s + t.montant, 0)
  return { recettes, depenses, fondateur, solde: recettes + fondateur - depenses }
})

// --- Chart: monthly balance evolution + forecast ---
interface MonthPoint {
  label: string
  solde: number
  forecast?: boolean
}

const chartData = computed<MonthPoint[]>(() => {
  if (!transactions.value?.length) return []

  // Build monthly running balance (all time)
  const monthly = new Map<string, { recettes: number; depenses: number }>()
  for (const t of transactions.value) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = monthly.get(key) || { recettes: 0, depenses: 0 }
    if (t.type === 'depense') m.depenses += t.montant
    else m.recettes += t.montant
    monthly.set(key, m)
  }

  // Sort months
  const sortedKeys = [...monthly.keys()].sort()
  const points: MonthPoint[] = []
  let runningBalance = 0

  for (const key of sortedKeys) {
    const m = monthly.get(key)!
    runningBalance += m.recettes - m.depenses
    const [y, mo] = key.split('-')
    const label = new Date(+y, +mo - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    points.push({ label, solde: runningBalance })
  }

  // Forecast: project 2 months based on recurring transactions
  if (points.length >= 1) {
    const recurringMonthly = getMonthlyRecurringNet()
    const lastSolde = points[points.length - 1].solde
    const now = new Date()

    for (let i = 1; i <= 2; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i)
      const label = futureDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      points.push({
        label,
        solde: lastSolde + recurringMonthly * i,
        forecast: true
      })
    }
  }

  // Keep last 8 points max
  return points.slice(-8)
})

function getMonthlyRecurringNet(): number {
  if (!transactions.value) return 0
  let net = 0
  const now = new Date()

  for (const t of transactions.value) {
    if (t.recurrence === 'unique') continue

    // Check if recurrence is still active
    if (t.recurrence_fin) {
      const fin = new Date(t.recurrence_fin)
      if (fin < now) continue
    }

    // Theorique: count at 50% weight
    const weight = t.recurrence_certitude === 'theorique' ? 0.5 : 1

    let monthlyAmount = t.montant
    if (t.recurrence === 'trimestriel') monthlyAmount = t.montant / 3
    if (t.recurrence === 'annuel') monthlyAmount = t.montant / 12

    if (t.type === 'depense') net -= monthlyAmount * weight
    else net += monthlyAmount * weight
  }
  return net
}

// Chart SVG helpers
const chartWidth = 600
const chartHeight = 160
const chartPadding = { top: 20, right: 20, bottom: 30, left: 10 }

const chartPath = computed(() => {
  const data = chartData.value
  if (data.length < 2) return ''

  const w = chartWidth - chartPadding.left - chartPadding.right
  const h = chartHeight - chartPadding.top - chartPadding.bottom
  const values = data.map(d => d.solde)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1

  const points = data.map((d, i) => {
    const x = chartPadding.left + (i / (data.length - 1)) * w
    const y = chartPadding.top + h - ((d.solde - min) / range) * h
    return `${x},${y}`
  })

  return `M${points.join(' L')}`
})

const chartForecastStart = computed(() => {
  const data = chartData.value
  const idx = data.findIndex(d => d.forecast)
  if (idx <= 0) return null
  const w = chartWidth - chartPadding.left - chartPadding.right
  return chartPadding.left + ((idx - 1) / (data.length - 1)) * w
})

const chartAreaPath = computed(() => {
  const data = chartData.value
  if (data.length < 2) return ''
  const w = chartWidth - chartPadding.left - chartPadding.right
  const h = chartHeight - chartPadding.top - chartPadding.bottom
  const values = data.map(d => d.solde)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const bottom = chartPadding.top + h

  const points = data.map((d, i) => {
    const x = chartPadding.left + (i / (data.length - 1)) * w
    const y = chartPadding.top + h - ((d.solde - min) / range) * h
    return `${x},${y}`
  })

  const firstX = chartPadding.left
  const lastX = chartPadding.left + w
  return `M${firstX},${bottom} L${points.join(' L')} L${lastX},${bottom} Z`
})

const chartZeroY = computed(() => {
  const data = chartData.value
  if (!data.length) return 0
  const h = chartHeight - chartPadding.top - chartPadding.bottom
  const values = data.map(d => d.solde)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  return chartPadding.top + h - ((0 - min) / range) * h
})

const monthlyRecurring = computed(() => getMonthlyRecurringNet())

const forecastLabel = computed(() => {
  const net = monthlyRecurring.value
  if (net === 0) return 'stable'
  return `${net > 0 ? '+' : ''}${formatMoney(net)} /mois`
})

// --- Pagination ---
const { paginatedItems: pagedTransactions, page, totalPages, showPagination, next, prev } = usePagination(filtered, 50)

// --- Group paginated transactions by date ---
interface DateGroup {
  label: string
  date: string
  transactions: Transaction[]
}

const groupedByDate = computed<DateGroup[]>(() => {
  const map = new Map<string, Transaction[]>()
  for (const t of pagedTransactions.value) {
    const key = t.date
    const list = map.get(key) || []
    list.push(t)
    map.set(key, list)
  }
  return [...map.entries()].map(([date, txs]) => ({
    label: formatDateLong(date),
    date,
    transactions: txs
  }))
})

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

const formCategories = computed(() => {
  const cats = getCategoriesByType(form.type)
  return cats.map(c => ({
    label: c.sous_categorie ? `${c.label} (${c.sous_categorie})` : c.label,
    value: c.id
  }))
})

watch(() => form.type, () => {
  const cats = getCategoriesByType(form.type)
  form.categorie = cats.length ? cats[0].id : null
})

function resetForm() {
  form.libelle = ''
  form.montant = null
  form.montant_reel = null
  form.taux_taxe = null
  form.type = 'depense'
  form.date = new Date().toISOString().split('T')[0]
  form.recurrence = 'unique'
  form.recurrence_certitude = 'stricte'
  form.recurrence_debut = ''
  form.recurrence_fin = ''
  form.notes = ''
  editingId.value = null
  const cats = getCategoriesByType('depense')
  form.categorie = cats.length ? cats[0].id : null
}

function openAdd() {
  resetForm()
  showForm.value = true
}

function openEdit(t: Transaction) {
  editingId.value = t.id
  form.libelle = t.libelle
  form.montant = t.montant
  form.montant_reel = t.montant_reel
  form.taux_taxe = t.taux_taxe
  form.type = t.type
  form.date = t.date
  form.recurrence = t.recurrence
  form.recurrence_certitude = t.recurrence_certitude || 'stricte'
  form.recurrence_debut = t.recurrence_debut || ''
  form.recurrence_fin = t.recurrence_fin || ''
  form.notes = t.notes || ''
  form.categorie = t.categorie && typeof t.categorie === 'object' ? t.categorie.id : (t.categorie as string | null)
  showForm.value = true
}

async function handleSubmit() {
  if (!form.libelle.trim() || !form.montant) return
  saving.value = true
  try {
    const data: any = {
      libelle: form.libelle.trim(),
      montant: form.montant,
      montant_reel: form.montant_reel || null,
      taux_taxe: form.taux_taxe || null,
      type: form.type,
      categorie: form.categorie || null,
      date: form.date,
      recurrence: form.recurrence,
      recurrence_certitude: form.recurrence !== 'unique' ? form.recurrence_certitude : null,
      recurrence_debut: form.recurrence !== 'unique' && form.recurrence_debut ? form.recurrence_debut : null,
      recurrence_fin: form.recurrence !== 'unique' && form.recurrence_fin ? form.recurrence_fin : null,
      notes: form.notes.trim() || null
    }

    if (editingId.value) {
      await update(editingId.value, data)
      toast.add({ title: 'Transaction modifiee', color: 'success' })
    } else {
      await create(data)
      toast.add({ title: 'Transaction ajoutee', color: 'success' })
    }
    showForm.value = false
    resetForm()
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await remove(id)
    toast.add({ title: 'Supprimee', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Add category inline ---
const showAddCat = ref(false)
const newCatLabel = ref('')
const newCatSousCat = ref('')
const addingCat = ref(false)

async function handleAddCategory() {
  if (!newCatLabel.value.trim()) return
  addingCat.value = true
  try {
    const cat = await createCategory({
      label: newCatLabel.value.trim(),
      type: form.type,
      sous_categorie: newCatSousCat.value.trim() || undefined
    })
    form.categorie = cat.id
    showAddCat.value = false
    newCatLabel.value = ''
    newCatSousCat.value = ''
    toast.add({ title: 'Categorie ajoutee', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    addingCat.value = false
  }
}

// --- Helpers ---
function formatMoney(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function getProjetName(t: Transaction): string | null {
  if (!t.projet) return null
  if (typeof t.projet === 'object') return t.projet.nom
  return null
}

function txIsPositive(t: Transaction): boolean {
  return t.type === 'recette' || t.type === 'fondateur'
}

const TYPE_STYLES = {
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
        <div class="px-4 sm:px-6 pt-6 pb-2">
          <div class="max-w-md mx-auto text-center mb-4">
            <p class="text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-1.5">Solde total</p>
            <p
              class="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight leading-none"
              :class="totals.solde >= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ totals.solde >= 0 ? '+' : '' }}{{ formatMoney(totals.solde) }} <span class="text-2xl">&euro;</span>
            </p>
          </div>
        </div>

        <!-- Chart + Forecast -->
        <div v-if="chartData.length >= 2" class="px-4 sm:px-6 pb-4">
          <div class="max-w-2xl mx-auto rounded-xl bg-white/50 border border-white/70 shadow-sm p-4">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs font-semibold text-stone-600">Evolution du solde</p>
              <div class="flex items-center gap-3 text-[10px]">
                <span class="flex items-center gap-1 text-stone-500">
                  <span class="w-4 h-0.5 bg-emerald-500 rounded" /> Reel
                </span>
                <span class="flex items-center gap-1 text-stone-400">
                  <span class="w-4 h-0.5 bg-emerald-300 rounded border-dashed" style="border-bottom: 1px dashed" /> Prevision
                </span>
              </div>
            </div>

            <!-- SVG Chart -->
            <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-32 sm:h-40">
              <!-- Zero line -->
              <line
                :x1="chartPadding.left" :x2="chartWidth - chartPadding.right"
                :y1="chartZeroY" :y2="chartZeroY"
                stroke="#d6d3d1" stroke-width="0.5" stroke-dasharray="4,4"
              />

              <!-- Area fill -->
              <path :d="chartAreaPath" fill="url(#solde-gradient)" opacity="0.3" />

              <!-- Main line -->
              <path :d="chartPath" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

              <!-- Forecast dashed overlay -->
              <line
                v-if="chartForecastStart"
                :x1="chartForecastStart" :x2="chartWidth - chartPadding.right"
                :y1="chartPadding.top" :y2="chartPadding.top"
                stroke="none"
              />

              <!-- Dots -->
              <circle
                v-for="(pt, i) in chartData"
                :key="i"
                :cx="chartPadding.left + (i / (chartData.length - 1)) * (chartWidth - chartPadding.left - chartPadding.right)"
                :cy="chartPadding.top + (chartHeight - chartPadding.top - chartPadding.bottom) - ((pt.solde - Math.min(...chartData.map(d => d.solde), 0)) / (Math.max(...chartData.map(d => d.solde), 1) - Math.min(...chartData.map(d => d.solde), 0) || 1)) * (chartHeight - chartPadding.top - chartPadding.bottom)"
                :r="pt.forecast ? 3 : 4"
                :fill="pt.forecast ? '#6ee7b7' : '#10b981'"
                :stroke="pt.forecast ? '#6ee7b7' : 'white'"
                :stroke-width="pt.forecast ? 1 : 2"
                :stroke-dasharray="pt.forecast ? '2,2' : 'none'"
              />

              <!-- Month labels -->
              <text
                v-for="(pt, i) in chartData"
                :key="'label-' + i"
                :x="chartPadding.left + (i / (chartData.length - 1)) * (chartWidth - chartPadding.left - chartPadding.right)"
                :y="chartHeight - 5"
                text-anchor="middle"
                class="text-[10px]"
                :fill="pt.forecast ? '#a8a29e' : '#78716c'"
                :font-style="pt.forecast ? 'italic' : 'normal'"
              >
                {{ pt.label }}
              </text>

              <!-- Gradient def -->
              <defs>
                <linearGradient id="solde-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                </linearGradient>
              </defs>
            </svg>

            <!-- Forecast summary -->
            <div class="flex items-center justify-center gap-4 mt-2 text-xs">
              <div class="flex items-center gap-1.5 text-stone-500">
                <UIcon name="i-lucide-calculator" class="size-3.5" />
                <span>Recurrent net : <strong :class="monthlyRecurring >= 0 ? 'text-emerald-600' : 'text-red-500'">{{ forecastLabel }}</strong></span>
              </div>
              <div v-if="transactions?.some(t => t.recurrence !== 'unique' && t.recurrence_certitude === 'theorique')" class="flex items-center gap-1 text-stone-400">
                <UIcon name="i-lucide-help-circle" class="size-3" />
                <span>Incl. theoriques a 50%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Toolbar (no opaque background) -->
        <div class="px-4 sm:px-6 py-2.5 border-b border-stone-200/40">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'all' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = 'all'"
            >Tout</button>
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'recette' ? 'bg-emerald-600 text-white' : 'text-emerald-600/60 hover:bg-emerald-50'"
              @click="filterType = filterType === 'recette' ? 'all' : 'recette'"
            >Recettes</button>
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'depense' ? 'bg-red-500 text-white' : 'text-red-500/60 hover:bg-red-50'"
              @click="filterType = filterType === 'depense' ? 'all' : 'depense'"
            >Depenses</button>
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'fondateur' ? 'bg-amber-500 text-white' : 'text-amber-600/60 hover:bg-amber-50'"
              @click="filterType = filterType === 'fondateur' ? 'all' : 'fondateur'"
            >Fondateur</button>

            <UInput v-model="search" placeholder="Rechercher..." icon="i-lucide-search" size="xs" class="ml-auto w-40 shrink-0" />

            <UButton
              v-if="isDirecteur"
              label="Ajouter"
              icon="i-lucide-plus"
              size="xs"
              @click="openAdd"
            />
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4 max-w-3xl mx-auto">
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
                  v-for="t in group.transactions"
                  :key="t.id"
                  class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-white/70 hover:border-[rgba(175,143,60,0.15)] hover:shadow-sm transition-all"
                >
                  <div class="size-9 rounded-lg flex items-center justify-center shrink-0" :class="TYPE_STYLES[t.type]?.icon">
                    <UIcon :name="getCategoryIcon(t.categorie)" class="size-4" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium text-stone-800 truncate">{{ t.libelle }}</p>
                      <span
                        v-if="t.recurrence !== 'unique' && t.recurrence_certitude === 'theorique'"
                        class="shrink-0 text-[9px] font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full"
                      >theorique</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] text-stone-400">{{ getCategoryLabel(t.categorie) }}</span>
                      <span v-if="t.recurrence !== 'unique'" class="text-[11px] text-stone-400">
                        - {{ TRANSACTION_RECURRENCES[t.recurrence]?.label }}
                        <template v-if="t.recurrence_certitude === 'theorique'"> ~</template>
                      </span>
                      <span v-if="t.montant_reel" class="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                        paye {{ formatMoney(t.montant_reel) }}&euro;
                      </span>
                      <span v-if="t.taux_taxe" class="text-[10px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                        taxe {{ t.taux_taxe }}%
                      </span>
                      <span v-if="getProjetName(t)" class="inline-flex items-center gap-0.5 text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">
                        <UIcon name="i-lucide-folder" class="size-2.5" />
                        {{ getProjetName(t) }}
                      </span>
                      <span v-if="t.notes" class="text-[11px] text-stone-400 truncate">- {{ t.notes }}</span>
                    </div>
                  </div>

                  <span class="text-sm font-bold tabular-nums shrink-0" :class="TYPE_STYLES[t.type]?.text">
                    {{ txIsPositive(t) ? '+' : '-' }}{{ formatMoney(t.montant) }} &euro;
                  </span>

                  <div v-if="isDirecteur" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1 rounded hover:bg-stone-100 transition-colors" @click="openEdit(t)">
                      <UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" />
                    </button>
                    <button class="p-1 rounded hover:bg-red-50 transition-colors" @click="handleDelete(t.id)">
                      <UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" />
                    </button>
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
      </template>
    </div>

    <!-- Add/Edit modal -->
    <UModal :open="showForm" @update:open="val => { if (!val) { showForm = false; resetForm() } }">
      <template #content>
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">
            {{ editingId ? 'Modifier la transaction' : 'Nouvelle transaction' }}
          </h3>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Type toggle -->
            <div class="flex items-center justify-center">
              <div class="inline-flex items-center rounded-xl border-2 overflow-hidden transition-colors"
                :class="{ 'border-red-300': form.type === 'depense', 'border-emerald-300': form.type === 'recette', 'border-amber-300': form.type === 'fondateur' }"
              >
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'depense' ? 'bg-red-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'depense'"
                ><UIcon name="i-lucide-trending-down" class="size-4" /> Depense</button>
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'recette' ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'recette'"
                ><UIcon name="i-lucide-trending-up" class="size-4" /> Recette</button>
                <button type="button" class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'fondateur' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'fondateur'"
                ><UIcon name="i-lucide-heart-handshake" class="size-4" /> Fondateur</button>
              </div>
            </div>

            <!-- Libelle + Montant -->
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Libelle" required class="col-span-2">
                <UInput v-model="form.libelle" placeholder="Description..." icon="i-lucide-text" class="w-full" />
              </UFormField>
              <UFormField label="Montant recu" required>
                <UInput v-model.number="form.montant" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" />
              </UFormField>
            </div>

            <!-- Montant reel + Taxe (recettes only) -->
            <div v-if="form.type === 'recette'" class="grid grid-cols-2 gap-3">
              <UFormField label="Montant paye par le client">
                <UInput v-model.number="form.montant_reel" type="number" :min="0" step="0.01" placeholder="Optionnel" icon="i-lucide-receipt" class="w-full" />
                <template #hint>
                  <span class="text-[10px] text-stone-400">Avant commission plateforme</span>
                </template>
              </UFormField>
              <UFormField label="Taux de taxe (%)">
                <UInput v-model.number="form.taux_taxe" type="number" :min="0" :max="100" step="0.1" placeholder="Ex: 23" icon="i-lucide-percent" class="w-full" />
                <template #hint>
                  <span class="text-[10px] text-stone-400">Informatif, n'impacte pas le solde</span>
                </template>
              </UFormField>
            </div>

            <!-- Categorie + Date -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Categorie">
                <div class="flex items-center gap-1.5">
                  <USelect v-if="formCategories.length" v-model="form.categorie" :items="formCategories" value-key="value" class="flex-1" />
                  <span v-else class="flex-1 text-sm text-stone-400 italic">Aucune</span>
                  <UTooltip text="Nouvelle categorie">
                    <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" @click="showAddCat = !showAddCat" />
                  </UTooltip>
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
              <UFormField label="Date">
                <UInput v-model="form.date" type="date" class="w-full" />
              </UFormField>
            </div>

            <!-- Recurrence -->
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Recurrence">
                  <USelect v-model="form.recurrence" :items="recOptions" value-key="value" class="w-full" />
                </UFormField>
                <UFormField label="Notes">
                  <UInput v-model="form.notes" placeholder="Optionnel..." class="w-full" />
                </UFormField>
              </div>

              <!-- Recurrence details (if not unique) -->
              <div v-if="form.recurrence !== 'unique'" class="p-3 rounded-lg bg-stone-50/80 border border-stone-200/60 space-y-3">
                <div class="flex items-center gap-2">
                  <p class="text-xs font-semibold text-stone-600">Certitude</p>
                  <div class="inline-flex items-center rounded-lg border overflow-hidden"
                    :class="form.recurrence_certitude === 'stricte' ? 'border-emerald-300' : 'border-amber-300'"
                  >
                    <button type="button" class="px-3 py-1.5 text-xs font-medium transition-all"
                      :class="form.recurrence_certitude === 'stricte' ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400'"
                      @click="form.recurrence_certitude = 'stricte'"
                    >Stricte</button>
                    <button type="button" class="px-3 py-1.5 text-xs font-medium transition-all"
                      :class="form.recurrence_certitude === 'theorique' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'"
                      @click="form.recurrence_certitude = 'theorique'"
                    >Theorique</button>
                  </div>
                </div>
                <p class="text-[10px] text-stone-400 leading-relaxed">
                  <template v-if="form.recurrence_certitude === 'stricte'">
                    Stricte : montant garanti (abonnement fixe, loyer, etc.)
                  </template>
                  <template v-else>
                    Theorique : montant incertain (dons, revenus variables). Compte a 50% dans les previsions.
                  </template>
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <UFormField label="Debut">
                    <UInput v-model="form.recurrence_debut" type="date" class="w-full" placeholder="Optionnel" />
                  </UFormField>
                  <UFormField label="Fin">
                    <UInput v-model="form.recurrence_fin" type="date" class="w-full" placeholder="Optionnel" />
                  </UFormField>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
              <UButton
                v-if="editingId"
                label="Supprimer"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                @click="handleDelete(editingId!); showForm = false; resetForm()"
              />
              <div v-else />
              <div class="flex items-center gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showForm = false; resetForm()" />
                <UButton
                  type="submit"
                  :label="editingId ? 'Enregistrer' : 'Ajouter'"
                  :icon="editingId ? 'i-lucide-check' : 'i-lucide-plus'"
                  :loading="saving"
                  :disabled="!form.libelle.trim() || !form.montant"
                />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
