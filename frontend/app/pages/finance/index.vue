<script setup lang="ts">
import type { Transaction, TransactionType, TransactionRecurrence, CategorieFinance } from '~/utils/types'
import { TRANSACTION_TYPES, TRANSACTION_RECURRENCES } from '~/utils/constants'

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
  type: 'depense' as TransactionType,
  categorie: null as string | null,
  date: new Date().toISOString().split('T')[0],
  recurrence: 'unique' as TransactionRecurrence,
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

// Auto-select first category when type changes
watch(() => form.type, () => {
  const cats = getCategoriesByType(form.type)
  form.categorie = cats.length ? cats[0].id : null
})

function resetForm() {
  form.libelle = ''
  form.montant = null
  form.type = 'depense'
  form.date = new Date().toISOString().split('T')[0]
  form.recurrence = 'unique'
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
  form.type = t.type
  form.date = t.date
  form.recurrence = t.recurrence
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
      type: form.type,
      categorie: form.categorie || null,
      date: form.date,
      recurrence: form.recurrence,
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
  recette: { text: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'bg-emerald-50 text-emerald-600' },
  depense: { text: 'text-red-500', bg: 'bg-red-50', icon: 'bg-red-50 text-red-400' },
  fondateur: { text: 'text-amber-600', bg: 'bg-amber-50', icon: 'bg-amber-50 text-amber-600' }
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
          <div class="max-w-md mx-auto text-center mb-5">
            <p class="text-[10px] text-stone-400 uppercase tracking-[0.2em] mb-1.5">Solde total</p>
            <p
              class="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight leading-none"
              :class="totals.solde >= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ totals.solde >= 0 ? '+' : '' }}{{ formatMoney(totals.solde) }} <span class="text-2xl">&euro;</span>
            </p>
          </div>

          <!-- Recettes / Depenses / Fondateur pills -->
          <div class="flex items-center justify-center gap-3 flex-wrap">
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
        </div>

        <!-- Toolbar -->
        <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5 mt-4">
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
          <!-- Empty -->
          <div v-if="!filtered.length" class="text-center py-12">
            <UIcon name="i-lucide-landmark" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucune transaction</p>
          </div>

          <!-- Grouped by date -->
          <div v-else class="space-y-6">
            <div v-for="group in groupedByDate" :key="group.date">
              <!-- Date header -->
              <div class="flex items-center gap-3 mb-2">
                <p class="text-xs font-semibold text-stone-500 uppercase tracking-wider capitalize">{{ group.label }}</p>
                <div class="flex-1 h-px bg-stone-200/60" />
              </div>

              <!-- Transactions -->
              <div class="space-y-1.5">
                <div
                  v-for="t in group.transactions"
                  :key="t.id"
                  class="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-white/70 hover:border-[rgba(175,143,60,0.15)] hover:shadow-sm transition-all"
                >
                  <!-- Category icon -->
                  <div
                    class="size-9 rounded-lg flex items-center justify-center shrink-0"
                    :class="TYPE_STYLES[t.type]?.icon"
                  >
                    <UIcon
                      :name="getCategoryIcon(t.categorie)"
                      class="size-4"
                    />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-stone-800 truncate">{{ t.libelle }}</p>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] text-stone-400">
                        {{ getCategoryLabel(t.categorie) }}
                      </span>
                      <span v-if="t.recurrence !== 'unique'" class="text-[11px] text-stone-400">
                        - {{ TRANSACTION_RECURRENCES[t.recurrence]?.label }}
                      </span>
                      <span v-if="getProjetName(t)" class="inline-flex items-center gap-0.5 text-[10px] text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full">
                        <UIcon name="i-lucide-folder" class="size-2.5" />
                        {{ getProjetName(t) }}
                      </span>
                      <span v-if="t.notes" class="text-[11px] text-stone-400 truncate">
                        - {{ t.notes }}
                      </span>
                    </div>
                  </div>

                  <!-- Amount -->
                  <span
                    class="text-sm font-bold tabular-nums shrink-0"
                    :class="TYPE_STYLES[t.type]?.text"
                  >
                    {{ txIsPositive(t) ? '+' : '-' }}{{ formatMoney(t.montant) }} &euro;
                  </span>

                  <!-- Actions (directors only) -->
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

          <!-- Pagination -->
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
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">
            {{ editingId ? 'Modifier la transaction' : 'Nouvelle transaction' }}
          </h3>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Type toggle (3 options) -->
            <div class="flex items-center justify-center">
              <div class="inline-flex items-center rounded-xl border-2 overflow-hidden transition-colors"
                :class="{
                  'border-red-300': form.type === 'depense',
                  'border-emerald-300': form.type === 'recette',
                  'border-amber-300': form.type === 'fondateur'
                }"
              >
                <button
                  type="button"
                  class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'depense'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'depense'"
                >
                  <UIcon name="i-lucide-trending-down" class="size-4" />
                  Depense
                </button>
                <button
                  type="button"
                  class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'recette'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'recette'"
                >
                  <UIcon name="i-lucide-trending-up" class="size-4" />
                  Recette
                </button>
                <button
                  type="button"
                  class="px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-1.5"
                  :class="form.type === 'fondateur'
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'fondateur'"
                >
                  <UIcon name="i-lucide-heart-handshake" class="size-4" />
                  Fondateur
                </button>
              </div>
            </div>

            <!-- Libelle + Montant -->
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Libelle" required class="col-span-2">
                <UInput v-model="form.libelle" placeholder="Description..." icon="i-lucide-text" class="w-full" />
              </UFormField>
              <UFormField label="Montant" required>
                <UInput v-model.number="form.montant" type="number" :min="0" step="0.01" placeholder="0.00" icon="i-lucide-euro" class="w-full" />
              </UFormField>
            </div>

            <!-- Categorie + Date -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Categorie">
                <div class="flex items-center gap-1.5">
                  <USelect
                    v-if="formCategories.length"
                    v-model="form.categorie"
                    :items="formCategories"
                    value-key="value"
                    class="flex-1"
                  />
                  <span v-else class="flex-1 text-sm text-stone-400 italic">Aucune categorie</span>
                  <UTooltip text="Nouvelle categorie">
                    <UButton
                      icon="i-lucide-plus"
                      size="xs"
                      variant="ghost"
                      color="neutral"
                      @click="showAddCat = !showAddCat"
                    />
                  </UTooltip>
                </div>
                <!-- Inline add category -->
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

            <!-- Recurrence + Notes -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Recurrence">
                <USelect v-model="form.recurrence" :items="recOptions" value-key="value" class="w-full" />
              </UFormField>
              <UFormField label="Notes">
                <UInput v-model="form.notes" placeholder="Optionnel..." class="w-full" />
              </UFormField>
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
