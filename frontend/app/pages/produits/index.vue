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

const totalStock = computed(() => filtered.value.reduce((s, p) => s + p.stock, 0))
const totalValeur = computed(() => filtered.value.reduce((s, p) => s + p.prix_vente * p.stock, 0))
const totalMarge = computed(() => filtered.value.reduce((s, p) => s + (p.prix_vente - (p.prix_revient || 0)) * p.stock, 0))

const countByType = computed(() => {
  if (!produits.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const p of produits.value) c[p.type_produit] = (c[p.type_produit] || 0) + 1
  return c
})

// --- Add form ---
const showForm = ref(false)
const saving = ref(false)
const form = reactive({
  nom: '',
  type_produit: 'livre' as ProduitType,
  prix_vente: null as number | null,
  prix_revient: null as number | null,
  stock: 0,
  description: '',
  notes: ''
})

const typeOptions = Object.entries(PRODUIT_TYPES).map(([value, c]) => ({ label: c.label, value }))

function resetForm() {
  form.nom = ''
  form.type_produit = filterType.value !== 'all' ? filterType.value : 'livre'
  form.prix_vente = null
  form.prix_revient = null
  form.stock = 0
  form.description = ''
  form.notes = ''
}

async function handleAdd() {
  if (!form.nom.trim() || !form.prix_vente) return
  saving.value = true
  try {
    await createProduit({
      nom: form.nom.trim(),
      type_produit: form.type_produit,
      prix_vente: form.prix_vente,
      prix_revient: form.prix_revient,
      stock: form.stock || 0,
      description: form.description.trim() || null,
      notes: form.notes.trim() || null
    })
    toast.add({ title: 'Produit ajoute', color: 'success' })
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
  try { await removeProduit(id); await refresh() } catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Inline stock edit ---
async function adjustStock(p: Produit, delta: number) {
  const newStock = Math.max(0, p.stock + delta)
  try {
    await updateProduit(p.id, { stock: newStock })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Produits">
      <template #right>
        <UButton v-if="!showForm" label="Ajouter" icon="i-lucide-plus" size="sm" @click="showForm = true; resetForm()" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Summary -->
        <div class="px-4 sm:px-6 pt-4 pb-2">
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Stock total</p>
              <p class="text-lg font-bold text-stone-800 tabular-nums">{{ totalStock }} <span class="text-xs font-normal text-stone-400">unites</span></p>
            </div>
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Valeur stock</p>
              <p class="text-lg font-bold text-stone-800 tabular-nums">{{ formatMoney(totalValeur) }} &euro;</p>
            </div>
            <div class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-3 text-center">
              <p class="text-[11px] text-stone-500 uppercase tracking-wide">Marge potentielle</p>
              <p class="text-lg font-bold tabular-nums" :class="totalMarge >= 0 ? 'text-emerald-600' : 'text-red-500'">{{ formatMoney(totalMarge) }} &euro;</p>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
          <div class="flex items-center gap-2">
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === 'all' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = 'all'"
            >Tous <span class="opacity-60 tabular-nums">{{ produits?.length || 0 }}</span></button>
            <button
              v-for="(config, key) in PRODUIT_TYPES"
              :key="key"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterType === key ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterType = filterType === key ? 'all' : (key as ProduitType)"
            >
              <UIcon :name="config.icon" class="size-3" />
              {{ config.label }}
              <span v-if="countByType[key]" class="opacity-60 tabular-nums">{{ countByType[key] }}</span>
            </button>
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4">
          <!-- Add form -->
          <div v-if="showForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
            <form class="space-y-2.5" @submit.prevent="handleAdd">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <UInput v-model="form.nom" placeholder="Nom du produit..." size="sm" class="col-span-2" />
                <USelect v-model="form.type_produit" :items="typeOptions" value-key="value" size="sm" />
                <UInput v-model.number="form.stock" type="number" :min="0" placeholder="Stock" size="sm" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <UInput v-model.number="form.prix_vente" type="number" :min="0" step="0.01" placeholder="Prix de vente" size="sm" />
                <UInput v-model.number="form.prix_revient" type="number" :min="0" step="0.01" placeholder="Prix de revient" size="sm" />
                <UInput v-model="form.description" placeholder="Description..." size="sm" />
                <UInput v-model="form.notes" placeholder="Notes..." size="sm" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[11px] text-stone-400">
                  Code auto : {{ PRODUIT_TYPES[form.type_produit]?.prefix || '??' }}-XXXX
                </span>
                <div class="flex gap-2">
                  <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showForm = false" />
                  <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="saving" />
                </div>
              </div>
            </form>
          </div>

          <!-- Empty -->
          <div v-if="!filtered.length && !showForm" class="text-center py-12">
            <UIcon name="i-lucide-tag" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucun produit</p>
            <UButton label="Ajouter" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="showForm = true; resetForm()" />
          </div>

          <!-- List -->
          <div v-else class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
            <div
              v-for="(p, idx) in filtered"
              :key="p.id"
              class="flex items-center gap-3 px-4 py-3 group"
              :class="[idx > 0 ? 'border-t border-stone-100' : '', p.stock === 0 ? 'opacity-50' : '']"
            >
              <!-- Code -->
              <span class="shrink-0 text-[11px] font-mono text-stone-400 w-16">{{ p.code }}</span>

              <!-- Type icon -->
              <UIcon :name="PRODUIT_TYPES[p.type_produit]?.icon || 'i-lucide-tag'" class="size-4 text-stone-500 shrink-0" />

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-800 truncate">{{ p.nom }}</p>
                <p v-if="p.description || p.notes" class="text-[11px] text-stone-500 truncate">
                  {{ p.description }}
                  <span v-if="p.notes" class="text-stone-400">{{ p.description ? ' - ' : '' }}{{ p.notes }}</span>
                </p>
              </div>

              <!-- Stock controls -->
              <div class="flex items-center gap-1 shrink-0">
                <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, -1)">
                  <UIcon name="i-lucide-minus" class="size-3" />
                </button>
                <span class="text-sm font-bold tabular-nums w-8 text-center" :class="p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-600' : 'text-stone-800'">
                  {{ p.stock }}
                </span>
                <button class="size-6 rounded flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors" @click="adjustStock(p, 1)">
                  <UIcon name="i-lucide-plus" class="size-3" />
                </button>
              </div>

              <!-- Prices -->
              <div class="shrink-0 text-right w-20">
                <p class="text-sm font-bold text-stone-800 tabular-nums">{{ formatMoney(p.prix_vente) }} &euro;</p>
                <p v-if="p.prix_revient" class="text-[11px] text-stone-400 tabular-nums">
                  marge {{ formatMoney(p.prix_vente - p.prix_revient) }} &euro;
                </p>
              </div>

              <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDelete(p.id)">
                <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
