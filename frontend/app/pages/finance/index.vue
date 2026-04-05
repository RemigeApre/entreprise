<script setup lang="ts">
import type { Transaction, TransactionType, TransactionCategorie, TransactionRecurrence } from '~/utils/types'
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES, TRANSACTION_RECURRENCES } from '~/utils/constants'

const { isDirecteur } = useAuth()
const { getAll, create, update, remove } = useFinance()
const toast = useToast()

const { data: transactions, status, refresh } = useAsyncData('transactions', getAll)

// --- Filters ---
const filterType = ref<TransactionType | 'all'>('all')
const filterPeriod = ref<'all' | 'month' | 'quarter' | 'year'>('month')
const search = ref('')

const filtered = computed(() => {
  if (!transactions.value) return []
  const now = new Date()
  return transactions.value.filter(t => {
    if (filterType.value !== 'all' && t.type !== filterType.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!t.libelle.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q)) return false
    }
    if (filterPeriod.value !== 'all') {
      const d = new Date(t.date)
      if (filterPeriod.value === 'month' && (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())) return false
      if (filterPeriod.value === 'quarter') {
        const q1 = Math.floor(now.getMonth() / 3)
        const q2 = Math.floor(d.getMonth() / 3)
        if (q1 !== q2 || d.getFullYear() !== now.getFullYear()) return false
      }
      if (filterPeriod.value === 'year' && d.getFullYear() !== now.getFullYear()) return false
    }
    return true
  })
})

const totals = computed(() => {
  const recettes = filtered.value.filter(t => t.type === 'recette').reduce((s, t) => s + t.montant, 0)
  const depenses = filtered.value.filter(t => t.type === 'depense').reduce((s, t) => s + t.montant, 0)
  return { recettes, depenses, solde: recettes - depenses }
})

// --- Group transactions by date ---
interface DateGroup {
  label: string
  date: string
  transactions: Transaction[]
}

const groupedByDate = computed<DateGroup[]>(() => {
  const map = new Map<string, Transaction[]>()
  for (const t of filtered.value) {
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
  categorie: 'autre' as TransactionCategorie,
  date: new Date().toISOString().split('T')[0],
  recurrence: 'unique' as TransactionRecurrence,
  notes: '',
  projet: null as string | null
})

const catOptions = Object.entries(TRANSACTION_CATEGORIES).map(([value, c]) => ({ label: c.label, value }))
const recOptions = Object.entries(TRANSACTION_RECURRENCES).map(([value, c]) => ({ label: c.label, value }))

function resetForm() {
  form.libelle = ''
  form.montant = null
  form.type = 'depense'
  form.categorie = 'autre'
  form.date = new Date().toISOString().split('T')[0]
  form.recurrence = 'unique'
  form.notes = ''
  form.projet = null
  editingId.value = null
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
  form.categorie = t.categorie
  form.date = t.date
  form.recurrence = t.recurrence
  form.notes = t.notes || ''
  form.projet = t.projet && typeof t.projet === 'object' ? t.projet.id : (t.projet as string | null)
  showForm.value = true
}

async function handleSubmit() {
  if (!form.libelle.trim() || !form.montant) return
  saving.value = true
  try {
    const data: Partial<Transaction> = {
      libelle: form.libelle.trim(),
      montant: form.montant,
      type: form.type,
      categorie: form.categorie,
      date: form.date,
      recurrence: form.recurrence,
      notes: form.notes.trim() || null,
      projet: form.projet || null
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

// --- Helpers ---
function formatMoney(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateLong(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const periodOptions = [
  { label: 'Ce mois', value: 'month' },
  { label: 'Trimestre', value: 'quarter' },
  { label: 'Annee', value: 'year' },
  { label: 'Tout', value: 'all' }
]

function getProjetName(t: Transaction): string | null {
  if (!t.projet) return null
  if (typeof t.projet === 'object') return t.projet.nom
  return null
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Finance">
      <template #right>
        <UButton
          v-if="isDirecteur && !showForm"
          label="Ajouter"
          icon="i-lucide-plus"
          size="sm"
          @click="openAdd"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Solde central -->
        <div class="px-4 sm:px-6 pt-6 pb-4">
          <div class="max-w-sm mx-auto text-center mb-4">
            <p class="text-[11px] text-stone-500 uppercase tracking-widest mb-1">Solde</p>
            <p
              class="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight"
              :class="totals.solde >= 0 ? 'text-emerald-600' : 'text-red-500'"
            >
              {{ totals.solde >= 0 ? '+' : '' }}{{ formatMoney(totals.solde) }} <span class="text-lg">&euro;</span>
            </p>
          </div>

          <!-- Recettes / Depenses under solde -->
          <div class="flex items-center justify-center gap-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="size-2 rounded-full bg-emerald-500" />
              <span class="text-stone-500">Recettes</span>
              <span class="font-semibold text-emerald-600 tabular-nums">{{ formatMoney(totals.recettes) }} &euro;</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="size-2 rounded-full bg-red-400" />
              <span class="text-stone-500">Depenses</span>
              <span class="font-semibold text-red-500 tabular-nums">{{ formatMoney(totals.depenses) }} &euro;</span>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              v-for="opt in periodOptions"
              :key="opt.value"
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterPeriod === opt.value ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterPeriod = opt.value as any"
            >
              {{ opt.label }}
            </button>
            <div class="shrink-0 w-px h-5 bg-stone-300/40 mx-1" />
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
            <UInput v-model="search" placeholder="Rechercher..." icon="i-lucide-search" size="xs" class="ml-auto w-40 shrink-0" />
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
                    :class="t.type === 'recette' ? 'bg-emerald-50' : 'bg-red-50'"
                  >
                    <UIcon
                      :name="TRANSACTION_CATEGORIES[t.categorie]?.icon || 'i-lucide-circle'"
                      class="size-4"
                      :class="t.type === 'recette' ? 'text-emerald-600' : 'text-red-400'"
                    />
                  </div>

                  <!-- Content -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-stone-800 truncate">{{ t.libelle }}</p>
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="text-[11px] text-stone-400">
                        {{ TRANSACTION_CATEGORIES[t.categorie]?.label }}
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
                    :class="t.type === 'recette' ? 'text-emerald-600' : 'text-red-500'"
                  >
                    {{ t.type === 'recette' ? '+' : '-' }}{{ formatMoney(t.montant) }} &euro;
                  </span>

                  <!-- Actions (directors only) -->
                  <div v-if="isDirecteur" class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      class="p-1 rounded hover:bg-stone-100 transition-colors"
                      @click="openEdit(t)"
                    >
                      <UIcon name="i-lucide-pencil" class="size-3.5 text-stone-400" />
                    </button>
                    <button
                      class="p-1 rounded hover:bg-red-50 transition-colors"
                      @click="handleDelete(t.id)"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-3.5 text-stone-400 hover:text-red-400" />
                    </button>
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
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 mb-5">
            {{ editingId ? 'Modifier la transaction' : 'Nouvelle transaction' }}
          </h3>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Type toggle -->
            <div class="flex items-center justify-center">
              <div class="inline-flex items-center rounded-xl border-2 overflow-hidden transition-colors"
                :class="form.type === 'recette' ? 'border-emerald-300' : 'border-red-300'"
              >
                <button
                  type="button"
                  class="px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2"
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
                  class="px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2"
                  :class="form.type === 'recette'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-stone-400 hover:text-stone-600'"
                  @click="form.type = 'recette'"
                >
                  <UIcon name="i-lucide-trending-up" class="size-4" />
                  Recette
                </button>
              </div>
            </div>

            <!-- Libelle + Montant -->
            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Libelle" required class="col-span-2">
                <UInput
                  v-model="form.libelle"
                  placeholder="Description..."
                  icon="i-lucide-text"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Montant" required>
                <UInput
                  v-model.number="form.montant"
                  type="number"
                  :min="0"
                  step="0.01"
                  placeholder="0.00"
                  icon="i-lucide-euro"
                  class="w-full"
                />
              </UFormField>
            </div>

            <!-- Categorie + Date -->
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Categorie">
                <USelect v-model="form.categorie" :items="catOptions" value-key="value" class="w-full" />
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
