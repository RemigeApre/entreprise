<script setup lang="ts">
import type { UserProfile, Candidat, OffreEmploi } from '~/utils/types'
import { CANDIDAT_STATUTS } from '~/utils/constants'

definePageMeta({ middleware: ['directeur'] })

const { getAllUsers } = useUsers()
const { getAll: getAllCandidats } = useCandidats()

const MAX_STAGIAIRES = 3

interface Stagiaire {
  id: string
  name: string
  ecole: string
  start: string
  end: string
  statut: 'a_venir' | 'actif' | 'test' | 'termine'
}

const stagiaires = ref<Stagiaire[]>([])
const candidatsStage = ref<Candidat[]>([])
const loading = ref(true)

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

async function load() {
  loading.value = true
  try {
    const [users, allCandidats] = await Promise.all([getAllUsers(), getAllCandidats()])
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
    candidatsStage.value = allCandidats.filter(c => {
      if (!c.offre || typeof c.offre === 'string') return false
      return (c.offre as OffreEmploi).type_contrat === 'Stage'
    })
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function getCandidatStatutConfig(statut: string) {
  return (CANDIDAT_STATUTS as any)[statut] || { label: statut, color: 'neutral', icon: 'i-lucide-user' }
}

function getOffreTitre(c: Candidat): string {
  if (!c.offre || typeof c.offre === 'string') return ''
  return (c.offre as OffreEmploi).titre
}

function formatCandidatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

onMounted(load)

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

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

function countStagiairesOnDate(dateStr: string): number {
  return stagiaires.value.filter(s => s.statut !== 'test' && s.start <= dateStr && s.end >= dateStr).length
}

const monthCapacity = computed(() =>
  months.value.map(m => {
    const mid = `${m.key}-15`
    const count = countStagiairesOnDate(mid)
    return { ...m, count, full: count >= MAX_STAGIAIRES }
  })
)

const currentCount = computed(() => countStagiairesOnDate(todayStr))
const canRecruit = computed(() => currentCount.value < MAX_STAGIAIRES)
const todayOffset = computed(() => dayOffset(todayStr))

function barColor(s: Stagiaire): string {
  if (s.statut === 'termine') return 'bg-stone-300'
  if (s.statut === 'a_venir') return 'bg-blue-400/80'
  return 'bg-amber-500/80'
}

function barBorder(s: Stagiaire): string {
  if (s.statut === 'termine') return 'border-stone-400'
  if (s.statut === 'a_venir') return 'border-blue-500'
  return 'border-amber-600'
}

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
    <PageHeader title="Recrutement">
      <template #right>
        <NuxtLink to="/equipe/nouveau" class="contents">
          <UButton label="Nouveau stagiaire" icon="i-lucide-plus" size="sm" />
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-6xl mx-auto space-y-4">

        <!-- Sub-nav -->
        <div class="flex items-center gap-1">
          <span class="px-3 py-1.5 text-xs font-medium rounded-md bg-[rgba(175,143,60,0.12)] text-[#af8f3c]">
            Stages
          </span>
          <span class="px-3 py-1.5 text-xs font-medium rounded-md text-stone-300 cursor-not-allowed select-none">
            Alternants
          </span>
          <span class="px-3 py-1.5 text-xs font-medium rounded-md text-stone-300 cursor-not-allowed select-none">
            CDI
          </span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
        </div>

        <template v-else>
          <!-- Capacité (compact) -->
          <div class="flex items-center gap-3 text-sm">
            <div class="flex items-center gap-1.5">
              <div
                class="size-2 rounded-full"
                :class="canRecruit ? 'bg-emerald-500' : 'bg-red-500'"
              />
              <span class="font-semibold text-stone-900">{{ currentCount }}/{{ MAX_STAGIAIRES }}</span>
              <span class="text-stone-500">stagiaires actuellement</span>
            </div>
            <span class="text-stone-300">·</span>
            <span class="text-xs text-stone-400">
              {{ canRecruit
                ? `${MAX_STAGIAIRES - currentCount} place${MAX_STAGIAIRES - currentCount > 1 ? 's' : ''} disponible${MAX_STAGIAIRES - currentCount > 1 ? 's' : ''}`
                : 'Capacite maximale atteinte'
              }}
            </span>
          </div>

          <!-- Timeline Gantt -->
          <div v-if="!stagiaires.length" class="text-center py-8">
            <UIcon name="i-lucide-graduation-cap" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-sm text-stone-500">Aucun stagiaire avec des dates de contrat</p>
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
              <div class="gantt-today-line" :style="{ left: todayOffset * 4 + 'px' }" />

              <!-- Capacity zones -->
              <div class="gantt-capacity-bg">
                <div
                  v-for="m in monthCapacity"
                  :key="'cap-' + m.key"
                  class="gantt-capacity-zone"
                  :class="m.full ? 'bg-red-50/60' : ''"
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
                <NuxtLink
                  :to="`/equipe/${s.id}`"
                  class="gantt-bar"
                  :class="[barColor(s), barBorder(s)]"
                  :style="{
                    left: daySpan(s.start, s.end).offset * 4 + 'px',
                    width: Math.max(daySpan(s.start, s.end).width * 4, 60) + 'px'
                  }"
                >
                  <span class="gantt-bar-label">{{ s.name }}</span>
                </NuxtLink>
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
                      ? 'bg-red-100 text-red-700'
                      : m.count > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-stone-100 text-stone-400'"
                  >
                    {{ m.count }}/{{ MAX_STAGIAIRES }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- Candidats Stage -->
          <div v-if="candidatsStage.length" class="pt-2 space-y-3">
            <h3 class="text-sm font-semibold text-stone-700 flex items-center gap-2">
              <UIcon name="i-lucide-user-search" class="size-4 text-stone-400" />
              Candidats stage
              <span class="text-xs font-normal text-stone-400">({{ candidatsStage.length }})</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink
                v-for="c in candidatsStage"
                :key="c.id"
                :to="`/candidats/${c.id}`"
                class="block"
              >
                <UCard class="hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer h-full">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <h4 class="text-sm font-semibold text-stone-900 truncate">{{ c.prenom }} {{ c.nom }}</h4>
                      <UBadge :color="getCandidatStatutConfig(c.statut).color" variant="subtle" size="xs">
                        {{ getCandidatStatutConfig(c.statut).label }}
                      </UBadge>
                    </div>
                    <p v-if="getOffreTitre(c)" class="text-xs text-stone-500 truncate flex items-center gap-1">
                      <UIcon name="i-lucide-megaphone" class="size-3 text-stone-400 shrink-0" />
                      {{ getOffreTitre(c) }}
                    </p>
                    <div class="flex items-center justify-between text-xs text-stone-400">
                      <span v-if="c.source">{{ c.source }}</span>
                      <span>{{ formatCandidatDate(c.date_created) }}</span>
                    </div>
                  </div>
                </UCard>
              </NuxtLink>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-scroll {
  overflow-x: auto;
  border: 1px solid rgba(175, 143, 60, 0.12);
  border-radius: 12px;
  background: white;
  -webkit-overflow-scrolling: touch;
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
  cursor: pointer;
  transition: filter 0.15s;
  text-decoration: none;
}
.gantt-bar:hover {
  filter: brightness(1.1);
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
</style>
