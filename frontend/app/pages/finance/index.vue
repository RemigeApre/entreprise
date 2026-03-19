<script setup lang="ts">
import type { Transaction, TransactionType, TransactionCategorie, TransactionRecurrence } from '~/utils/types'
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES, TRANSACTION_RECURRENCES } from '~/utils/constants'

const { isDirecteur } = useAuth()
if (!isDirecteur.value) navigateTo('/dashboard')

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

// --- Add form ---
const showForm = ref(false)
const saving = ref(false)
const form = reactive({
  libelle: '',
  montant: null as number | null,
  type: 'depense' as TransactionType,
  categorie: 'autre' as TransactionCategorie,
  date: new Date().toISOString().split('T')[0],
  recurrence: 'unique' as TransactionRecurrence,
  notes: ''
})

const typeOptions = Object.entries(TRANSACTION_TYPES).map(([value, c]) => ({ label: c.label, value }))
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
}

async function handleAdd() {
  if (!form.libelle.trim() || !form.montant) return
  saving.value = true
  try {
    await create({
      libelle: form.libelle.trim(),
      montant: form.montant,
      type: form.type,
      categorie: form.categorie,
      date: form.date,
      recurrence: form.recurrence,
      notes: form.notes.trim() || null
    })
    toast.add({ title: 'Transaction ajoutee', color: 'success' })
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

function formatMoney(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const periodOptions = [
  { label: 'Ce mois', value: 'month' },
  { label: 'Ce trimestre', value: 'quarter' },
  { label: 'Cette annee', value: 'year' },
  { label: 'Tout', value: 'all' }
]
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Finance">
      <template #right>
        <UButton v-if="!showForm" label="Ajouter" icon="i-lucide-plus" size="sm" @click="showForm = true" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Summary cards -->
        <div class="px-4 sm:px-6 pt-4 pb-2">
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Recettes</p>
              <p class="text-lg font-bold text-emerald-600 tabular-nums">{{ formatMoney(totals.recettes) }} &euro;</p>
            </div>
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Depenses</p>
              <p class="text-lg font-bold text-red-500 tabular-nums">{{ formatMoney(totals.depenses) }} &euro;</p>
            </div>
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Solde</p>
              <p class="text-lg font-bold tabular-nums" :class="totals.solde >= 0 ? 'text-emerald-600' : 'text-red-500'">
                {{ totals.solde >= 0 ? '+' : '' }}{{ formatMoney(totals.solde) }} &euro;
              </p>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
          <div class="flex items-center gap-2">
            <button
              v-for="opt in periodOptions"
              :key="opt.value"
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterPeriod === opt.value ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterPeriod = opt.value as any"
            >
              {{ opt.label }}
            </button>
            <div class="w-px h-5 bg-stone-300/40 mx-1" />
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'all' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = 'all'"
            >Tout</button>
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'recette' ? 'bg-emerald-600 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = filterType === 'recette' ? 'all' : 'recette'"
            >Recettes</button>
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'depense' ? 'bg-red-500 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = filterType === 'depense' ? 'all' : 'depense'"
            >Depenses</button>
            <UInput v-model="search" placeholder="Rechercher..." icon="i-lucide-search" size="xs" class="ml-auto w-40" />
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4">
          <!-- Inline add form -->
          <div v-if="showForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
            <form class="space-y-3" @submit.prevent="handleAdd">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <UInput v-model="form.libelle" placeholder="Libelle..." size="sm" class="col-span-2" />
                <UInput v-model.number="form.montant" type="number" :min="0" step="0.01" placeholder="Montant" size="sm" />
                <USelect v-model="form.type" :items="typeOptions" value-key="value" size="sm" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <USelect v-model="form.categorie" :items="catOptions" value-key="value" size="sm" />
                <UInput v-model="form.date" type="date" size="sm" />
                <USelect v-model="form.recurrence" :items="recOptions" value-key="value" size="sm" />
                <UInput v-model="form.notes" placeholder="Notes..." size="sm" />
              </div>
              <div class="flex justify-end gap-2">
                <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showForm = false; resetForm()" />
                <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="saving" />
              </div>
            </form>
          </div>

          <!-- List -->
          <div v-if="!filtered.length" class="text-center py-12">
            <UIcon name="i-lucide-landmark" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucune transaction</p>
          </div>

          <div v-else class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
            <div
              v-for="(t, idx) in filtered"
              :key="t.id"
              class="flex items-center gap-3 px-4 py-2.5 group"
              :class="idx > 0 ? 'border-t border-stone-100' : ''"
            >
              <UIcon
                :name="TRANSACTION_CATEGORIES[t.categorie]?.icon || 'i-lucide-circle'"
                class="size-4 shrink-0"
                :class="t.type === 'recette' ? 'text-emerald-500' : 'text-red-400'"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-800 truncate">{{ t.libelle }}</p>
                <p class="text-[11px] text-stone-500">
                  {{ TRANSACTION_CATEGORIES[t.categorie]?.label }}
                  <span v-if="t.recurrence !== 'unique'" class="text-stone-400"> - {{ TRANSACTION_RECURRENCES[t.recurrence]?.label }}</span>
                  <span v-if="t.notes" class="text-stone-400"> - {{ t.notes }}</span>
                </p>
              </div>
              <span class="text-xs text-stone-400 shrink-0 tabular-nums">{{ formatDate(t.date) }}</span>
              <span class="text-sm font-bold tabular-nums shrink-0" :class="t.type === 'recette' ? 'text-emerald-600' : 'text-red-500'">
                {{ t.type === 'recette' ? '+' : '-' }}{{ formatMoney(t.montant) }} &euro;
              </span>
              <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDelete(t.id)">
                <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
