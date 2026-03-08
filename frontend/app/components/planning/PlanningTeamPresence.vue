<script setup lang="ts">
import type { PlanningEntry, UserProfile } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getWeekDays, formatDate, getEffectiveWorkDay } from '~/utils/dates'

const props = defineProps<{
  monday: Date
  currentUserId?: string
  isAdmin?: boolean
}>()

const { getActiveUsers } = useUsers()
const { getTeamEntries } = usePlanning()

const loading = ref(true)
const teamMembers = ref<UserProfile[]>([])
const entries = ref<PlanningEntry[]>([])
const search = ref('')
const showFilters = ref(false)

// --- Filters ---
const filterPole = ref<string>('')
const filterContrat = ref<string>('')
const filterPresence = ref<string>('')

const weekDays = computed(() => getWeekDays(props.monday))

// Effective day for highlighting the column
const ferieDates = computed(() => {
  const dates = new Set<string>()
  const grouped = new Map<string, number>()
  for (const e of entries.value) {
    if (e.type === 'ferie') {
      grouped.set(e.date, (grouped.get(e.date) || 0) + 1)
    }
  }
  for (const [date, count] of grouped) {
    if (count >= 2) dates.add(date)
  }
  return dates
})

const effectiveDay = computed(() => formatDate(getEffectiveWorkDay(new Date(), ferieDates.value)))

function isHighlightedDay(date: Date): boolean {
  return formatDate(date) === effectiveDay.value
}

// --- Filter options (computed from loaded data) ---
const poleOptions = computed(() => {
  const poles = new Map<string, string>()
  for (const u of teamMembers.value) {
    if (u.categorie && typeof u.categorie === 'object') {
      poles.set(u.categorie.id, u.categorie.nom)
    }
  }
  return [{ label: 'Tous les poles', value: '' }, ...Array.from(poles, ([value, label]) => ({ label, value }))]
})

const contratOptions = computed(() => {
  const types = new Set<string>()
  for (const u of teamMembers.value) {
    if (u.type_contrat) types.add(u.type_contrat)
  }
  return [{ label: 'Tous les contrats', value: '' }, ...Array.from(types).map(t => ({ label: t, value: t }))]
})

const presenceOptions = [
  { label: 'Toutes', value: '' },
  { label: 'Present (bureau)', value: 'travail' },
  { label: 'Teletravail', value: 'teletravail' },
  { label: 'Ecole', value: 'ecole' },
  { label: 'Conge', value: 'conge' },
  { label: 'Absent', value: 'absent' },
  { label: 'Ferie', value: 'ferie' },
  { label: 'Non renseigne', value: 'none' }
]

const hasActiveFilters = computed(() => !!filterPole.value || !!filterContrat.value || !!filterPresence.value)

function clearFilters() {
  filterPole.value = ''
  filterContrat.value = ''
  filterPresence.value = ''
}

// --- Filtered members ---
const filteredMembers = computed(() => {
  let list = teamMembers.value

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(u => getMemberName(u).toLowerCase().includes(q))
  }

  // Pole filter
  if (filterPole.value) {
    list = list.filter(u => {
      const cat = u.categorie
      if (!cat) return false
      const catId = typeof cat === 'string' ? cat : cat.id
      return catId === filterPole.value
    })
  }

  // Contrat filter
  if (filterContrat.value) {
    list = list.filter(u => u.type_contrat === filterContrat.value)
  }

  // Presence filter: only show members who have at least one matching entry this week
  if (filterPresence.value) {
    list = list.filter(u => {
      if (filterPresence.value === 'none') {
        // Show members with at least one empty slot
        return weekDays.value.some(day =>
          !getEntry(u.id, day, 'matin') || !getEntry(u.id, day, 'apres_midi')
        )
      }
      return entries.value.some(e => {
        const uid = typeof e.utilisateur === 'string' ? e.utilisateur : e.utilisateur.id
        if (uid !== u.id) return false
        if (filterPresence.value === 'teletravail') {
          return e.type === 'travail' && e.motif === 'Teletravail'
        }
        if (filterPresence.value === 'travail') {
          return e.type === 'travail' && e.motif !== 'Teletravail'
        }
        return e.type === filterPresence.value
      })
    })
  }

  return list
})

async function load() {
  loading.value = true
  try {
    const users = await getActiveUsers()
    teamMembers.value = users.filter(u => u.id !== props.currentUserId)
    if (!teamMembers.value.length) return

    const userIds = teamMembers.value.map(u => u.id)
    const friday = weekDays.value[4]
    entries.value = await getTeamEntries(userIds, formatDate(props.monday), formatDate(friday))
  } finally {
    loading.value = false
  }
}

function getEntry(userId: string, date: Date, periode: 'matin' | 'apres_midi') {
  const dateStr = formatDate(date)
  return entries.value.find(e => {
    const uid = typeof e.utilisateur === 'string' ? e.utilisateur : e.utilisateur.id
    return uid === userId && e.date === dateStr && e.periode === periode
  })
}

function getMemberName(user: UserProfile) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
}

function getMemberPole(user: UserProfile): string | null {
  if (!user.categorie || typeof user.categorie === 'string') return null
  return user.categorie.nom
}

function getDisplayKey(entry: PlanningEntry | undefined) {
  if (!entry) return null
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'teletravail'
  return entry.type
}

function getDotClasses(entry: PlanningEntry | undefined) {
  if (!entry) return 'bg-stone-200 dark:bg-stone-700'
  const key = getDisplayKey(entry)
  return (key && PLANNING_COLORS[key]?.dot) || PLANNING_COLORS[entry.type]?.dot || 'bg-stone-400'
}

function getDotTooltip(entry: PlanningEntry | undefined) {
  if (!entry) return 'Non renseigne'
  const key = getDisplayKey(entry)
  if (key && PLANNING_TYPES[key as keyof typeof PLANNING_TYPES]) {
    return PLANNING_TYPES[key as keyof typeof PLANNING_TYPES].label
  }
  return PLANNING_TYPES[entry.type]?.label || entry.type
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

const legendItems = [
  { label: 'Travail', dot: PLANNING_COLORS.travail.dot },
  { label: 'Teletravail', dot: PLANNING_COLORS.teletravail.dot },
  { label: 'Ecole', dot: PLANNING_COLORS.ecole.dot },
  { label: 'Conge', dot: PLANNING_COLORS.conge.dot },
  { label: 'Absent', dot: PLANNING_COLORS.absent.dot },
  { label: 'Ferie', dot: PLANNING_COLORS.ferie.dot },
  { label: 'Non renseigne', dot: 'bg-stone-200 dark:bg-stone-700' }
]

watch(() => props.monday, () => load())
onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Presence de l'equipe</h3>
          <UBadge v-if="hasActiveFilters" size="xs" variant="subtle" color="primary">
            {{ filteredMembers.length }}/{{ teamMembers.length }}
          </UBadge>
        </div>
        <div class="flex items-center gap-2">
          <UInput
            v-if="teamMembers.length > 3"
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            size="xs"
            class="w-40"
          />
          <UButton
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            :variant="showFilters || hasActiveFilters ? 'soft' : 'ghost'"
            size="xs"
            @click="showFilters = !showFilters"
          />
        </div>
      </div>

      <!-- Filter bar -->
      <Transition
        enter-active-class="transition-all duration-150 ease-out"
        leave-active-class="transition-all duration-100 ease-in"
        enter-from-class="opacity-0 -translate-y-1"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="showFilters" class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[rgba(175,143,60,0.06)]">
          <USelectMenu
            v-if="poleOptions.length > 2"
            v-model="filterPole"
            :items="poleOptions"
            value-key="value"
            placeholder="Pole"
            size="xs"
            class="w-40"
          />
          <USelectMenu
            v-if="contratOptions.length > 2"
            v-model="filterContrat"
            :items="contratOptions"
            value-key="value"
            placeholder="Contrat"
            size="xs"
            class="w-36"
          />
          <USelectMenu
            v-model="filterPresence"
            :items="presenceOptions"
            value-key="value"
            placeholder="Presence"
            size="xs"
            class="w-40"
          />
          <UButton
            v-if="hasActiveFilters"
            label="Reinitialiser"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="clearFilters"
          />
        </div>
      </Transition>
    </template>

    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-amber-500" />
    </div>

    <div v-else-if="!teamMembers.length" class="text-center py-4">
      <p class="text-sm text-stone-500 dark:text-stone-400">Aucun autre collaborateur</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr>
            <th class="text-left pb-2 pr-3 font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
              Collaborateur
            </th>
            <th
              v-for="day in weekDays"
              :key="formatDate(day)"
              class="text-center pb-2 px-1 font-medium"
              :class="isHighlightedDay(day) ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500 dark:text-stone-400'"
              colspan="2"
            >
              {{ getDayName(day) }}
            </th>
          </tr>
          <tr>
            <th />
            <template v-for="day in weekDays" :key="'h-' + formatDate(day)">
              <th class="text-center pb-1 px-0.5 text-[10px] text-stone-400 dark:text-stone-500 font-normal">Mat.</th>
              <th class="text-center pb-1 px-0.5 text-[10px] text-stone-400 dark:text-stone-500 font-normal">A-M</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in filteredMembers"
            :key="member.id"
            class="border-t border-[rgba(175,143,60,0.06)]"
          >
            <td class="py-2 pr-3 whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <div>
                  <NuxtLink
                    v-if="isAdmin"
                    :to="`/planning/${member.id}`"
                    class="text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {{ getMemberName(member) }}
                  </NuxtLink>
                  <span v-else class="text-stone-700 dark:text-stone-300">
                    {{ getMemberName(member) }}
                  </span>
                  <span v-if="getMemberPole(member)" class="block text-[10px] text-stone-400 dark:text-stone-500 leading-tight">
                    {{ getMemberPole(member) }}
                  </span>
                </div>
              </div>
            </td>
            <template v-for="day in weekDays" :key="member.id + '-' + formatDate(day)">
              <td
                class="py-2 px-0.5 text-center"
                :class="isHighlightedDay(day) ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''"
              >
                <UTooltip :text="getDotTooltip(getEntry(member.id, day, 'matin'))">
                  <span
                    class="inline-block size-3.5 rounded-full"
                    :class="getDotClasses(getEntry(member.id, day, 'matin'))"
                  />
                </UTooltip>
              </td>
              <td
                class="py-2 px-0.5 text-center"
                :class="isHighlightedDay(day) ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''"
              >
                <UTooltip :text="getDotTooltip(getEntry(member.id, day, 'apres_midi'))">
                  <span
                    class="inline-block size-3.5 rounded-full"
                    :class="getDotClasses(getEntry(member.id, day, 'apres_midi'))"
                  />
                </UTooltip>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <p
        v-if="(search || hasActiveFilters) && !filteredMembers.length"
        class="text-center py-3 text-sm text-stone-500 dark:text-stone-400"
      >
        Aucun resultat
      </p>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[rgba(175,143,60,0.06)]">
        <div
          v-for="item in legendItems"
          :key="item.label"
          class="flex items-center gap-1.5"
        >
          <span class="inline-block size-3 rounded-full" :class="item.dot" />
          <span class="text-[11px] text-stone-500 dark:text-stone-400">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
