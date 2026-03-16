<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

definePageMeta({ middleware: ['directeur'] })

const { getAllUsers } = useUsers()

const MAX_STAGIAIRES = 3

// ─── Data ────────────────────────────────────────────
interface Stagiaire {
  id: string
  name: string
  ecole: string
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
  statut: 'a_venir' | 'actif' | 'test' | 'termine'
}

const stagiaires = ref<Stagiaire[]>([])
const loading = ref(true)

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

async function load() {
  loading.value = true
  try {
    const users = await getAllUsers()
    stagiaires.value = users
      .filter(u => u.type_contrat === 'Stage' && u.date_debut_contrat && u.date_fin_contrat && u.statut_emploi !== 'test')
      .map(u => ({
        id: u.id,
        name: getUserName(u),
        ecole: u.ecole || '',
        start: u.date_debut_contrat!,
        end: u.date_fin_contrat!,
        statut: (u.statut_emploi || 'actif') as Stagiaire['statut']
      }))
      .sort((a, b) => a.start.localeCompare(b.start))
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ─── Timeline config ─────────────────────────────────
const today = new Date()
const todayStr = today.toISOString().split('T')[0]

// Show 12 months: 3 before now, 9 after
const months = computed(() => {
  const result: { key: string; label: string; year: number; month: number; days: number }[] = []
  const base = new Date(today.getFullYear(), today.getMonth() - 3, 1)
  for (let i = 0; i < 18; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    const label = d.toLocaleDateString('fr-FR', { month: 'short' })
    result.push({ key: `${y}-${String(m + 1).padStart(2, '0')}`, label, year: y, month: m, days })
  }
  return result
})

const totalDays = computed(() => months.value.reduce((s, m) => s + m.days, 0))

const timelineStart = computed(() => {
  const m = months.value[0]
  return new Date(m.year, m.month, 1)
})

function dayOffset(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const diff = d.getTime() - timelineStart.value.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function daySpan(startStr: string, endStr: string): { offset: number; width: number } {
  const s = dayOffset(startStr)
  const e = dayOffset(endStr)
  return { offset: Math.max(0, s), width: Math.max(1, e - s + 1) }
}

// ─── Capacity per month ──────────────────────────────
function countStagiairesOnDate(dateStr: string): number {
  return stagiaires.value.filter(s => s.statut !== 'test' && s.start <= dateStr && s.end >= dateStr).length
}

const monthCapacity = computed(() => {
  return months.value.map(m => {
    // Check the 15th of each month as representative
    const mid = `${m.key}-15`
    const count = countStagiairesOnDate(mid)
    return { ...m, count, full: count >= MAX_STAGIAIRES }
  })
})

// Current count
const currentCount = computed(() => countStagiairesOnDate(todayStr))
const canRecruit = computed(() => currentCount.value < MAX_STAGIAIRES)

// Today line position
const todayOffset = computed(() => dayOffset(todayStr))

// ─── Stagiaire bar colors ────────────────────────────
function barColor(s: Stagiaire): string {
  if (s.statut === 'termine') return 'bg-stone-300 dark:bg-stone-600'
  if (s.statut === 'a_venir') return 'bg-blue-400/80 dark:bg-blue-500/60'
  return 'bg-amber-500/80 dark:bg-amber-400/70'
}

function barBorder(s: Stagiaire): string {
  if (s.statut === 'termine') return 'border-stone-400 dark:border-stone-500'
  if (s.statut === 'a_venir') return 'border-blue-500 dark:border-blue-400'
  return 'border-amber-600 dark:border-amber-500'
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Scroll to today on mount
const timelineRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    if (timelineRef.value) {
      const scrollTarget = (todayOffset.value / totalDays.value) * timelineRef.value.scrollWidth - timelineRef.value.clientWidth / 3
      timelineRef.value.scrollLeft = Math.max(0, scrollTarget)
    }
  })
})
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Capacite stages">
      <template #right>
        <NuxtLink to="/equipe/nouveau" class="contents">
          <UButton
            label="Nouveau stagiaire"
            icon="i-lucide-plus"
            size="sm"
          />
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
      </div>

      <template v-else>
        <!-- ═══ Status banner ═══ -->
        <div
          class="rounded-xl border p-4 sm:p-5"
          :class="canRecruit
            ? 'border-emerald-300/40 bg-emerald-50/50 dark:border-emerald-700/30 dark:bg-emerald-950/20'
            : 'border-red-300/40 bg-red-50/50 dark:border-red-700/30 dark:bg-red-950/20'"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="size-10 rounded-lg flex items-center justify-center"
                :class="canRecruit ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'"
              >
                <UIcon
                  :name="canRecruit ? 'i-lucide-check-circle' : 'i-lucide-alert-triangle'"
                  class="size-5"
                  :class="canRecruit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
                />
              </div>
              <div>
                <p class="text-sm font-semibold text-stone-900 dark:text-white">
                  {{ currentCount }} / {{ MAX_STAGIAIRES }} stagiaire{{ currentCount > 1 ? 's' : '' }} aujourd'hui
                </p>
                <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {{ canRecruit
                    ? `Vous pouvez recruter ${MAX_STAGIAIRES - currentCount} stagiaire${MAX_STAGIAIRES - currentCount > 1 ? 's' : ''} supplementaire${MAX_STAGIAIRES - currentCount > 1 ? 's' : ''}`
                    : 'Capacite maximale atteinte — attendez la fin d\'un stage pour en recruter un nouveau'
                  }}
                </p>
              </div>
            </div>

            <!-- Gauge -->
            <div class="flex items-center gap-2">
              <div
                v-for="i in MAX_STAGIAIRES"
                :key="i"
                class="size-8 rounded-lg border-2 flex items-center justify-center transition-colors"
                :class="i <= currentCount
                  ? 'border-amber-500 bg-amber-500/20 dark:border-amber-400 dark:bg-amber-400/20'
                  : 'border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800'"
              >
                <UIcon
                  v-if="i <= currentCount"
                  name="i-lucide-user"
                  class="size-4 text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ Capacity bar per month ═══ -->
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Occupation par mois
          </p>
          <div class="flex gap-1 overflow-x-auto pb-1">
            <div
              v-for="mc in monthCapacity"
              :key="mc.key"
              class="flex flex-col items-center gap-1 min-w-[44px]"
            >
              <div class="flex gap-px">
                <div
                  v-for="i in MAX_STAGIAIRES"
                  :key="i"
                  class="w-3 h-5 rounded-sm transition-colors"
                  :class="i <= mc.count
                    ? mc.count >= MAX_STAGIAIRES ? 'bg-red-400 dark:bg-red-500' : 'bg-amber-400 dark:bg-amber-500'
                    : 'bg-stone-200 dark:bg-stone-700'"
                />
              </div>
              <span
                class="text-[10px] font-medium"
                :class="mc.key === months[3]?.key
                  ? 'text-[#af8f3c] font-semibold'
                  : 'text-stone-400 dark:text-stone-500'"
              >
                {{ mc.label }}
              </span>
              <span
                v-if="mc.year !== months[0]?.year || mc.month === 0"
                class="text-[9px] text-stone-300 dark:text-stone-600 -mt-1"
              >
                {{ mc.year }}
              </span>
            </div>
          </div>
        </div>

        <!-- ═══ Timeline Gantt ═══ -->
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Timeline
          </p>

          <div v-if="!stagiaires.length" class="text-center py-8">
            <UIcon name="i-lucide-graduation-cap" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <p class="text-sm text-stone-500 dark:text-stone-400">Aucun stagiaire avec des dates de contrat</p>
          </div>

          <div v-else ref="timelineRef" class="gantt-scroll">
            <div class="gantt-container" :style="{ width: totalDays * 4 + 'px', minWidth: '100%' }">
              <!-- Month headers -->
              <div class="gantt-months">
                <div
                  v-for="m in months"
                  :key="m.key"
                  class="gantt-month-header"
                  :style="{ width: m.days * 4 + 'px' }"
                >
                  <span class="gantt-month-label">{{ m.label }} {{ m.year }}</span>
                </div>
              </div>

              <!-- Today line -->
              <div
                class="gantt-today-line"
                :style="{ left: todayOffset * 4 + 'px' }"
              />

              <!-- Capacity zones (background) -->
              <div class="gantt-capacity-bg">
                <div
                  v-for="m in monthCapacity"
                  :key="'cap-' + m.key"
                  class="gantt-capacity-zone"
                  :class="m.full ? 'bg-red-50/60 dark:bg-red-950/20' : ''"
                  :style="{ width: m.days * 4 + 'px' }"
                />
              </div>

              <!-- Stagiaire rows -->
              <div
                v-for="s in stagiaires"
                :key="s.id"
                class="gantt-row"
              >
                <div class="gantt-row-bg" />
                <div
                  class="gantt-bar"
                  :class="[barColor(s), barBorder(s)]"
                  :style="{
                    left: daySpan(s.start, s.end).offset * 4 + 'px',
                    width: Math.max(daySpan(s.start, s.end).width * 4, 60) + 'px'
                  }"
                >
                  <span class="gantt-bar-label">{{ s.name }}</span>
                </div>
              </div>

              <!-- Capacity count row -->
              <div class="gantt-count-row">
                <div
                  v-for="m in monthCapacity"
                  :key="'cnt-' + m.key"
                  class="gantt-count-cell"
                  :style="{ width: m.days * 4 + 'px' }"
                >
                  <span
                    class="gantt-count-badge"
                    :class="m.full
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                      : m.count > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500'"
                  >
                    {{ m.count }}/{{ MAX_STAGIAIRES }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ Liste detaillee ═══ -->
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Detail des stages
          </p>
          <div v-if="stagiaires.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NuxtLink
              v-for="s in stagiaires"
              :key="s.id"
              :to="`/equipe/${s.id}`"
              class="block"
            >
              <div class="stage-card" :class="{ 'is-termine': s.statut === 'termine' }">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-stone-900 dark:text-white truncate">{{ s.name }}</p>
                    <p v-if="s.ecole" class="text-xs text-stone-500 dark:text-stone-400 truncate">{{ s.ecole }}</p>
                  </div>
                  <UBadge
                    :color="s.statut === 'actif' ? 'green' : s.statut === 'a_venir' ? 'blue' : 'neutral'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ s.statut === 'actif' ? 'Actif' : s.statut === 'a_venir' ? 'A venir' : 'Termine' }}
                  </UBadge>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                  <UIcon name="i-lucide-calendar" class="size-3" />
                  {{ formatDateFr(s.start) }} — {{ formatDateFr(s.end) }}
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ═══ GANTT ═══ */
.gantt-scroll {
  overflow-x: auto;
  border: 1px solid rgba(175, 143, 60, 0.12);
  border-radius: 12px;
  background: white;
  -webkit-overflow-scrolling: touch;
}
:global(.dark) .gantt-scroll {
  background: rgba(175, 143, 60, 0.02);
}

.gantt-container {
  position: relative;
}

.gantt-months {
  display: flex;
  border-bottom: 1px solid rgba(175, 143, 60, 0.1);
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(237, 228, 204, 0.3);
}

.gantt-month-header {
  border-right: 1px solid rgba(175, 143, 60, 0.08);
  padding: 8px 0;
  text-align: center;
  flex-shrink: 0;
}

.gantt-month-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  color: rgba(44, 36, 25, 0.5);
  letter-spacing: 0.02em;
}

.gantt-today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #b74d34;
  z-index: 10;
  pointer-events: none;
}
.gantt-today-line::before {
  content: "Aujourd'hui";
  position: absolute;
  top: 2px;
  left: 6px;
  font-size: 9px;
  font-weight: 600;
  color: #b74d34;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gantt-capacity-bg {
  display: flex;
  position: absolute;
  top: 36px;
  bottom: 32px;
  z-index: 0;
}

.gantt-capacity-zone {
  flex-shrink: 0;
  border-right: 1px solid rgba(175, 143, 60, 0.05);
}

.gantt-row {
  position: relative;
  height: 36px;
  display: flex;
  align-items: center;
}

.gantt-row-bg {
  position: absolute;
  inset: 0;
  border-bottom: 1px solid rgba(175, 143, 60, 0.05);
}

.gantt-bar {
  position: absolute;
  height: 26px;
  border-radius: 6px;
  border-left: 3px solid;
  display: flex;
  align-items: center;
  padding: 0 8px;
  z-index: 2;
  cursor: default;
  transition: filter 0.15s;
}
.gantt-bar:hover {
  filter: brightness(1.05);
}

.gantt-bar-label {
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gantt-count-row {
  display: flex;
  border-top: 1px solid rgba(175, 143, 60, 0.1);
  height: 32px;
}

.gantt-count-cell {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(175, 143, 60, 0.05);
}

.gantt-count-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

/* ═══ STAGE CARDS ═══ */
.stage-card {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(175, 143, 60, 0.1);
  background: white;
  transition: all 0.2s;
}
:global(.dark) .stage-card {
  background: rgba(175, 143, 60, 0.02);
  border-color: rgba(175, 143, 60, 0.06);
}
.stage-card:hover {
  border-color: rgba(175, 143, 60, 0.2);
  box-shadow: 0 2px 12px rgba(175, 143, 60, 0.06);
}
.stage-card.is-termine {
  opacity: 0.5;
}
</style>
