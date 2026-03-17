<script setup lang="ts">
import type { PlanningEntry, UserProfile } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getWeekDays, formatDate, getEffectiveWorkDay, getFrenchPublicHolidays } from '~/utils/dates'

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
const weekDays = computed(() => getWeekDays(props.monday))

const filteredMembers = computed(() => {
  if (!search.value.trim()) return teamMembers.value
  const q = search.value.toLowerCase()
  return teamMembers.value.filter(u => getMemberName(u).toLowerCase().includes(q))
})

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

// Jours feries francais pour la semaine affichee
const publicHolidays = computed(() => {
  const map = new Map<string, string>()
  for (const day of weekDays.value) {
    const holidays = getFrenchPublicHolidays(day.getFullYear())
    const dateStr = formatDate(day)
    if (holidays.has(dateStr)) map.set(dateStr, holidays.get(dateStr)!)
  }
  return map
})

function isHighlightedDay(date: Date): boolean {
  return formatDate(date) === effectiveDay.value
}


async function load() {
  loading.value = true
  try {
    const allUsers = await getActiveUsers()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    teamMembers.value = allUsers.filter(u => {
      if (u.id === props.currentUserId) return false
      if (u.date_debut_contrat) {
        const debut = new Date(u.date_debut_contrat + 'T00:00:00')
        if (debut > today) return false
      }
      if (u.date_fin_contrat) {
        const fin = new Date(u.date_fin_contrat + 'T00:00:00')
        if (fin < today) return false
      }
      return u.statut_emploi === 'actif' || u.statut_emploi === 'test'
    })
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
  if (!entry) return 'bg-stone-200'
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
  { label: 'Non renseigne', dot: 'bg-stone-200' }
]

watch(() => props.monday, () => load())
onMounted(load)
</script>

<template>
  <UCard>
    <div v-if="loading" class="flex justify-center py-6">
      <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-amber-500" />
    </div>

    <div v-else-if="!teamMembers.length" class="text-center py-4">
      <p class="text-sm text-stone-500">Aucun membre actif dans l'equipe</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr>
            <!-- Title + search -->
            <th class="text-left pb-3 pr-4" style="min-width: 140px">
              <span class="text-sm font-semibold text-stone-900 whitespace-nowrap">Presence de l'equipe</span>
              <UInput
                v-if="teamMembers.length > 3"
                v-model="search"
                placeholder="Rechercher..."
                icon="i-lucide-search"
                size="xs"
                class="w-36 mt-1.5"
              />
            </th>
            <!-- Day columns -->
            <th
              v-for="day in weekDays"
              :key="formatDate(day)"
              class="text-center pb-1 px-1"
              :class="[
                isHighlightedDay(day)
                  ? 'bg-amber-50/60 rounded-t-md'
                  : ''
              ]"
              colspan="2"
            >
              <div
                class="text-[11px] font-semibold uppercase tracking-wide"
                :class="publicHolidays.has(formatDate(day)) ? 'text-stone-400' : isHighlightedDay(day) ? 'text-amber-600' : 'text-stone-400'"
              >
                {{ getDayName(day) }}
              </div>
              <div
                class="inline-flex items-center justify-center rounded-full text-[13px] font-bold leading-none mt-0.5"
                :class="isHighlightedDay(day)
                  ? 'size-6 bg-amber-500 text-white'
                  : 'text-stone-700'"
              >
                {{ day.getDate() }}
              </div>
              <div v-if="publicHolidays.has(formatDate(day))" class="text-[9px] font-normal text-stone-400 leading-tight truncate max-w-[56px] mx-auto mt-0.5">
                {{ publicHolidays.get(formatDate(day)) }}
              </div>
            </th>
          </tr>
          <tr>
            <th class="pb-2" />
            <template v-for="day in weekDays" :key="'h-' + formatDate(day)">
              <th
                class="text-center pb-2 px-0.5 text-[10px] font-normal"
                :class="[
                  isHighlightedDay(day) ? 'bg-amber-50/60 text-amber-500/70' : 'text-stone-400',
                  publicHolidays.has(formatDate(day)) ? 'opacity-50' : ''
                ]"
              >M</th>
              <th
                class="text-center pb-2 px-0.5 text-[10px] font-normal"
                :class="[
                  isHighlightedDay(day) ? 'bg-amber-50/60 text-amber-500/70' : 'text-stone-400',
                  publicHolidays.has(formatDate(day)) ? 'opacity-50' : ''
                ]"
              >AP</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in filteredMembers"
            :key="member.id"
            class="border-t border-[rgba(175,143,60,0.06)] group hover:bg-stone-50/60 transition-colors"
          >
            <td class="py-2.5 pr-4 whitespace-nowrap">
              <NuxtLink
                v-if="isAdmin"
                :to="`/planning/${member.id}`"
                class="font-medium text-stone-700 hover:text-amber-600 transition-colors"
              >
                {{ getMemberName(member) }}
              </NuxtLink>
              <span v-else class="font-medium text-stone-700">
                {{ getMemberName(member) }}
              </span>
              <span v-if="getMemberPole(member)" class="block text-[10px] text-stone-400 leading-tight mt-0.5">
                {{ getMemberPole(member) }}
              </span>
            </td>
            <template v-for="day in weekDays" :key="member.id + '-' + formatDate(day)">
              <td
                class="py-2.5 px-1 text-center"
                :class="publicHolidays.has(formatDate(day)) ? 'opacity-30' : isHighlightedDay(day) ? 'bg-amber-50/60' : ''"
              >
                <UTooltip :text="publicHolidays.has(formatDate(day)) ? publicHolidays.get(formatDate(day)) : getDotTooltip(getEntry(member.id, day, 'matin'))">
                  <span
                    class="inline-block size-4 rounded-full ring-1 ring-white/50"
                    :class="publicHolidays.has(formatDate(day)) ? PLANNING_COLORS.ferie.dot : getDotClasses(getEntry(member.id, day, 'matin'))"
                  />
                </UTooltip>
              </td>
              <td
                class="py-2.5 px-1 text-center"
                :class="publicHolidays.has(formatDate(day)) ? 'opacity-30' : isHighlightedDay(day) ? 'bg-amber-50/60' : ''"
              >
                <UTooltip :text="publicHolidays.has(formatDate(day)) ? publicHolidays.get(formatDate(day)) : getDotTooltip(getEntry(member.id, day, 'apres_midi'))">
                  <span
                    class="inline-block size-4 rounded-full ring-1 ring-white/50"
                    :class="publicHolidays.has(formatDate(day)) ? PLANNING_COLORS.ferie.dot : getDotClasses(getEntry(member.id, day, 'apres_midi'))"
                  />
                </UTooltip>
              </td>
            </template>
          </tr>
        </tbody>
      </table>

      <p v-if="search && !filteredMembers.length" class="text-center py-3 text-sm text-stone-500">
        Aucun resultat
      </p>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-[rgba(175,143,60,0.06)]">
        <div
          v-for="item in legendItems"
          :key="item.label"
          class="flex items-center gap-1"
        >
          <span class="inline-block size-2.5 rounded-full" :class="item.dot" />
          <span class="text-[10px] text-stone-400">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
