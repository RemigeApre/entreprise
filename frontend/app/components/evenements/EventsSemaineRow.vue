<script setup lang="ts">
import type { Evenement } from '~/utils/types'
import { getWeekDays, formatDate } from '~/utils/dates'

const props = defineProps<{
  monday: Date
  userId: string
  isAdmin?: boolean
}>()

const emit = defineEmits<{
  (e: 'create', date: string): void
  (e: 'click-event', event: Evenement): void
}>()

const { getMyEvents } = useEvenements()

const loading = ref(false)
const events = ref<Evenement[]>([])
const weekDays = computed(() => getWeekDays(props.monday))

const hasAnyEvent = computed(() => events.value.length > 0)

async function load() {
  loading.value = true
  try {
    const friday = weekDays.value[4]
    events.value = await getMyEvents(props.userId, formatDate(props.monday), formatDate(friday))
  } finally {
    loading.value = false
  }
}

function getEventsForDay(day: Date): Evenement[] {
  const dayStr = formatDate(day)
  return events.value.filter(e => {
    const s = e.date_debut.slice(0, 10)
    const end = e.date_fin.slice(0, 10)
    return s <= dayStr && end >= dayStr
  })
}

function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

function getDayLabel(day: Date): string {
  return day.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase().replace('.', '') + ' ' + day.getDate()
}

const isToday = (day: Date) => formatDate(day) === formatDate(new Date())

watch(() => props.monday, load)
onMounted(load)
defineExpose({ load })
</script>

<template>
  <UCard>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr>
            <th class="text-left pr-4 pb-2" style="min-width: 90px">
              <span class="text-sm font-semibold text-stone-900 dark:text-stone-100">Evenements</span>
            </th>
            <th
              v-for="day in weekDays"
              :key="formatDate(day)"
              class="pb-2 px-2 text-center"
            >
              <div class="flex items-center justify-between gap-1 min-w-[60px]">
                <span
                  class="text-[11px] font-semibold"
                  :class="isToday(day) ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'"
                >
                  {{ getDayLabel(day) }}
                </span>
                <button
                  class="size-4 flex items-center justify-center rounded text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  :title="'Creer un evenement le ' + getDayLabel(day)"
                  @click="emit('create', formatDate(day))"
                >
                  <UIcon name="i-lucide-plus" class="size-3" />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="6" class="py-2 text-center">
              <UIcon name="i-lucide-loader-2" class="size-3.5 animate-spin text-amber-500" />
            </td>
          </tr>

          <template v-else-if="hasAnyEvent">
            <tr>
              <td class="pr-4 pb-1" />
              <td
                v-for="day in weekDays"
                :key="'ev-' + formatDate(day)"
                class="px-2 pb-1 align-top"
              >
                <div class="space-y-0.5 min-h-[20px]">
                  <button
                    v-for="e in getEventsForDay(day)"
                    :key="e.id"
                    class="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                    @click="emit('click-event', e)"
                  >
                    <span
                      class="size-2 rounded-full shrink-0"
                      :style="{ background: e.couleur || '#AF8F3C' }"
                    />
                    <span class="truncate text-stone-600 dark:text-stone-300 max-w-[80px]">{{ e.titre }}</span>
                    <span v-if="!e.toute_journee" class="shrink-0 text-stone-400 dark:text-stone-500">{{ formatTime(e.date_debut) }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </template>

          <tr v-else>
            <td :colspan="6" class="py-1.5 text-center text-[11px] text-stone-400 dark:text-stone-500">
              Aucun evenement cette semaine ·
              <button
                class="underline hover:text-amber-600 transition-colors"
                @click="emit('create', formatDate(new Date()))"
              >
                Creer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
