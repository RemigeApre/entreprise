<script setup lang="ts">
import type { Materiel, MaterielEtat, MaterielCategorie, AchatPrevu, AchatType, AchatStatut } from '~/utils/types'
import { MATERIEL_CATEGORIES, MATERIEL_ETATS, ACHAT_TYPES, ACHAT_STATUTS } from '~/utils/constants'

const { isDirecteur } = useAuth()
if (!isDirecteur.value) navigateTo('/dashboard')

const { getAllMateriels, createMateriel, updateMateriel, removeMateriel, getAllAchats, createAchat, updateAchat, removeAchat } = useMateriel()
const toast = useToast()

const { data: materiels, status: matStatus, refresh: refreshMat } = useAsyncData('materiels', getAllMateriels)
const { data: achats, status: achStatus, refresh: refreshAch } = useAsyncData('achats', getAllAchats)

const view = ref<'inventaire' | 'achats'>('inventaire')
const filterCat = ref<MaterielCategorie | 'all'>('all')

// --- Filtered data ---
const filteredMateriels = computed(() => {
  if (!materiels.value) return []
  return materiels.value.filter(m => filterCat.value === 'all' || m.categorie === filterCat.value)
})

const filteredAchats = computed(() => {
  if (!achats.value) return []
  return achats.value.filter(a => filterCat.value === 'all' || a.categorie === filterCat.value)
})

// --- Stats ---
const matCountByCat = computed(() => {
  if (!materiels.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const m of materiels.value) c[m.categorie] = (c[m.categorie] || 0) + 1
  return c
})

const achCountByCat = computed(() => {
  if (!achats.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const a of achats.value) if (a.statut !== 'recu') c[a.categorie] = (c[a.categorie] || 0) + 1
  return c
})

const totalItems = computed(() => filteredMateriels.value.reduce((s, m) => s + (m.quantite || 1), 0))
const totalValue = computed(() => filteredMateriels.value.filter(m => m.etat !== 'hs' && m.etat !== 'vendu').reduce((s, m) => s + (m.prix_achat || 0), 0))
const totalAchats = computed(() => filteredAchats.value.filter(a => a.statut !== 'recu').reduce((s, a) => s + (a.prix_estime || 0) * (a.quantite || 1), 0))

// --- Group by categorie ---
const groupedMateriels = computed(() => {
  const groups: Record<string, Materiel[]> = {}
  for (const m of filteredMateriels.value) {
    if (!groups[m.categorie]) groups[m.categorie] = []
    groups[m.categorie].push(m)
  }
  return groups
})

// --- Add materiel ---
const showMatForm = ref(false)
const savingMat = ref(false)
const matForm = reactive({
  nom: '',
  categorie: 'bureau' as MaterielCategorie,
  reference: '',
  quantite: 1,
  etat: 'bon' as MaterielEtat,
  date_achat: '',
  prix_achat: null as number | null,
  prix_unitaire: null as number | null,
  notes: ''
})

const catOptions = Object.entries(MATERIEL_CATEGORIES).map(([value, c]) => ({ label: c.label, value }))
const etatOptions = Object.entries(MATERIEL_ETATS).map(([value, c]) => ({ label: c.label, value }))

function resetMatForm() {
  matForm.nom = ''
  matForm.categorie = filterCat.value !== 'all' ? filterCat.value : 'bureau'
  matForm.reference = ''
  matForm.quantite = 1
  matForm.etat = 'bon'
  matForm.date_achat = ''
  matForm.prix_achat = null
  matForm.prix_unitaire = null
  matForm.notes = ''
}

async function handleAddMat() {
  if (!matForm.nom.trim()) return
  savingMat.value = true
  try {
    await createMateriel({
      nom: matForm.nom.trim(),
      categorie: matForm.categorie,
      reference: matForm.reference.trim() || null,
      quantite: matForm.quantite || 1,
      etat: matForm.etat,
      date_achat: matForm.date_achat || null,
      prix_achat: matForm.prix_achat,
      prix_unitaire: matForm.prix_unitaire,
      notes: matForm.notes.trim() || null
    })
    toast.add({ title: 'Ajoute', color: 'success' })
    showMatForm.value = false
    resetMatForm()
    await refreshMat()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    savingMat.value = false
  }
}

async function handleDeleteMat(id: string) {
  try { await removeMateriel(id); await refreshMat() } catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

async function cycleEtat(m: Materiel) {
  const order: MaterielEtat[] = ['neuf', 'bon', 'use', 'hs', 'vendu']
  const next = order[(order.indexOf(m.etat) + 1) % order.length]
  try { await updateMateriel(m.id, { etat: next }); await refreshMat() } catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Add achat ---
const showAchForm = ref(false)
const savingAch = ref(false)
const achForm = reactive({
  nom: '',
  categorie: 'bureau' as MaterielCategorie,
  prix_estime: null as number | null,
  quantite: 1,
  type: 'ponctuel' as AchatType,
  prochaine_date: '',
  recurrence_mois: null as number | null,
  notes: ''
})

const achatTypeOptions = Object.entries(ACHAT_TYPES).map(([value, c]) => ({ label: c.label, value }))

function resetAchForm() {
  achForm.nom = ''
  achForm.categorie = filterCat.value !== 'all' ? filterCat.value : 'bureau'
  achForm.prix_estime = null
  achForm.quantite = 1
  achForm.type = 'ponctuel'
  achForm.prochaine_date = ''
  achForm.recurrence_mois = null
  achForm.notes = ''
}

async function handleAddAch() {
  if (!achForm.nom.trim()) return
  savingAch.value = true
  try {
    await createAchat({
      nom: achForm.nom.trim(),
      categorie: achForm.categorie,
      prix_estime: achForm.prix_estime,
      quantite: achForm.quantite || 1,
      type: achForm.type,
      statut: 'a_acheter',
      prochaine_date: achForm.prochaine_date || null,
      recurrence_mois: achForm.type === 'recurrent' ? achForm.recurrence_mois : null,
      notes: achForm.notes.trim() || null
    })
    toast.add({ title: 'Ajoute', color: 'success' })
    showAchForm.value = false
    resetAchForm()
    await refreshAch()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    savingAch.value = false
  }
}

async function cycleAchatStatut(a: AchatPrevu) {
  const order: AchatStatut[] = ['a_acheter', 'commande', 'recu']
  const next = order[(order.indexOf(a.statut) + 1) % order.length]
  try { await updateAchat(a.id, { statut: next }); await refreshAch() } catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

async function handleDeleteAch(id: string) {
  try { await removeAchat(id); await refreshAch() } catch { toast.add({ title: 'Erreur', color: 'error' }) }
}

// --- Helpers ---
function getUserName(m: Materiel): string {
  if (!m.affecte_a || typeof m.affecte_a === 'string') return ''
  return [m.affecte_a.first_name, m.affecte_a.last_name].filter(Boolean).join(' ')
}

function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function etatColor(e: MaterielEtat) {
  return { neuf: 'bg-emerald-100 text-emerald-700', bon: 'bg-blue-100 text-blue-700', use: 'bg-amber-100 text-amber-700', hs: 'bg-red-100 text-red-600', vendu: 'bg-stone-100 text-stone-500' }[e] || ''
}

function achatStatutColor(s: AchatStatut) {
  return { a_acheter: 'bg-amber-100 text-amber-700', commande: 'bg-blue-100 text-blue-700', recu: 'bg-emerald-100 text-emerald-700' }[s] || ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Materiel">
      <template #right>
        <UButton
          v-if="(view === 'inventaire' && !showMatForm) || (view === 'achats' && !showAchForm)"
          label="Ajouter"
          icon="i-lucide-plus"
          size="sm"
          @click="view === 'inventaire' ? (showMatForm = true, resetMatForm()) : (showAchForm = true, resetAchForm())"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div v-if="matStatus === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- Toolbar -->
        <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <!-- View toggle -->
            <button
              class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :class="view === 'inventaire' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="view = 'inventaire'"
            >
              Inventaire
              <span class="opacity-60 tabular-nums">{{ materiels?.length || 0 }}</span>
            </button>
            <button
              class="shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all"
              :class="view === 'achats' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="view = 'achats'"
            >
              A acheter
              <span class="opacity-60 tabular-nums">{{ achats?.filter(a => a.statut !== 'recu').length || 0 }}</span>
            </button>

            <div class="shrink-0 w-px h-5 bg-stone-300/40 mx-1" />

            <!-- Category filter -->
            <button
              class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterCat === 'all' ? 'bg-stone-600 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterCat = 'all'"
            >Tout</button>
            <button
              v-for="(config, key) in MATERIEL_CATEGORIES"
              :key="key"
              class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterCat === key ? 'bg-stone-600 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterCat = filterCat === key ? 'all' : (key as MaterielCategorie)"
            >
              <UIcon :name="config.icon" class="size-3" />
              {{ config.label }}
              <span v-if="view === 'inventaire' && matCountByCat[key]" class="opacity-60 tabular-nums">{{ matCountByCat[key] }}</span>
              <span v-if="view === 'achats' && achCountByCat[key]" class="opacity-60 tabular-nums">{{ achCountByCat[key] }}</span>
            </button>

            <!-- Stats -->
            <span class="shrink-0 ml-auto text-xs text-stone-500 tabular-nums">
              <template v-if="view === 'inventaire'">{{ totalItems }} articles - {{ formatMoney(totalValue) }} &euro;</template>
              <template v-else>{{ formatMoney(totalAchats) }} &euro; a prevoir</template>
            </span>
          </div>
        </div>

        <div class="px-4 sm:px-6 py-4">
          <!-- ============ INVENTAIRE ============ -->
          <template v-if="view === 'inventaire'">
            <!-- Add form -->
            <div v-if="showMatForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
              <form class="space-y-2.5" @submit.prevent="handleAddMat">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <UInput v-model="matForm.nom" placeholder="Nom..." size="sm" class="col-span-2" />
                  <USelect v-model="matForm.categorie" :items="catOptions" value-key="value" size="sm" />
                  <USelect v-model="matForm.etat" :items="etatOptions" value-key="value" size="sm" />
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <UInput v-model="matForm.reference" placeholder="Reference..." size="sm" />
                  <UInput v-model.number="matForm.quantite" type="number" :min="1" placeholder="Qte" size="sm" />
                  <UInput v-model.number="matForm.prix_achat" type="number" :min="0" step="0.01" placeholder="Prix total" size="sm" />
                  <UInput v-model.number="matForm.prix_unitaire" type="number" :min="0" step="0.01" placeholder="Prix/unite" size="sm" />
                  <UInput v-model="matForm.notes" placeholder="Notes..." size="sm" />
                </div>
                <div class="flex justify-end gap-2">
                  <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showMatForm = false" />
                  <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="savingMat" />
                </div>
              </form>
            </div>

            <div v-if="!filteredMateriels.length && !showMatForm" class="text-center py-12">
              <UIcon name="i-lucide-monitor" class="size-10 text-stone-300 mx-auto mb-3" />
              <p class="text-stone-500">Aucun materiel</p>
              <UButton label="Ajouter" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="showMatForm = true; resetMatForm()" />
            </div>

            <!-- Grouped by category -->
            <div v-else class="space-y-4">
              <div v-for="(items, cat) in groupedMateriels" :key="cat">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon :name="MATERIEL_CATEGORIES[cat as MaterielCategorie]?.icon || 'i-lucide-box'" class="size-4 text-stone-500" />
                  <span class="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                    {{ MATERIEL_CATEGORIES[cat as MaterielCategorie]?.label || cat }}
                  </span>
                  <span class="text-[11px] text-stone-400 tabular-nums">{{ items.reduce((s, m) => s + (m.quantite || 1), 0) }} articles</span>
                </div>

                <div class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
                  <div
                    v-for="(m, idx) in items"
                    :key="m.id"
                    class="flex items-center gap-3 px-4 py-2.5 group"
                    :class="[idx > 0 ? 'border-t border-stone-100' : '', m.etat === 'hs' || m.etat === 'vendu' ? 'opacity-40' : '']"
                  >
                    <button
                      class="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                      :class="etatColor(m.etat)"
                      title="Changer l'etat"
                      @click="cycleEtat(m)"
                    >{{ MATERIEL_ETATS[m.etat]?.label }}</button>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-medium text-stone-800 truncate">{{ m.nom }}</p>
                        <span v-if="m.quantite > 1" class="text-[11px] text-stone-400 tabular-nums shrink-0">x{{ m.quantite }}</span>
                      </div>
                      <p class="text-[11px] text-stone-500 truncate">
                        <span v-if="m.reference">{{ m.reference }}</span>
                        <span v-if="getUserName(m)">{{ m.reference ? ' - ' : '' }}{{ getUserName(m) }}</span>
                        <span v-if="m.notes" class="text-stone-400">{{ (m.reference || getUserName(m)) ? ' - ' : '' }}{{ m.notes }}</span>
                      </p>
                    </div>

                    <span v-if="m.prix_achat" class="text-xs text-stone-500 tabular-nums shrink-0">{{ formatMoney(m.prix_achat) }} &euro;</span>
                    <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDeleteMat(m.id)">
                      <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ ACHATS PREVUS ============ -->
          <template v-if="view === 'achats'">
            <div v-if="showAchForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
              <form class="space-y-2.5" @submit.prevent="handleAddAch">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <UInput v-model="achForm.nom" placeholder="Quoi acheter..." size="sm" class="col-span-2" />
                  <USelect v-model="achForm.categorie" :items="catOptions" value-key="value" size="sm" />
                  <USelect v-model="achForm.type" :items="achatTypeOptions" value-key="value" size="sm" />
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <UInput v-model.number="achForm.quantite" type="number" :min="1" placeholder="Qte" size="sm" />
                  <UInput v-model.number="achForm.prix_estime" type="number" :min="0" step="0.01" placeholder="Prix estime" size="sm" />
                  <UInput v-model="achForm.prochaine_date" type="date" size="sm" />
                  <UInput v-if="achForm.type === 'recurrent'" v-model.number="achForm.recurrence_mois" type="number" :min="1" placeholder="Tous les X mois" size="sm" />
                  <UInput v-else v-model="achForm.notes" placeholder="Notes..." size="sm" />
                </div>
                <div class="flex justify-end gap-2">
                  <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showAchForm = false" />
                  <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="savingAch" />
                </div>
              </form>
            </div>

            <div v-if="!filteredAchats.length && !showAchForm" class="text-center py-12">
              <UIcon name="i-lucide-shopping-cart" class="size-10 text-stone-300 mx-auto mb-3" />
              <p class="text-stone-500">Aucun achat prevu</p>
              <UButton label="Ajouter" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="showAchForm = true; resetAchForm()" />
            </div>

            <div v-else class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
              <div
                v-for="(a, idx) in filteredAchats"
                :key="a.id"
                class="flex items-center gap-3 px-4 py-2.5 group"
                :class="[idx > 0 ? 'border-t border-stone-100' : '', a.statut === 'recu' ? 'opacity-40' : '']"
              >
                <button
                  class="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                  :class="achatStatutColor(a.statut)"
                  title="Changer le statut"
                  @click="cycleAchatStatut(a)"
                >
                  <UIcon :name="ACHAT_STATUTS[a.statut]?.icon || 'i-lucide-circle'" class="size-3" />
                  {{ ACHAT_STATUTS[a.statut]?.label }}
                </button>

                <UIcon :name="MATERIEL_CATEGORIES[a.categorie]?.icon || 'i-lucide-box'" class="size-3.5 text-stone-400 shrink-0" />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-stone-800 truncate">{{ a.nom }}</p>
                    <span v-if="a.quantite > 1" class="text-[11px] text-stone-400 tabular-nums shrink-0">x{{ a.quantite }}</span>
                  </div>
                  <p class="text-[11px] text-stone-500 truncate">
                    <span>{{ MATERIEL_CATEGORIES[a.categorie]?.label }}</span>
                    <span v-if="a.type === 'recurrent' && a.recurrence_mois" class="text-stone-400"> - Tous les {{ a.recurrence_mois }} mois</span>
                    <span v-if="a.prochaine_date" class="text-stone-400"> - {{ new Date(a.prochaine_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}</span>
                    <span v-if="a.notes" class="text-stone-400"> - {{ a.notes }}</span>
                  </p>
                </div>

                <span v-if="a.prix_estime" class="text-xs text-stone-500 tabular-nums shrink-0">
                  ~{{ formatMoney(a.prix_estime * (a.quantite || 1)) }} &euro;
                </span>
                <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDeleteAch(a.id)">
                  <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
                </button>
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>
