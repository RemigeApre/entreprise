<script setup lang="ts">
import type { PlanningEntry, UserProfile } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_COLORS } from '~/utils/constants'
import { getWeekDays, formatDate } from '~/utils/dates'

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
  return teamMembers.value.filter(u => {
    const name = getMemberName(u).toLowerCase()
    return name.includes(q)
  })
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
        <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Presence de l'equipe</h3>
        <UInput
          v-if="teamMembers.length > 3"
          v-model="search"
          placeholder="Rechercher..."
          icon="i-lucide-search"
          size="xs"
          class="w-48"
        />
      </div>
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
              class="text-center pb-2 px-1 font-medium text-stone-500 dark:text-stone-400"
              colspan="2"
            >
              {{ getDayName(day) }}
            </th>
          </tr>
          <tr>
            <th />
            <template v-for="day in weekDays" :key="'h-' + formatDate(day)">
              <th class="text-center pb-1 px-0.5 text-[10px] text-stone-400 dark:text-stone-500 font-normal">AM</th>
              <th class="text-center pb-1 px-0.5 text-[10px] text-stone-400 dark:text-stone-500 font-normal">PM</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="member in filteredMembers"
            :key="member.id"
            class="border-t border-stone-100 dark:border-stone-800"
          >
            <td class="py-2 pr-3 whitespace-nowrap">
              <NuxtLink
                v-if="isAdmin"
                :to="`/planning/admin?user=${member.id}`"
                class="text-stone-700 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              >
                {{ getMemberName(member) }}
              </NuxtLink>
              <span v-else class="text-stone-700 dark:text-stone-300">
                {{ getMemberName(member) }}
              </span>
            </td>
            <template v-for="day in weekDays" :key="member.id + '-' + formatDate(day)">
              <td class="py-2 px-0.5 text-center">
                <UTooltip :text="getDotTooltip(getEntry(member.id, day, 'matin'))">
                  <span
                    class="inline-block size-3.5 rounded-full"
                    :class="getDotClasses(getEntry(member.id, day, 'matin'))"
                  />
                </UTooltip>
              </td>
              <td class="py-2 px-0.5 text-center">
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
        v-if="search && !filteredMembers.length"
        class="text-center py-3 text-sm text-stone-500 dark:text-stone-400"
      >
        Aucun resultat pour "{{ search }}"
      </p>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800">
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
