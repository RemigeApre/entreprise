<script setup lang="ts">
import { LIEU_STATUTS, lieuStatutMeta, lieuParentId, LIEU_ICONES, lieuIconeAffichee, lieuCouleurAffichee, VENDEUR_COULEURS } from '~/utils/comptoir'
import type { LieuStockage } from '~/utils/types'

const { lieux, lieuActuel, loadData } = useComptoir()
const { createLieu, updateLieu, removeLieu } = useMateriel()

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  nom: '', adresse: '', statut: 'vente' as 'stockage' | 'vente' | 'futur',
  parent: null as number | null, icone: 'i-lucide-store', couleur: '#AF8F3C'
})
const saving = ref(false)
const error = ref('')

const principaux = computed(() => lieux.value.filter(l => lieuParentId(l) === null))
function locauxDe(id: number) { return lieux.value.filter(l => lieuParentId(l) === id) }

// Palette : defaut du statut en tete, puis palette generique
const couleurOptions = computed(() => Array.from(new Set([lieuStatutMeta(form.statut).hex, ...VENDEUR_COULEURS])))

// Quand le statut change, on suit son defaut tant que l'utilisateur n'a pas personnalise.
watch(() => form.statut, (nv, ov) => {
  if (form.couleur === lieuStatutMeta(ov).hex) form.couleur = lieuStatutMeta(nv).hex
  if (form.icone === lieuStatutMeta(ov).icon) form.icone = lieuStatutMeta(nv).icon
})

const formTitle = computed(() => {
  if (editingId.value) return 'Modifier'
  if (form.parent != null) {
    const pn = lieux.value.find(x => x.id === form.parent)?.nom
    return pn ? `Nouveau local de « ${pn} »` : 'Nouveau local'
  }
  return 'Nouveau lieu'
})

function openCreate() {
  editingId.value = null
  Object.assign(form, { nom: '', adresse: '', statut: 'vente', parent: null, icone: lieuStatutMeta('vente').icon, couleur: lieuStatutMeta('vente').hex })
  error.value = ''
  formOpen.value = true
}
function openLocalCreate(parent: number) {
  editingId.value = null
  Object.assign(form, { nom: '', adresse: '', statut: 'stockage', parent, icone: lieuStatutMeta('stockage').icon, couleur: lieuStatutMeta('stockage').hex })
  error.value = ''
  formOpen.value = true
}
function openEdit(l: LieuStockage) {
  editingId.value = l.id
  Object.assign(form, {
    nom: l.nom, adresse: l.adresse || '',
    statut: (l.statut as 'stockage' | 'vente' | 'futur') || 'stockage',
    parent: lieuParentId(l), icone: lieuIconeAffichee(l), couleur: lieuCouleurAffichee(l)
  })
  error.value = ''
  formOpen.value = true
}

async function save() {
  if (!form.nom.trim()) { error.value = 'Le nom est requis'; return }
  saving.value = true
  error.value = ''
  try {
    const data = { nom: form.nom.trim(), adresse: form.adresse.trim() || null, statut: form.statut, parent: form.parent, icone: form.icone, couleur: form.couleur }
    if (editingId.value) await updateLieu(editingId.value, data)
    else await createLieu(data)
    await loadData()
    formOpen.value = false
  } catch {
    error.value = 'Enregistrement impossible'
  } finally {
    saving.value = false
  }
}

async function remove(l: LieuStockage) {
  const sous = locauxDe(l.id)
  if (sous.length) { alert(`« ${l.nom} » contient ${sous.length} local(aux). Supprime-les d'abord.`); return }
  if (!confirm(`Supprimer le lieu « ${l.nom} » ?`)) return
  try {
    await removeLieu(l.id)
    await loadData()
  } catch {
    alert('Impossible de supprimer ce lieu : il est utilise par des ventes ou du stock.')
  }
}
</script>

<template>
  <div>
    <div v-if="!formOpen" class="flex justify-center mb-5">
      <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#AF8F3C] text-white text-sm font-semibold active:scale-[0.97] transition-all" @click="openCreate">
        <UIcon name="i-lucide-plus" class="size-4" /> Nouveau lieu
      </button>
    </div>

    <!-- Formulaire -->
    <div v-if="formOpen" class="mb-5 p-5 rounded-2xl bg-stone-800/70 border border-stone-700 space-y-5">
      <!-- Apercu -->
      <div class="flex items-center gap-3">
        <div class="size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" :style="{ backgroundColor: form.couleur }">
          <UIcon :name="form.icone" class="size-7 text-white" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-stone-100 truncate">{{ form.nom || formTitle }}</p>
          <p class="text-xs text-stone-500">{{ lieuStatutMeta(form.statut).label }}</p>
        </div>
      </div>

      <div>
        <label class="text-xs text-stone-500 mb-1.5 block">Nom</label>
        <input v-model="form.nom" :placeholder="form.parent != null ? 'Ex: Reserve, Cave...' : 'Ex: Boutique, Marche de Noel...'" class="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C]" />
      </div>
      <div>
        <label class="text-xs text-stone-500 mb-1.5 block">Adresse <span class="text-stone-600">(optionnel)</span></label>
        <textarea v-model="form.adresse" rows="2" placeholder="Numero, rue, code postal, ville" class="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C] resize-y" />
      </div>

      <!-- Type -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Type</label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="s in LIEU_STATUTS" :key="s.value" type="button"
            class="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="form.statut === s.value ? s.cls + ' ring-1 ring-current/40' : 'bg-stone-900 text-stone-400 hover:bg-stone-700'"
            @click="form.statut = s.value"
          >
            <UIcon :name="s.icon" class="size-4" /> {{ s.label.replace('Lieu de ', '').replace('Futur lieu', 'Futur') }}
          </button>
        </div>
      </div>

      <!-- Couleur -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Couleur</label>
        <div class="flex flex-wrap gap-2.5">
          <button v-for="c in couleurOptions" :key="c" type="button"
            class="size-8 rounded-full transition-transform active:scale-90"
            :class="form.couleur === c ? 'ring-2 ring-offset-2 ring-offset-stone-800 ring-white' : ''"
            :style="{ backgroundColor: c }"
            @click="form.couleur = c"
          />
        </div>
      </div>

      <!-- Icone -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Icône</label>
        <div class="grid grid-cols-6 gap-2">
          <button v-for="ic in LIEU_ICONES" :key="ic" type="button"
            class="aspect-square rounded-lg flex items-center justify-center transition-colors"
            :class="form.icone === ic ? 'bg-[#AF8F3C]/20 text-[#AF8F3C] ring-1 ring-[#AF8F3C]/50' : 'bg-stone-900 text-stone-400 hover:bg-stone-700'"
            @click="form.icone = ic"
          >
            <UIcon :name="ic" class="size-5" />
          </button>
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      <div class="flex gap-2">
        <button class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#AF8F3C] text-white active:scale-[0.98] transition-all disabled:opacity-50" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
        <button class="px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-200" @click="formOpen = false">Annuler</button>
      </div>
    </div>

    <!-- Liste hierarchique -->
    <div v-if="!formOpen">
      <div v-if="!principaux.length" class="text-center py-10 text-stone-600 text-sm">Aucun lieu pour l'instant</div>
      <div v-else class="space-y-3 pb-4">
        <div v-for="p in principaux" :key="p.id">
          <!-- Lieu principal -->
          <div
            role="button" tabindex="0"
            class="flex items-stretch rounded-2xl overflow-hidden bg-stone-800/70 hover:bg-stone-800 cursor-pointer transition-colors"
            :class="lieuActuel === p.id ? 'ring-1 ring-[#AF8F3C]/60' : ''"
            @click="openEdit(p)" @keydown.enter="openEdit(p)"
          >
            <div class="flex items-center justify-center w-14 shrink-0" :style="{ backgroundColor: lieuCouleurAffichee(p) }">
              <UIcon :name="lieuIconeAffichee(p)" class="size-5 text-white" />
            </div>
            <div class="flex-1 min-w-0 px-4 py-3">
              <p class="text-sm font-semibold text-stone-100 truncate">{{ p.nom }}</p>
              <p v-if="p.adresse" class="flex items-start gap-1.5 text-xs text-stone-500 mt-1">
                <UIcon name="i-lucide-map-pin" class="size-3 mt-0.5 shrink-0 text-stone-600" />
                <span class="whitespace-pre-line">{{ p.adresse }}</span>
              </p>
            </div>
            <div class="flex items-center pl-2 pr-3">
              <button type="button" class="size-8 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors" title="Supprimer" @click.stop="remove(p)">
                <UIcon name="i-lucide-trash-2" class="size-3.5" />
              </button>
            </div>
          </div>

          <!-- Locaux rattaches -->
          <div v-if="locauxDe(p.id).length || editingId === p.id" class="ml-6 mt-1.5 pl-3 border-l border-stone-700/70 space-y-1.5">
            <div
              v-for="loc in locauxDe(p.id)" :key="loc.id"
              role="button" tabindex="0"
              class="flex items-center rounded-lg overflow-hidden bg-stone-800/40 hover:bg-stone-800 cursor-pointer transition-colors"
              :class="lieuActuel === loc.id ? 'ring-1 ring-[#AF8F3C]/60' : ''"
              @click.stop="openEdit(loc)" @keydown.enter="openEdit(loc)"
            >
              <div class="flex items-center justify-center w-9 self-stretch shrink-0" :style="{ backgroundColor: lieuCouleurAffichee(loc) }">
                <UIcon :name="lieuIconeAffichee(loc)" class="size-3.5 text-white" />
              </div>
              <div class="flex-1 min-w-0 px-3 py-1.5">
                <p class="text-[13px] text-stone-200 truncate">{{ loc.nom }}</p>
                <p v-if="loc.adresse" class="text-[10px] text-stone-500 truncate">{{ loc.adresse }}</p>
              </div>
              <button type="button" class="size-7 mr-2 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shrink-0 transition-colors" title="Supprimer" @click.stop="remove(loc)">
                <UIcon name="i-lucide-trash-2" class="size-3" />
              </button>
            </div>

            <button v-if="editingId === p.id" type="button" class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-500 hover:text-[#AF8F3C] transition-colors" @click="openLocalCreate(p.id)">
              <UIcon name="i-lucide-plus" class="size-3.5" /> Ajouter un local
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
