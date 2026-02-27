<script setup lang="ts">
import type { PlanningEntry, UserProfile } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { formatDate, getNextWorkingDay } from '~/utils/dates'

const { user } = useAuth()
const { getTeamEntries } = usePlanning()
const { getActiveUsers } = useUsers()
const { presenceMode } = useDashboardPreferences()

const loading = ref(true)

interface PersonPresence {
  id: string
  name: string
  matin: { type: string; key: string } | null
  apres_midi: { type: string; key: string } | null
}

const today = new Date()
const nextDay = getNextWorkingDay(today)

const todayStr = formatDate(today)
const nextDayStr = formatDate(nextDay)

const todayPresences = ref<PersonPresence[]>([])
const nextDayPresences = ref<PersonPresence[]>([])

function getDisplayKey(entry: PlanningEntry): string {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function buildPresences(users: UserProfile[], entries: PlanningEntry[], dateStr: string): PersonPresence[] {
  const result: PersonPresence[] = []

  for (const u of users) {
    if (u.id === user.value?.id) continue // On ne se montre pas soi-meme

    const userEntries = entries.filter(e => {
      const entryUserId = typeof e.utilisateur === 'string' ? e.utilisateur : e.utilisateur?.id
      return entryUserId === u.id && e.date === dateStr
    })

    const matin = userEntries.find(e => e.periode === 'matin')
    const apres_midi = userEntries.find(e => e.periode === 'apres_midi')

    // Si aucune entree, on ne l'affiche pas (non renseigne)
    if (!matin && !apres_midi) continue

    const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email

    result.push({
      id: u.id,
      name,
      matin: matin ? { type: matin.type, key: getDisplayKey(matin) } : null,
      apres_midi: apres_midi ? { type: apres_midi.type, key: getDisplayKey(apres_midi) } : null
    })
  }

  // Trier : presents en premier (travail/teletravail), puis le reste
  const presentTypes = ['travail', 'teletravail', 'ecole']
  result.sort((a, b) => {
    const aPresent = (a.matin && presentTypes.includes(a.matin.key)) || (a.apres_midi && presentTypes.includes(a.apres_midi.key))
    const bPresent = (b.matin && presentTypes.includes(b.matin.key)) || (b.apres_midi && presentTypes.includes(b.apres_midi.key))
    if (aPresent && !bPresent) return -1
    if (!aPresent && bPresent) return 1
    return a.name.localeCompare(b.name)
  })

  return result
}

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    const users = await getActiveUsers()
    const userIds = users.map(u => u.id)

    const endDate = presenceMode.value === 'todayNext' ? nextDayStr : todayStr
    const entries = await getTeamEntries(userIds, todayStr, endDate)

    todayPresences.value = buildPresences(users, entries, todayStr)
    if (presenceMode.value === 'todayNext') {
      nextDayPresences.value = buildPresences(users, entries, nextDayStr)
    }
  } finally {
    loading.value = false
  }
}

function getDotClass(slot: { type: string; key: string } | null): string {
  if (!slot) return 'bg-stone-300 dark:bg-stone-600'
  const c = PLANNING_COLORS[slot.key]
  return c?.dot || 'bg-stone-400'
}

function getStatusLabel(slot: { type: string; key: string } | null): string {
  if (!slot) return ''
  const t = PLANNING_TYPES[slot.key as keyof typeof PLANNING_TYPES]
  return t?.label || ''
}

function getNextDayLabel(): string {
  const dayName = nextDay.toLocaleDateString('fr-FR', { weekday: 'long' })
  return dayName.charAt(0).toUpperCase() + dayName.slice(1)
}

// Compteurs
function countPresent(presences: PersonPresence[]): number {
  const presentTypes = ['travail', 'teletravail']
  return presences.filter(p =>
    (p.matin && presentTypes.includes(p.matin.key)) ||
    (p.apres_midi && presentTypes.includes(p.apres_midi.key))
  ).length
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Qui est la</h3>
        <UButton
          label="Voir l'equipe"
          variant="link"
          size="xs"
          to="/equipe"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
    </div>

    <div v-else class="space-y-4">
      <!-- Aujourd'hui -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <p class="text-xs font-medium text-primary">Aujourd'hui</p>
          <span class="text-[11px] text-stone-400 dark:text-stone-500">
            {{ countPresent(todayPresences) }} present{{ countPresent(todayPresences) > 1 ? 's' : '' }}
          </span>
        </div>
        <div v-if="todayPresences.length === 0" class="text-xs text-stone-400 dark:text-stone-500 py-2">
          Aucun planning renseigne
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="p in todayPresences"
            :key="p.id"
            class="flex items-center gap-2 text-xs"
          >
            <div class="flex gap-1 shrink-0">
              <span class="size-2 rounded-full" :class="getDotClass(p.matin)" :title="'Matin : ' + getStatusLabel(p.matin)" />
              <span class="size-2 rounded-full" :class="getDotClass(p.apres_midi)" :title="'Apres-midi : ' + getStatusLabel(p.apres_midi)" />
            </div>
            <span class="text-stone-700 dark:text-stone-300 truncate">{{ p.name }}</span>
          </div>
        </div>
      </div>

      <!-- Prochain jour (si mode todayNext) -->
      <div v-if="presenceMode === 'todayNext'">
        <div class="flex items-center gap-2 mb-2">
          <p class="text-xs font-medium text-stone-500 dark:text-stone-400">{{ getNextDayLabel() }}</p>
          <span class="text-[11px] text-stone-400 dark:text-stone-500">
            {{ countPresent(nextDayPresences) }} present{{ countPresent(nextDayPresences) > 1 ? 's' : '' }}
          </span>
        </div>
        <div v-if="nextDayPresences.length === 0" class="text-xs text-stone-400 dark:text-stone-500 py-2">
          Aucun planning renseigne
        </div>
        <div v-else class="space-y-1.5">
          <div
            v-for="p in nextDayPresences"
            :key="p.id"
            class="flex items-center gap-2 text-xs"
          >
            <div class="flex gap-1 shrink-0">
              <span class="size-2 rounded-full" :class="getDotClass(p.matin)" :title="'Matin : ' + getStatusLabel(p.matin)" />
              <span class="size-2 rounded-full" :class="getDotClass(p.apres_midi)" :title="'Apres-midi : ' + getStatusLabel(p.apres_midi)" />
            </div>
            <span class="text-stone-700 dark:text-stone-300 truncate">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
