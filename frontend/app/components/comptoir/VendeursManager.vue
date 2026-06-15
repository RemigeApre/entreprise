<script setup lang="ts">
import type { Vendeur } from '~/utils/types'
import { VENDEUR_ROLES, vendeurRoleLabel, VENDEUR_ICONES, VENDEUR_COULEURS, vendeurIcone, vendeurCouleur } from '~/utils/comptoir'

const { vendeurs, loadData, createVendeur, updateVendeur, removeVendeur } = useComptoir()

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ nom: '', actif: true, role: 'employe' as string, icone: 'i-lucide-user', couleur: '#AF8F3C' })
const saving = ref(false)
const error = ref('')

function openCreate() {
  editingId.value = null
  Object.assign(form, { nom: '', actif: true, role: 'employe', icone: 'i-lucide-user', couleur: '#AF8F3C' })
  error.value = ''
  formOpen.value = true
}
function openEdit(v: Vendeur) {
  editingId.value = v.id
  Object.assign(form, {
    nom: v.nom, actif: v.actif !== false, role: v.role || 'employe',
    icone: vendeurIcone(v), couleur: vendeurCouleur(v)
  })
  error.value = ''
  formOpen.value = true
}

async function save() {
  if (!form.nom.trim()) { error.value = 'Le nom est requis'; return }
  saving.value = true
  error.value = ''
  try {
    const data = { nom: form.nom.trim(), role: form.role, icone: form.icone, couleur: form.couleur }
    if (editingId.value) await updateVendeur(editingId.value, { ...data, actif: form.actif })
    else await createVendeur(data)
    await loadData()
    formOpen.value = false
  } catch {
    error.value = 'Enregistrement impossible'
  } finally {
    saving.value = false
  }
}

async function remove(v: Vendeur) {
  if (!confirm(`Supprimer le profil « ${v.nom} » ?`)) return
  try {
    await removeVendeur(v.id)
    await loadData()
  } catch {
    alert('Impossible de supprimer ce profil : il est rattache a des ventes.')
  }
}
</script>

<template>
  <div>
    <div v-if="!formOpen" class="flex justify-center mb-5">
      <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#AF8F3C] text-white text-sm font-semibold active:scale-[0.97] transition-all" @click="openCreate">
        <UIcon name="i-lucide-user-plus" class="size-4" /> Nouveau profil
      </button>
    </div>

    <!-- Formulaire -->
    <div v-if="formOpen" class="mb-5 p-5 rounded-2xl bg-stone-800/70 border border-stone-700 space-y-5">
      <!-- Apercu avatar -->
      <div class="flex flex-col items-center gap-2">
        <div class="size-20 rounded-2xl flex items-center justify-center shadow-lg" :style="{ backgroundColor: form.couleur }">
          <UIcon :name="form.icone" class="size-9 text-white" />
        </div>
        <p class="text-sm font-medium text-stone-200">{{ form.nom || 'Nouveau profil' }}</p>
      </div>

      <div>
        <label class="text-xs text-stone-500 mb-1.5 block">Nom / pseudo</label>
        <input v-model="form.nom" placeholder="Prenom ou pseudo" class="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C]" />
      </div>

      <!-- Couleur -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Couleur</label>
        <div class="flex flex-wrap gap-2.5">
          <button v-for="c in VENDEUR_COULEURS" :key="c" type="button"
            class="size-8 rounded-full transition-transform active:scale-90"
            :class="form.couleur === c ? 'ring-2 ring-offset-2 ring-offset-stone-800 ring-white' : ''"
            :style="{ backgroundColor: c }"
            :aria-label="c"
            @click="form.couleur = c"
          />
        </div>
      </div>

      <!-- Icone -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Icône</label>
        <div class="grid grid-cols-8 gap-2">
          <button v-for="ic in VENDEUR_ICONES" :key="ic" type="button"
            class="aspect-square rounded-lg flex items-center justify-center transition-colors"
            :class="form.icone === ic ? 'bg-[#AF8F3C]/20 text-[#AF8F3C] ring-1 ring-[#AF8F3C]/50' : 'bg-stone-900 text-stone-400 hover:bg-stone-700'"
            @click="form.icone = ic"
          >
            <UIcon :name="ic" class="size-5" />
          </button>
        </div>
      </div>

      <!-- Role -->
      <div>
        <label class="text-xs text-stone-500 mb-2 block">Rôle</label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="r in VENDEUR_ROLES" :key="r.value" type="button"
            class="py-2 rounded-lg text-sm font-medium transition-colors"
            :class="form.role === r.value ? 'bg-[#AF8F3C]/15 text-[#AF8F3C] ring-1 ring-[#AF8F3C]/40' : 'bg-stone-900 text-stone-400 hover:bg-stone-700'"
            @click="form.role = r.value"
          >{{ r.label }}</button>
        </div>
        <p class="text-[11px] text-stone-600 mt-1.5">Seul un directeur peut gérer les lieux et les profils.</p>
      </div>

      <label v-if="editingId" class="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
        <input v-model="form.actif" type="checkbox" class="accent-[#AF8F3C]" /> Profil actif
      </label>

      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      <div class="flex gap-2">
        <button class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#AF8F3C] text-white active:scale-[0.98] transition-all disabled:opacity-50" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
        <button class="px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-200" @click="formOpen = false">Annuler</button>
      </div>
    </div>

    <!-- Liste -->
    <div v-if="!formOpen">
      <div v-if="!vendeurs.length" class="text-center py-10 text-stone-600 text-sm">Aucun profil pour l'instant</div>
      <div v-else class="space-y-2 pb-4">
        <div
          v-for="v in vendeurs" :key="v.id"
          role="button" tabindex="0"
          class="flex items-center gap-3 p-2.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 cursor-pointer transition-colors"
          @click="openEdit(v)" @keydown.enter="openEdit(v)"
        >
          <div class="size-11 rounded-xl flex items-center justify-center shrink-0" :style="{ backgroundColor: vendeurCouleur(v), opacity: v.actif === false ? 0.4 : 1 }">
            <UIcon :name="vendeurIcone(v)" class="size-5 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-medium text-stone-100 truncate">{{ v.nom }}</p>
              <span class="text-[10px] text-stone-500">{{ vendeurRoleLabel(v.role) }}</span>
              <span v-if="v.actif === false" class="text-[10px] text-stone-600">· inactif</span>
            </div>
          </div>
          <button type="button" class="size-8 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shrink-0 transition-colors" title="Supprimer" @click.stop="remove(v)">
            <UIcon name="i-lucide-trash-2" class="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
