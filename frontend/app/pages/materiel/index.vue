<script setup lang="ts">
import type { Materiel, MaterielEtat, AchatPrevu, AchatType, AchatStatut } from '~/utils/types'
import { MATERIEL_ETATS, ACHAT_TYPES, ACHAT_STATUTS } from '~/utils/constants'

const { isDirecteur } = useAuth()
if (!isDirecteur.value) navigateTo('/dashboard')

const { getAllMateriels, createMateriel, updateMateriel, removeMateriel, getAllAchats, createAchat, updateAchat, removeAchat } = useMateriel()
const toast = useToast()

const { data: materiels, status: matStatus, refresh: refreshMat } = useAsyncData('materiels', getAllMateriels)
const { data: achats, status: achStatus, refresh: refreshAch } = useAsyncData('achats', getAllAchats)

const tab = ref<'inventaire' | 'achats'>('inventaire')

// --- Inventaire ---
const showMatForm = ref(false)
const savingMat = ref(false)
const matForm = reactive({
  nom: '',
  reference: '',
  etat: 'bon' as MaterielEtat,
  date_achat: '',
  prix_achat: null as number | null,
  notes: ''
})

const etatOptions = Object.entries(MATERIEL_ETATS).map(([value, c]) => ({ label: c.label, value }))

function resetMatForm() {
  matForm.nom = ''
  matForm.reference = ''
  matForm.etat = 'bon'
  matForm.date_achat = ''
  matForm.prix_achat = null
  matForm.notes = ''
}

async function handleAddMat() {
  if (!matForm.nom.trim()) return
  savingMat.value = true
  try {
    await createMateriel({
      nom: matForm.nom.trim(),
      reference: matForm.reference.trim() || null,
      etat: matForm.etat,
      date_achat: matForm.date_achat || null,
      prix_achat: matForm.prix_achat,
      notes: matForm.notes.trim() || null
    })
    toast.add({ title: 'Materiel ajoute', color: 'success' })
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
  try {
    await removeMateriel(id)
    toast.add({ title: 'Supprime', color: 'success' })
    await refreshMat()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function cycleEtat(m: Materiel) {
  const order: MaterielEtat[] = ['neuf', 'bon', 'use', 'hs', 'vendu']
  const next = order[(order.indexOf(m.etat) + 1) % order.length]
  try {
    await updateMateriel(m.id, { etat: next })
    await refreshMat()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Achats prevus ---
const showAchForm = ref(false)
const savingAch = ref(false)
const achForm = reactive({
  nom: '',
  prix_estime: null as number | null,
  type: 'ponctuel' as AchatType,
  prochaine_date: '',
  recurrence_mois: null as number | null,
  notes: ''
})

const achatTypeOptions = Object.entries(ACHAT_TYPES).map(([value, c]) => ({ label: c.label, value }))

function resetAchForm() {
  achForm.nom = ''
  achForm.prix_estime = null
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
      prix_estime: achForm.prix_estime,
      type: achForm.type,
      statut: 'a_acheter',
      prochaine_date: achForm.prochaine_date || null,
      recurrence_mois: achForm.type === 'recurrent' ? achForm.recurrence_mois : null,
      notes: achForm.notes.trim() || null
    })
    toast.add({ title: 'Achat ajoute', color: 'success' })
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
  try {
    await updateAchat(a.id, { statut: next })
    await refreshAch()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function handleDeleteAch(id: string) {
  try {
    await removeAchat(id)
    toast.add({ title: 'Supprime', color: 'success' })
    await refreshAch()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Helpers ---
function getUserName(m: Materiel): string {
  if (!m.affecte_a || typeof m.affecte_a === 'string') return ''
  return [m.affecte_a.first_name, m.affecte_a.last_name].filter(Boolean).join(' ')
}

function formatMoney(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function etatColor(e: MaterielEtat) {
  const map: Record<string, string> = {
    neuf: 'bg-emerald-100 text-emerald-700',
    bon: 'bg-blue-100 text-blue-700',
    use: 'bg-amber-100 text-amber-700',
    hs: 'bg-red-100 text-red-600',
    vendu: 'bg-stone-100 text-stone-500'
  }
  return map[e] || map.bon
}

function achatStatutColor(s: AchatStatut) {
  const map: Record<string, string> = {
    a_acheter: 'bg-amber-100 text-amber-700',
    commande: 'bg-blue-100 text-blue-700',
    recu: 'bg-emerald-100 text-emerald-700'
  }
  return map[s] || map.a_acheter
}

const totalInventaire = computed(() => {
  if (!materiels.value) return 0
  return materiels.value.filter(m => m.etat !== 'vendu' && m.etat !== 'hs').reduce((s, m) => s + (m.prix_achat || 0), 0)
})

const totalAchats = computed(() => {
  if (!achats.value) return 0
  return achats.value.filter(a => a.statut !== 'recu').reduce((s, a) => s + (a.prix_estime || 0), 0)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Materiel">
      <template #right>
        <UButton
          v-if="tab === 'inventaire' && !showMatForm"
          label="Ajouter"
          icon="i-lucide-plus"
          size="sm"
          @click="showMatForm = true"
        />
        <UButton
          v-if="tab === 'achats' && !showAchForm"
          label="Ajouter"
          icon="i-lucide-plus"
          size="sm"
          @click="showAchForm = true"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <!-- Tab switch -->
      <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
        <div class="flex items-center gap-2">
          <button
            class="px-3 py-1 rounded-full text-xs font-medium transition-all"
            :class="tab === 'inventaire' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
            @click="tab = 'inventaire'"
          >
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-monitor" class="size-3" />
              Inventaire
              <span v-if="materiels?.length" class="opacity-60 tabular-nums">{{ materiels.length }}</span>
            </span>
          </button>
          <button
            class="px-3 py-1 rounded-full text-xs font-medium transition-all"
            :class="tab === 'achats' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
            @click="tab = 'achats'"
          >
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-shopping-cart" class="size-3" />
              Achats prevus
              <span v-if="achats?.length" class="opacity-60 tabular-nums">{{ achats.length }}</span>
            </span>
          </button>

          <span class="ml-auto text-xs text-stone-500 tabular-nums">
            <template v-if="tab === 'inventaire'">Valeur : {{ formatMoney(totalInventaire) }} &euro;</template>
            <template v-else>A prevoir : {{ formatMoney(totalAchats) }} &euro;</template>
          </span>
        </div>
      </div>

      <div class="px-4 sm:px-6 py-4">
        <!-- ============ INVENTAIRE ============ -->
        <template v-if="tab === 'inventaire'">
          <!-- Add form -->
          <div v-if="showMatForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
            <form class="space-y-3" @submit.prevent="handleAddMat">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <UInput v-model="matForm.nom" placeholder="Nom du materiel..." size="sm" class="col-span-2 sm:col-span-1" />
                <UInput v-model="matForm.reference" placeholder="Reference / modele..." size="sm" />
                <USelect v-model="matForm.etat" :items="etatOptions" value-key="value" size="sm" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <UInput v-model="matForm.date_achat" type="date" size="sm" />
                <UInput v-model.number="matForm.prix_achat" type="number" :min="0" step="0.01" placeholder="Prix d'achat" size="sm" />
                <UInput v-model="matForm.notes" placeholder="Notes..." size="sm" />
              </div>
              <div class="flex justify-end gap-2">
                <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showMatForm = false; resetMatForm()" />
                <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="savingMat" />
              </div>
            </form>
          </div>

          <div v-if="matStatus === 'pending'" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
          </div>

          <div v-else-if="!materiels?.length && !showMatForm" class="text-center py-12">
            <UIcon name="i-lucide-monitor" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucun materiel enregistre</p>
            <UButton label="Ajouter" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="showMatForm = true" />
          </div>

          <div v-else-if="materiels?.length" class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
            <div
              v-for="(m, idx) in materiels"
              :key="m.id"
              class="flex items-center gap-3 px-4 py-2.5 group"
              :class="[idx > 0 ? 'border-t border-stone-100' : '', m.etat === 'hs' || m.etat === 'vendu' ? 'opacity-40' : '']"
            >
              <button
                class="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
                :class="etatColor(m.etat)"
                title="Changer l'etat"
                @click="cycleEtat(m)"
              >
                {{ MATERIEL_ETATS[m.etat]?.label }}
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-800 truncate">{{ m.nom }}</p>
                <p class="text-[11px] text-stone-500 truncate">
                  <span v-if="m.reference">{{ m.reference }}</span>
                  <span v-if="getUserName(m)" class="text-stone-400">
                    {{ m.reference ? ' - ' : '' }}Affecte a {{ getUserName(m) }}
                  </span>
                  <span v-if="m.notes" class="text-stone-400">{{ m.reference || getUserName(m) ? ' - ' : '' }}{{ m.notes }}</span>
                </p>
              </div>
              <span v-if="m.prix_achat" class="text-xs text-stone-500 tabular-nums shrink-0">{{ formatMoney(m.prix_achat) }} &euro;</span>
              <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDeleteMat(m.id)">
                <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </template>

        <!-- ============ ACHATS PREVUS ============ -->
        <template v-if="tab === 'achats'">
          <!-- Add form -->
          <div v-if="showAchForm" class="rounded-xl bg-white/60 shadow-sm border border-white/70 p-4 mb-4">
            <form class="space-y-3" @submit.prevent="handleAddAch">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <UInput v-model="achForm.nom" placeholder="Quoi acheter..." size="sm" class="col-span-2 sm:col-span-1" />
                <UInput v-model.number="achForm.prix_estime" type="number" :min="0" step="0.01" placeholder="Prix estime" size="sm" />
                <USelect v-model="achForm.type" :items="achatTypeOptions" value-key="value" size="sm" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <UInput v-model="achForm.prochaine_date" type="date" size="sm" placeholder="Date prevue" />
                <UInput v-if="achForm.type === 'recurrent'" v-model.number="achForm.recurrence_mois" type="number" :min="1" placeholder="Tous les X mois" size="sm" />
                <UInput v-model="achForm.notes" placeholder="Notes..." size="sm" />
              </div>
              <div class="flex justify-end gap-2">
                <UButton label="Annuler" size="xs" variant="ghost" color="neutral" @click="showAchForm = false; resetAchForm()" />
                <UButton type="submit" label="Ajouter" size="xs" icon="i-lucide-plus" :loading="savingAch" />
              </div>
            </form>
          </div>

          <div v-if="achStatus === 'pending'" class="flex justify-center py-12">
            <UIcon name="i-lucide-loader-circle" class="size-8 text-primary animate-spin" />
          </div>

          <div v-else-if="!achats?.length && !showAchForm" class="text-center py-12">
            <UIcon name="i-lucide-shopping-cart" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">Aucun achat prevu</p>
            <UButton label="Ajouter" icon="i-lucide-plus" variant="subtle" class="mt-3" @click="showAchForm = true" />
          </div>

          <div v-else-if="achats?.length" class="rounded-xl bg-white/50 shadow-sm border border-white/70 overflow-hidden">
            <div
              v-for="(a, idx) in achats"
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
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-stone-800 truncate">{{ a.nom }}</p>
                <p class="text-[11px] text-stone-500 truncate">
                  <span v-if="a.type === 'recurrent' && a.recurrence_mois">Tous les {{ a.recurrence_mois }} mois</span>
                  <span v-if="a.prochaine_date" class="text-stone-400">
                    {{ a.type === 'recurrent' && a.recurrence_mois ? ' - ' : '' }}Prevu {{ new Date(a.prochaine_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}
                  </span>
                  <span v-if="a.notes" class="text-stone-400"> - {{ a.notes }}</span>
                </p>
              </div>
              <span v-if="a.prix_estime" class="text-xs text-stone-500 tabular-nums shrink-0">~{{ formatMoney(a.prix_estime) }} &euro;</span>
              <button class="shrink-0 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" @click="handleDeleteAch(a.id)">
                <UIcon name="i-lucide-x" class="size-3.5 text-stone-400" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
