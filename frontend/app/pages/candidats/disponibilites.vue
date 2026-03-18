<script setup lang="ts">
import type { RecruteurDisponibilite, CanalRdv } from '~/utils/types'

definePageMeta({ middleware: ['directeur'] })

const { getAll, create, toggle, remove } = useDisponibilites()
const toast = useToast()

const items = ref<RecruteurDisponibilite[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try { items.value = await getAll() }
  catch { /* silent */ }
  finally { loading.value = false }
}

onMounted(load)

const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const CANAUX_OPTIONS: { value: CanalRdv; label: string }[] = [
  { value: 'visio', label: 'Discord (visio)' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'physique', label: 'En personne' }
]

const showForm = ref(false)
const saving = ref(false)
const form = reactive({
  jour_semaine: 1,
  heure_debut: '09:00',
  heure_fin: '12:00',
  canaux: ['visio', 'telephone'] as CanalRdv[],
  note: '',
  actif: true
})

function toggleCanal(canal: CanalRdv) {
  const idx = form.canaux.indexOf(canal)
  if (idx >= 0) form.canaux.splice(idx, 1)
  else form.canaux.push(canal)
}

async function handleCreate() {
  if (!form.heure_debut || !form.heure_fin || !form.canaux.length) return
  saving.value = true
  try {
    const created = await create({
      jour_semaine: form.jour_semaine,
      heure_debut: form.heure_debut,
      heure_fin: form.heure_fin,
      canaux: [...form.canaux],
      note: form.note.trim() || null,
      actif: true
    })
    items.value.push(created)
    items.value.sort((a, b) => a.jour_semaine - b.jour_semaine || a.heure_debut.localeCompare(b.heure_debut))
    showForm.value = false
    toast.add({ title: 'Plage ajoutée', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function handleToggle(item: RecruteurDisponibilite) {
  try {
    await toggle(item.id, !item.actif)
    item.actif = !item.actif
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

async function handleDelete(item: RecruteurDisponibilite) {
  try {
    await remove(item.id)
    items.value = items.value.filter(i => i.id !== item.id)
    toast.add({ title: 'Plage supprimée', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

const CANAL_COLORS: Record<string, string> = {
  visio: 'bg-sky-100 text-sky-700',
  telephone: 'bg-violet-100 text-violet-700',
  physique: 'bg-emerald-100 text-emerald-700'
}

const CANAL_LABELS: Record<string, string> = {
  visio: 'Discord',
  telephone: 'Tél.',
  physique: 'Physique'
}

// Preview: count how many 30-min slots a dispo generates
function countSlots(item: RecruteurDisponibilite): number {
  const [sh, sm] = item.heure_debut.split(':').map(Number)
  const [eh, em] = item.heure_fin.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  return Math.max(0, Math.floor((endMin - startMin - 60) / 30) + 1)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Disponibilités RDV">
      <template #right>
        <UButton label="Ajouter une plage" icon="i-lucide-plus" size="sm" @click="showForm = !showForm" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-4">

        <p class="text-xs text-stone-500">
          Configurez vos plages de disponibilité hebdomadaires. Les candidats verront ces créneaux sur leur page de prise de RDV.
          Les entretiens durent <strong>1 heure</strong>, les créneaux sont proposés toutes les <strong>30 minutes</strong>.
        </p>

        <!-- Inline form -->
        <div v-if="showForm" class="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-4">
          <h3 class="text-sm font-semibold text-stone-800">Nouvelle plage de disponibilité</h3>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <UFormField label="Jour">
              <select
                v-model.number="form.jour_semaine"
                class="w-full h-8 px-2 text-sm rounded-md border border-stone-200 bg-white focus:outline-none focus:border-amber-400"
              >
                <option v-for="j in [1,2,3,4,5]" :key="j" :value="j">{{ JOURS[j] }}</option>
              </select>
            </UFormField>
            <UFormField label="Début">
              <input v-model="form.heure_debut" type="time" class="w-full h-8 px-2 text-sm rounded-md border border-stone-200 bg-white focus:outline-none focus:border-amber-400" />
            </UFormField>
            <UFormField label="Fin">
              <input v-model="form.heure_fin" type="time" class="w-full h-8 px-2 text-sm rounded-md border border-stone-200 bg-white focus:outline-none focus:border-amber-400" />
            </UFormField>
            <UFormField label="Créneaux">
              <div class="h-8 flex items-center text-xs text-stone-500">
                {{ countSlots({ ...form, id: '' }) }} créneau{{ countSlots({ ...form, id: '' }) !== 1 ? 'x' : '' }}
              </div>
            </UFormField>
          </div>

          <UFormField label="Canaux autorisés">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="opt in CANAUX_OPTIONS"
                :key="opt.value"
                type="button"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                :class="form.canaux.includes(opt.value)
                  ? CANAL_COLORS[opt.value] + ' border-current/30'
                  : 'border-stone-200 text-stone-400 hover:border-stone-300'"
                @click="toggleCanal(opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </UFormField>

          <UFormField label="Note (optionnel)" hint="Ex: adresse pour les RDV physiques">
            <UInput v-model="form.note" placeholder="Adresse, instructions..." class="w-full" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="showForm = false" />
            <UButton
              label="Ajouter"
              icon="i-lucide-check"
              size="sm"
              :loading="saving"
              :disabled="!form.canaux.length || !form.heure_debut || !form.heure_fin"
              @click="handleCreate"
            />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="size-5 text-primary animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="!items.length" class="text-center py-10">
          <UIcon name="i-lucide-calendar-off" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-sm text-stone-500">Aucune disponibilité configurée</p>
          <p class="text-xs text-stone-400 mt-1">Ajoutez des plages pour que les candidats puissent réserver un créneau.</p>
        </div>

        <!-- List grouped by day -->
        <div v-else class="space-y-1">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-colors"
            :class="item.actif ? 'border-stone-200' : 'border-stone-100 opacity-50'"
          >
            <!-- Day -->
            <span class="text-xs font-semibold text-stone-500 w-16 shrink-0">{{ JOURS[item.jour_semaine] }}</span>

            <!-- Time range -->
            <span class="text-sm font-mono text-stone-800 shrink-0">{{ item.heure_debut }} – {{ item.heure_fin }}</span>

            <!-- Canaux -->
            <div class="flex gap-1 flex-wrap flex-1">
              <span
                v-for="canal in item.canaux"
                :key="canal"
                class="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                :class="CANAL_COLORS[canal] || 'bg-stone-100 text-stone-500'"
              >
                {{ CANAL_LABELS[canal] || canal }}
              </span>
            </div>

            <!-- Note preview -->
            <span v-if="item.note" class="text-xs text-stone-400 truncate max-w-[120px] hidden sm:block" :title="item.note">
              {{ item.note }}
            </span>

            <!-- Slots count -->
            <span class="text-xs text-stone-400 shrink-0">{{ countSlots(item) }} cr.</span>

            <!-- Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                class="size-7 flex items-center justify-center rounded-lg transition-colors"
                :class="item.actif ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:bg-stone-100'"
                :title="item.actif ? 'Désactiver' : 'Activer'"
                @click="handleToggle(item)"
              >
                <UIcon :name="item.actif ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'" class="size-4" />
              </button>
              <button
                class="size-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer"
                @click="handleDelete(item)"
              >
                <UIcon name="i-lucide-trash-2" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
