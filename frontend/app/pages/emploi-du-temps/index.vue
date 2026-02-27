<script setup lang="ts">
import type { ScheduleEntry, ScheduleCategorie } from '~/utils/types'
import { getMonday, addDays, formatDate, getWeekNumber } from '~/utils/dates'
import { SCHEDULE_CATEGORIES, SCHEDULE_COLORS } from '~/utils/constants'

const { user } = useAuth()
const { getEntries, createEntry, updateEntry, deleteEntry } = useSchedule()
const toast = useToast()

const entries = ref<ScheduleEntry[]>([])
const loading = ref(false)
const currentMonday = ref(getMonday(new Date()))
const weekNumber = ref(getWeekNumber(new Date()))

const weekViewRef = ref<{
  weekNumber: number
  weekLabel: string
  previousWeek: () => void
  nextWeek: () => void
  goToToday: () => void
} | null>(null)

const weekLabel = computed(() => {
  const start = currentMonday.value
  const end = addDays(start, 4)
  const s = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${s} - ${e}`
})

// --- Load entries ---
async function loadEntries(mondayStr: string) {
  if (!user.value) return
  loading.value = true
  currentMonday.value = new Date(mondayStr + 'T00:00:00')
  weekNumber.value = getWeekNumber(currentMonday.value)
  try {
    const friday = formatDate(addDays(new Date(mondayStr + 'T00:00:00'), 4))
    entries.value = await getEntries(user.value.id, mondayStr, friday)
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- Entry modal ---
const showModal = ref(false)
const editingEntry = ref<ScheduleEntry | null>(null)

const form = ref({
  titre: '',
  date: '',
  heure_debut: '',
  heure_fin: '',
  categorie: 'reunion_client' as ScheduleCategorie,
  description: ''
})

function openCreateModal(date: string, heure: string) {
  editingEntry.value = null
  const [h, m] = heure.split(':').map(Number)
  const endH = h + 1
  form.value = {
    titre: '',
    date,
    heure_debut: heure,
    heure_fin: `${String(Math.min(endH, 20)).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    categorie: 'reunion_client',
    description: ''
  }
  showModal.value = true
}

function openEditModal(entry: ScheduleEntry) {
  editingEntry.value = entry
  form.value = {
    titre: entry.titre,
    date: entry.date,
    heure_debut: entry.heure_debut.substring(0, 5),
    heure_fin: entry.heure_fin.substring(0, 5),
    categorie: entry.categorie,
    description: entry.description || ''
  }
  showModal.value = true
}

async function handleSubmit() {
  if (!user.value || !form.value.titre.trim()) return

  try {
    if (editingEntry.value) {
      const updated = await updateEntry(editingEntry.value.id, {
        titre: form.value.titre.trim(),
        date: form.value.date,
        heure_debut: form.value.heure_debut,
        heure_fin: form.value.heure_fin,
        categorie: form.value.categorie,
        description: form.value.description.trim() || null
      })
      const idx = entries.value.findIndex(e => e.id === editingEntry.value!.id)
      if (idx !== -1) entries.value[idx] = updated
    } else {
      const created = await createEntry({
        utilisateur: user.value.id,
        date: form.value.date,
        heure_debut: form.value.heure_debut,
        heure_fin: form.value.heure_fin,
        titre: form.value.titre.trim(),
        categorie: form.value.categorie,
        description: form.value.description.trim() || undefined
      })
      entries.value.push(created)
    }
    showModal.value = false
  } catch {
    toast.add({ title: 'Erreur lors de l\'enregistrement', color: 'error' })
  }
}

async function handleDelete() {
  if (!editingEntry.value) return
  try {
    await deleteEntry(editingEntry.value.id)
    entries.value = entries.value.filter(e => e.id !== editingEntry.value!.id)
    showModal.value = false
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

// --- Copy previous week ---
const copyLoading = ref(false)

async function handleCopyPreviousWeek() {
  if (!user.value) return
  copyLoading.value = true
  try {
    const mondayStr = formatDate(currentMonday.value)
    const prevMonday = addDays(currentMonday.value, -7)
    const prevFriday = addDays(prevMonday, 4)
    const prevEntries = await getEntries(user.value.id, formatDate(prevMonday), formatDate(prevFriday))

    if (!prevEntries.length) {
      toast.add({ title: 'Aucune entree la semaine precedente', color: 'warning' })
      return
    }

    let count = 0
    for (const prev of prevEntries) {
      const prevDate = new Date(prev.date + 'T12:00:00')
      const dayOfWeek = prevDate.getDay()
      const offset = dayOfWeek - 1
      const newDate = formatDate(addDays(currentMonday.value, offset))

      await createEntry({
        utilisateur: user.value.id,
        date: newDate,
        heure_debut: prev.heure_debut,
        heure_fin: prev.heure_fin,
        titre: prev.titre,
        categorie: prev.categorie,
        description: prev.description || undefined
      })
      count++
    }

    await loadEntries(mondayStr)
    if (count > 0) {
      toast.add({ title: `${count} entree(s) copiee(s)`, color: 'success' })
    }
  } catch {
    toast.add({ title: 'Erreur lors de la copie', color: 'error' })
  } finally {
    copyLoading.value = false
  }
}

// --- Category options ---
const categorieOptions = Object.entries(SCHEDULE_CATEGORIES).map(([key, val]) => ({
  label: val.label,
  value: key,
  icon: val.icon
}))

// --- Time options ---
function generateTimeOptions() {
  const options = []
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 0) break
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      options.push({ label: time, value: time })
    }
  }
  return options
}
const timeOptions = generateTimeOptions()

const teleportReady = ref(false)

onMounted(() => {
  teleportReady.value = !!document.getElementById('page-actions')
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page actions teleported into the layout tab bar -->
    <Teleport v-if="teleportReady" to="#page-actions">
      <div class="flex items-center gap-1.5">
        <UTooltip text="Copier la semaine precedente">
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="copyLoading"
            @click="handleCopyPreviousWeek"
          />
        </UTooltip>
      </div>
    </Teleport>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Navigation bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-0.5">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="weekViewRef?.previousWeek()"
            />
            <UButton
              label="Aujourd'hui"
              color="neutral"
              variant="soft"
              size="xs"
              @click="weekViewRef?.goToToday()"
            />
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="weekViewRef?.nextWeek()"
            />
          </div>
          <span class="text-sm font-medium text-stone-500 dark:text-stone-400">
            S{{ weekNumber }} <span class="text-stone-300 dark:text-stone-600 mx-0.5">&middot;</span> {{ weekLabel }}
          </span>
        </div>

        <!-- Category legend -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span
            v-for="(cat, key) in SCHEDULE_CATEGORIES"
            :key="key"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            :class="[SCHEDULE_COLORS[key as string]?.bg, SCHEDULE_COLORS[key as string]?.text]"
          >
            <UIcon :name="cat.icon" class="size-3" />
            {{ cat.label }}
          </span>
        </div>
      </div>

      <!-- Week view -->
      <ScheduleWeekView
        ref="weekViewRef"
        :entries="entries"
        @week-change="loadEntries"
        @add-entry="openCreateModal"
        @click-entry="openEditModal"
      />
    </div>

    <!-- Create / Edit entry modal -->
    <UModal :open="showModal" @update:open="showModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
            {{ editingEntry ? 'Modifier l\'entree' : 'Nouvelle entree' }}
          </h3>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <UFormField label="Titre" required>
              <UInput v-model="form.titre" placeholder="Ex: Reunion client X, Medecin..." />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Debut">
                <USelect v-model="form.heure_debut" :items="timeOptions" value-key="value" />
              </UFormField>
              <UFormField label="Fin">
                <USelect v-model="form.heure_fin" :items="timeOptions" value-key="value" />
              </UFormField>
            </div>

            <UFormField label="Categorie">
              <USelect v-model="form.categorie" :items="categorieOptions" value-key="value" />
            </UFormField>

            <UFormField label="Description">
              <UTextarea v-model="form.description" placeholder="Details (optionnel)..." :rows="2" />
            </UFormField>

            <div class="flex items-center justify-between">
              <UButton
                v-if="editingEntry"
                label="Supprimer"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                @click="handleDelete"
              />
              <span v-else />
              <div class="flex gap-2">
                <UButton label="Annuler" color="neutral" variant="ghost" @click="showModal = false" />
                <UButton type="submit" :label="editingEntry ? 'Enregistrer' : 'Ajouter'" :disabled="!form.titre.trim()" />
              </div>
            </div>
          </form>
        </div>
      </template>
    </UModal>
  </div>
</template>
