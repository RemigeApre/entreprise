<script setup lang="ts">
import type { Vendeur } from '~/utils/types'

const { vendeurs, loadData, createVendeur, updateVendeur, removeVendeur } = useComptoir()

const formOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ nom: '', actif: true })
const saving = ref(false)
const error = ref('')

function openCreate() {
  editingId.value = null
  form.nom = ''
  form.actif = true
  error.value = ''
  formOpen.value = true
}
function openEdit(v: Vendeur) {
  editingId.value = v.id
  form.nom = v.nom
  form.actif = v.actif !== false
  error.value = ''
  formOpen.value = true
}

async function save() {
  if (!form.nom.trim()) { error.value = 'Le nom est requis'; return }
  saving.value = true
  error.value = ''
  try {
    if (editingId.value) await updateVendeur(editingId.value, { nom: form.nom.trim(), actif: form.actif })
    else await createVendeur(form.nom.trim())
    await loadData()
    formOpen.value = false
  } catch {
    error.value = 'Enregistrement impossible'
  } finally {
    saving.value = false
  }
}

async function remove(v: Vendeur) {
  if (!confirm(`Supprimer le vendeur « ${v.nom} » ?`)) return
  try {
    await removeVendeur(v.id)
    await loadData()
  } catch {
    alert('Impossible de supprimer ce vendeur : il est rattache a des ventes.')
  }
}
</script>

<template>
  <div>
    <div class="flex justify-center mb-5">
      <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#AF8F3C] text-white text-sm font-semibold active:scale-[0.97] transition-all" @click="openCreate">
        <UIcon name="i-lucide-user-plus" class="size-4" /> Nouveau vendeur
      </button>
    </div>

    <div v-if="formOpen" class="mb-5 p-4 rounded-2xl bg-stone-800/70 border border-stone-700 space-y-3">
      <p class="text-sm font-semibold text-stone-200">{{ editingId ? 'Modifier' : 'Nouveau vendeur' }}</p>
      <div>
        <label class="text-xs text-stone-500 mb-1.5 block">Nom</label>
        <input v-model="form.nom" placeholder="Prenom ou pseudo" class="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C]" />
      </div>
      <label v-if="editingId" class="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
        <input v-model="form.actif" type="checkbox" class="accent-[#AF8F3C]" /> Actif
      </label>
      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      <div class="flex gap-2 pt-1">
        <button class="flex-1 py-2.5 rounded-xl text-sm font-bold bg-[#AF8F3C] text-white active:scale-[0.98] transition-all disabled:opacity-50" :disabled="saving" @click="save">
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
        <button class="px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:text-stone-200" @click="formOpen = false">Annuler</button>
      </div>
    </div>

    <div v-if="!vendeurs.length" class="text-center py-10 text-stone-600 text-sm">Aucun vendeur pour l'instant</div>
    <div v-else class="space-y-2 pb-4">
      <div
        v-for="v in vendeurs" :key="v.id"
        role="button" tabindex="0"
        class="flex items-center rounded-xl overflow-hidden bg-stone-800/60 hover:bg-stone-800 cursor-pointer transition-colors"
        @click="openEdit(v)" @keydown.enter="openEdit(v)"
      >
        <div class="flex items-center justify-center w-12 self-stretch shrink-0" :class="v.actif !== false ? 'bg-[#AF8F3C]' : 'bg-stone-600'">
          <UIcon name="i-lucide-user" class="size-5 text-white" />
        </div>
        <div class="flex-1 min-w-0 px-4 py-3">
          <p class="text-sm font-medium text-stone-100 truncate">{{ v.nom }}</p>
          <p v-if="v.actif === false" class="text-[10px] text-stone-500">Inactif</p>
        </div>
        <button type="button" class="size-8 mr-3 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shrink-0 transition-colors" title="Supprimer" @click.stop="remove(v)">
          <UIcon name="i-lucide-trash-2" class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>
