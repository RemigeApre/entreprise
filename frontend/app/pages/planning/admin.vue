<script setup lang="ts">
import type { PlanningEntry, PlanningPeriode, PlanningType, UserProfile } from '~/utils/types'
import { formatDate, getMonday, addDays } from '~/utils/dates'

definePageMeta({ middleware: 'directeur' })

const { user } = useAuth()
const { getEntries, createEntry, deleteEntry } = usePlanning()
const { getActiveUsers, getUserById } = useUsers()
const { createBatch } = useNotifications()
const toast = useToast()

// --- User selection ---
const users = ref<UserProfile[]>([])
const selectedUserId = ref<string>('')
const selectedUser = ref<UserProfile | null>(null)
const entries = ref<PlanningEntry[]>([])
const loading = ref(false)
const currentMonday = ref(getMonday(new Date()))

const userOptions = computed(() =>
  users.value.map(u => ({
    label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    value: u.id
  }))
)

const selectedUserName = computed(() => {
  if (!selectedUser.value) return ''
  const { first_name, last_name } = selectedUser.value
  return [first_name, last_name].filter(Boolean).join(' ') || selectedUser.value.email
})

// --- Quick action types ---
interface QuickAction {
  key: string
  label: string
  icon: string
  planningType: PlanningType
  motif: string | null
  requiresMotif: boolean
}

const quickActions: QuickAction[] = [
  { key: 'travail', label: 'Travail', icon: 'i-lucide-briefcase', planningType: 'travail', motif: null, requiresMotif: false },
  { key: 'conge_paye', label: 'Conge paye', icon: 'i-lucide-palm-tree', planningType: 'conge', motif: 'Conge paye', requiresMotif: false },
  { key: 'sans_solde', label: 'Sans solde', icon: 'i-lucide-wallet', planningType: 'conge', motif: 'Sans solde', requiresMotif: false },
  { key: 'arret_maladie', label: 'Arret maladie', icon: 'i-lucide-heart-pulse', planningType: 'absent', motif: 'Arret maladie', requiresMotif: false },
  { key: 'ecole', label: 'Ecole', icon: 'i-lucide-graduation-cap', planningType: 'ecole', motif: null, requiresMotif: false },
  { key: 'ferie', label: 'Ferie', icon: 'i-lucide-calendar-off', planningType: 'ferie', motif: null, requiresMotif: false },
  { key: 'autre', label: 'Autre', icon: 'i-lucide-help-circle', planningType: 'absent', motif: null, requiresMotif: true },
]

const activeAction = ref('travail')
const currentAction = computed(() => quickActions.find(a => a.key === activeAction.value)!)

// --- Motif modal for "Autre" ---
const showMotifModal = ref(false)
const motifInput = ref('')
const pendingSlot = ref<{ date: string, periode: PlanningPeriode } | null>(null)

// --- Load users on mount ---
onMounted(async () => {
  try {
    users.value = await getActiveUsers()
  } catch {
    toast.add({ title: 'Erreur lors du chargement des employes', color: 'error' })
  }
})

// --- Watch user selection ---
watch(selectedUserId, async (userId) => {
  if (!userId) {
    selectedUser.value = null
    entries.value = []
    return
  }
  try {
    selectedUser.value = await getUserById(userId)
  } catch {
    toast.add({ title: 'Erreur lors du chargement de l\'employe', color: 'error' })
  }
})

// --- Load entries for current week ---
async function loadEntries(mondayStr: string) {
  if (!selectedUserId.value) return
  loading.value = true
  currentMonday.value = new Date(mondayStr + 'T00:00:00')
  try {
    const friday = formatDate(addDays(new Date(mondayStr + 'T00:00:00'), 4))
    entries.value = await getEntries(selectedUserId.value, mondayStr, friday)
  } catch {
    toast.add({ title: 'Erreur lors du chargement du calendrier', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- Add entry (click empty slot) ---
async function handleAddEntry(date: string, periode: PlanningPeriode) {
  if (!selectedUserId.value) return
  const action = currentAction.value

  if (action.requiresMotif) {
    pendingSlot.value = { date, periode }
    motifInput.value = ''
    showMotifModal.value = true
    return
  }

  await doCreateEntry(date, periode, action.planningType, action.motif || undefined)
}

async function handleMotifSubmit() {
  if (!pendingSlot.value || !motifInput.value.trim()) return
  const action = currentAction.value
  await doCreateEntry(
    pendingSlot.value.date,
    pendingSlot.value.periode,
    action.planningType,
    motifInput.value.trim()
  )
  showMotifModal.value = false
  pendingSlot.value = null
}

async function doCreateEntry(date: string, periode: PlanningPeriode, type: PlanningType, motif?: string) {
  if (!selectedUserId.value) return
  try {
    const entry = await createEntry({
      utilisateur: selectedUserId.value,
      date,
      periode,
      type,
      statut: 'valide',
      motif
    })
    entries.value.push(entry)
    toast.add({ title: 'Entree ajoutee', color: 'success' })
    await createBatch(
      [selectedUserId.value],
      `Votre manager a modifie votre calendrier (${date})`,
      'planning_modifie',
      '/planning'
    )
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout', color: 'error' })
  }
}

// --- Click existing entry: same type = remove, different type = replace ---
async function handleClickEntry(entry: PlanningEntry) {
  if (!selectedUserId.value) return
  const action = currentAction.value
  const isSameType = entry.type === action.planningType && (entry.motif || null) === (action.motif || null)

  try {
    await deleteEntry(entry.id)
    entries.value = entries.value.filter(e => e.id !== entry.id)

    if (isSameType) {
      toast.add({ title: 'Entree supprimee', color: 'success' })
      await createBatch(
        [selectedUserId.value],
        `Votre manager a supprime une entree de votre calendrier (${entry.date})`,
        'planning_modifie',
        '/planning'
      )
    } else {
      if (action.requiresMotif) {
        pendingSlot.value = { date: entry.date, periode: entry.periode }
        motifInput.value = ''
        showMotifModal.value = true
      } else {
        await doCreateEntry(entry.date, entry.periode, action.planningType, action.motif || undefined)
      }
    }
  } catch {
    toast.add({ title: 'Erreur lors de la modification', color: 'error' })
  }
}

// --- Copy previous week ---
const copyLoading = ref(false)

async function handleCopyPreviousWeek() {
  if (!selectedUserId.value) return
  copyLoading.value = true
  try {
    const mondayStr = formatDate(currentMonday.value)
    const prevMonday = addDays(currentMonday.value, -7)
    const prevFriday = addDays(prevMonday, 4)
    const prevEntries = await getEntries(selectedUserId.value, formatDate(prevMonday), formatDate(prevFriday))

    if (!prevEntries.length) {
      toast.add({ title: 'Aucune entree la semaine precedente', color: 'warning' })
      return
    }

    // Delete all current week entries first
    for (const existing of entries.value) {
      await deleteEntry(existing.id)
    }

    let count = 0
    for (const prev of prevEntries) {
      const prevDate = new Date(prev.date + 'T12:00:00')
      const dayOfWeek = prevDate.getDay()
      const offset = dayOfWeek - 1
      const newDate = formatDate(addDays(currentMonday.value, offset))

      await createEntry({
        utilisateur: selectedUserId.value,
        date: newDate,
        periode: prev.periode,
        type: prev.type,
        statut: 'valide',
        motif: prev.motif || undefined,
        heures: prev.heures || undefined
      })
      count++
    }

    await loadEntries(mondayStr)
    toast.add({ title: `${count} entree(s) copiee(s)`, color: 'success' })
    await createBatch(
      [selectedUserId.value],
      `Votre manager a modifie ${count} demi-journee(s) de votre calendrier`,
      'planning_modifie',
      '/planning'
    )
  } catch {
    toast.add({ title: 'Erreur lors de la copie', color: 'error' })
  } finally {
    copyLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Gestion des calendriers">
      <template #right>
        <UButton label="Retour" icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/planning" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <!-- Employee selector -->
      <UCard>
        <template #header>
          <h3 class="text-sm font-semibold">Selectionner un employe</h3>
        </template>
        <USelectMenu
          v-model="selectedUserId"
          :items="userOptions"
          value-key="value"
          placeholder="Choisir un employe..."
          class="max-w-md"
        />
      </UCard>

      <template v-if="selectedUserId">
        <!-- Quick action buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            v-for="action in quickActions"
            :key="action.key"
            :label="action.label"
            :icon="action.icon"
            :variant="activeAction === action.key ? 'solid' : 'outline'"
            :color="activeAction === action.key ? 'primary' : 'neutral'"
            size="sm"
            @click="activeAction = action.key"
          />
          <div class="ml-auto">
            <UButton
              label="Copier semaine precedente"
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="copyLoading"
              @click="handleCopyPreviousWeek"
            />
          </div>
        </div>

        <!-- Planning view -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold">Calendrier de {{ selectedUserName }}</h3>
          </template>
          <PlanningWeekView
            :entries="entries"
            :contract-start="selectedUser?.date_debut_contrat"
            :contract-end="selectedUser?.date_fin_contrat"
            @add-entry="handleAddEntry"
            @click-entry="handleClickEntry"
            @week-change="loadEntries"
          />
        </UCard>
      </template>
    </div>

    <!-- Motif modal for "Autre" -->
    <UModal :open="showMotifModal" @update:open="showMotifModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-4">Justification requise</h3>
          <form @submit.prevent="handleMotifSubmit" class="space-y-4">
            <UFormField label="Motif">
              <UTextarea v-model="motifInput" placeholder="Indiquez le motif..." required />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="showMotifModal = false" />
              <UButton type="submit" label="Ajouter" icon="i-lucide-check" :disabled="!motifInput.trim()" />
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
