<script setup lang="ts">
import type { Evenement } from '~/utils/types'
import { getCurrentOrNextMonday, addDays, formatDate } from '~/utils/dates'

const { user, isDirecteur } = useAuth()
const { getMyEvents } = useEvenements()

const loading = ref(true)
const events = ref<Evenement[]>([])

const showModal = ref(false)
const selectedEvent = ref<Evenement | undefined>(undefined)
const createDate = ref('')

const now = new Date()
const monday = getCurrentOrNextMonday(now)
const friday = addDays(monday, 4)

async function load() {
  if (!user.value) return
  loading.value = true
  try {
    events.value = await getMyEvents(user.value.id, formatDate(monday), formatDate(friday))
  } finally {
    loading.value = false
  }
}

// Group events by day (YYYY-MM-DD)
const daysWithEvents = computed(() => {
  const map = new Map<string, Evenement[]>()
  for (const e of events.value) {
    // Event may span multiple days — show on all days it covers within the week
    for (let i = 0; i < 5; i++) {
      const day = addDays(monday, i)
      const dayStr = formatDate(day)
      const start = e.date_debut.slice(0, 10)
      const end = e.date_fin.slice(0, 10)
      if (start <= dayStr && end >= dayStr) {
        if (!map.has(dayStr)) map.set(dayStr, [])
        if (!map.get(dayStr)!.find(x => x.id === e.id)) {
          map.get(dayStr)!.push(e)
        }
      }
    }
  }
  // Return as sorted day entries
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayStr, evs]) => ({ dayStr, evs }))
})

function formatDayLabel(dayStr: string): string {
  const d = new Date(dayStr + 'T12:00:00')
  if (dayStr === formatDate(new Date())) return 'Aujourd\'hui'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

function formatEventTime(e: Evenement): string {
  if (e.toute_journee) return 'Toute la journee'
  const s = new Date(e.date_debut)
  const end = new Date(e.date_fin)
  const st = s.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const et = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${st} – ${et}`
}

function openCreate() {
  selectedEvent.value = undefined
  createDate.value = formatDate(new Date())
  showModal.value = true
}

function openEvent(e: Evenement) {
  selectedEvent.value = e
  createDate.value = ''
  showModal.value = true
}

function onSaved(e: Evenement) {
  load()
}

function onDeleted() {
  load()
}

onMounted(load)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Cette semaine</h3>
        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-plus"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Creer un evenement"
            @click="openCreate"
          />
          <UButton
            label="Calendrier"
            variant="link"
            size="xs"
            to="/emploi-du-temps"
            trailing-icon="i-lucide-arrow-right"
          />
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center h-14">
      <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-amber-500" />
    </div>

    <div v-else-if="!daysWithEvents.length" class="flex flex-col items-center justify-center h-14 gap-2">
      <p class="text-xs text-stone-400">Aucun evenement cette semaine</p>
      <button
        class="text-xs text-amber-600 hover:underline"
        @click="openCreate"
      >
        + Creer un evenement
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="{ dayStr, evs } in daysWithEvents"
        :key="dayStr"
      >
        <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1 capitalize">
          {{ formatDayLabel(dayStr) }}
        </p>
        <div class="space-y-1">
          <button
            v-for="e in evs"
            :key="e.id"
            class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors text-left group"
            @click="openEvent(e)"
          >
            <span
              class="size-2.5 rounded-full shrink-0"
              :style="{ background: e.couleur || '#AF8F3C' }"
            />
            <span class="flex-1 min-w-0">
              <span class="text-xs font-medium text-stone-700 truncate block">{{ e.titre }}</span>
              <span class="text-[10px] text-stone-400">{{ formatEventTime(e) }}</span>
            </span>
            <span
              v-if="e.participants?.length"
              class="text-[10px] text-stone-400 shrink-0"
            >
              {{ e.participants.length }} pers.
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <EvenementModal
      v-if="user"
      :open="showModal"
      :event="selectedEvent"
      :default-date="createDate"
      :is-admin="isDirecteur"
      :current-user-id="user.id"
      @update:open="showModal = $event"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </UCard>
</template>
