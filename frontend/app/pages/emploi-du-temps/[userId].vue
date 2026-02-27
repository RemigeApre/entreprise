<script setup lang="ts">
import { readUser } from '@directus/sdk'
import type { ScheduleEntry, ScheduleCategorie, UserProfile } from '~/utils/types'
import { getMonday, addDays, formatDate, getWeekNumber } from '~/utils/dates'
import { SCHEDULE_CATEGORIES, SCHEDULE_COLORS } from '~/utils/constants'

const route = useRoute()
const { $directus } = useNuxtApp()
const { user, isDirecteur } = useAuth()
const { getEntries, createEntry, updateEntry, deleteEntry } = useSchedule()
const toast = useToast()

const userId = route.params.userId as string

const targetUser = ref<UserProfile | null>(null)
const entries = ref<ScheduleEntry[]>([])
const loading = ref(true)
const currentMonday = ref(getMonday(new Date()))
const weekNumber = ref(getWeekNumber(new Date()))

const weekViewRef = ref<{
  weekNumber: number
  weekLabel: string
  previousWeek: () => void
  nextWeek: () => void
  goToToday: () => void
} | null>(null)

const userName = computed(() => {
  if (!targetUser.value) return ''
  const { first_name, last_name } = targetUser.value
  return [first_name, last_name].filter(Boolean).join(' ') || targetUser.value.email
})

const weekLabel = computed(() => {
  const start = currentMonday.value
  const end = addDays(start, 4)
  const s = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const e = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${s} - ${e}`
})

// --- Load user ---
async function loadUser() {
  try {
    const data = await $directus.request(readUser(userId, {
      fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role.name']
    }))
    targetUser.value = data as unknown as UserProfile
  } catch {
    await navigateTo('/emploi-du-temps')
  }
}

// --- Load entries ---
async function loadEntries(mondayStr: string) {
  loading.value = true
  currentMonday.value = new Date(mondayStr + 'T00:00:00')
  weekNumber.value = getWeekNumber(currentMonday.value)
  try {
    const friday = formatDate(addDays(new Date(mondayStr + 'T00:00:00'), 4))
    entries.value = await getEntries(userId, mondayStr, friday)
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    loading.value = false
  }
}

// --- Entry modal (admin only) ---
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
  if (!isDirecteur.value) return
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
  if (!isDirecteur.value) return
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
  if (!form.value.titre.trim()) return
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
        utilisateur: userId,
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

const categorieOptions = Object.entries(SCHEDULE_CATEGORIES).map(([key, val]) => ({
  label: val.label,
  value: key,
  icon: val.icon
}))

const teleportReady = ref(false)

onMounted(async () => {
  teleportReady.value = !!document.getElementById('page-actions')
  await loadUser()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Page actions teleported into the layout tab bar -->
    <Teleport v-if="teleportReady" to="#page-actions">
      <div class="flex items-center gap-1.5">
        <UButton
          label="Retour"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="xs"
          to="/emploi-du-temps"
        />
      </div>
    </Teleport>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- User name -->
      <div class="flex items-center gap-2">
        <UAvatar :alt="userName" size="xs" />
        <span class="text-sm font-semibold text-stone-700 dark:text-stone-300">{{ userName }}</span>
        <span v-if="!isDirecteur" class="text-xs text-stone-400 dark:text-stone-500">(lecture seule)</span>
      </div>

      <!-- Navigation bar -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-0.5">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" size="xs" @click="weekViewRef?.previousWeek()" />
            <UButton label="Aujourd'hui" color="neutral" variant="soft" size="xs" @click="weekViewRef?.goToToday()" />
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" size="xs" @click="weekViewRef?.nextWeek()" />
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
        :readonly="!isDirecteur"
        @week-change="loadEntries"
        @add-entry="openCreateModal"
        @click-entry="openEditModal"
      />
    </div>

    <!-- Create / Edit entry modal (admin only) -->
    <UModal v-if="isDirecteur" :open="showModal" @update:open="showModal = $event">
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
