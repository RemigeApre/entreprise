<script setup lang="ts">
import type { UserProfile, Candidat, OffreEmploi } from '~/utils/types'
import { CANDIDAT_STATUTS, CANDIDAT_PIPELINE_ORDER } from '~/utils/constants'

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
const allCandidats = ref<Candidat[]>([])
const loading = ref(true)

// Candidats — search + sort
const candidatSearch = ref('')
const candidatSort = ref<'date' | 'nom' | 'statut'>('date')
const candidatSortDir = ref<'asc' | 'desc'>('desc')
const showEchec = ref(false)

function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

async function load() {
  loading.value = true
  try {
    const [users, candidats] = await Promise.all([getAllUsers(), getAllCandidats()])
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
    allCandidats.value = candidats
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

const twoMonthsAgo = new Date()
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
const twoMonthsAgoStr = twoMonthsAgo.toISOString()

function sortList(list: typeof allCandidats.value) {
  return [...list].sort((a, b) => {
    let va: string, vb: string
    if (candidatSort.value === 'nom') { va = `${a.nom} ${a.prenom}`; vb = `${b.nom} ${b.prenom}` }
    else if (candidatSort.value === 'statut') { va = a.statut; vb = b.statut }
    else { va = a.date_created; vb = b.date_created }
    const cmp = va.localeCompare(vb)
    return candidatSortDir.value === 'asc' ? cmp : -cmp
  })
}

function matchSearch(c: typeof allCandidats.value[0]) {
  if (!candidatSearch.value.trim()) return true
  const q = candidatSearch.value.toLowerCase()
  return `${c.prenom} ${c.nom}`.toLowerCase().includes(q)
    || c.email?.toLowerCase().includes(q)
    || c.telephone?.toLowerCase().includes(q)
}

const activeCandidats = computed(() =>
  sortList(allCandidats.value.filter(c => c.statut !== 'echec' && matchSearch(c)))
)

const echecCandidats = computed(() =>
  sortList(
    allCandidats.value.filter(c => {
      if (c.statut !== 'echec') return false
      const updated = c.date_updated || c.date_created
      return updated > twoMonthsAgoStr && matchSearch(c)
    })
  )
)

// Keep for empty-state check
const filteredCandidats = computed(() => [...activeCandidats.value, ...echecCandidats.value])

function pipelineStepDone(statut: string, stepKey: string): boolean {
  const order = CANDIDAT_STATUTS[statut as keyof typeof CANDIDAT_STATUTS]?.order ?? 0
  const stepOrder = CANDIDAT_STATUTS[stepKey as keyof typeof CANDIDAT_STATUTS]?.order ?? 0
  return order >= stepOrder
}

function toggleSort(key: 'date' | 'nom' | 'statut') {
  if (candidatSort.value === key) {
    candidatSortDir.value = candidatSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    candidatSort.value = key
    candidatSortDir.value = key === 'date' ? 'desc' : 'asc'
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

function formatDateLong(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ganttTooltip(s: Stagiaire): string {
  const lines = [s.name]
  if (s.ecole) lines.push(s.ecole)
  lines.push(`Du ${formatDateLong(s.start)}`)
  lines.push(`au ${formatDateLong(s.end)}`)
  if (s.end >= todayStr) {
    lines.push(`↳ Libère une place le ${formatDateLong(s.end)}`)
  }
  return lines.join('\n')
}

// Prochaine date où count < MAX_STAGIAIRES
const nextAvailableDate = computed(() => {
  if (currentCount.value < MAX_STAGIAIRES) return null

  // Tous les jours suivant une fin de contrat (futur)
  const endDates = stagiaires.value
    .filter(s => s.statut !== 'test' && s.end >= todayStr)
    .map(s => s.end)
    .sort()

  for (const endDate of endDates) {
    // Le lendemain de la fin de contrat
    const d = new Date(endDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const afterStr = d.toISOString().split('T')[0]
    if (countStagiairesOnDate(afterStr) < MAX_STAGIAIRES) {
      return endDate
    }
  }
  return null
})

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

// Pour chaque mois : pic réel d'occupation (max sur tous les jours clés)
// + indicateur si des jours libres existent malgré un pic élevé
function monthStats(year: number, month: number, totalDaysInMonth: number) {
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`

  // Jours clés à vérifier : 1er du mois + chaque date de début/fin dans ce mois
  // + lendemain de chaque fin (quand une place se libère)
  const daysToCheck = new Set<string>([firstDay])
  for (const s of stagiaires.value) {
    if (s.statut === 'test') continue
    if (s.start >= firstDay && s.start <= lastDay) daysToCheck.add(s.start)
    if (s.end >= firstDay && s.end <= lastDay) {
      daysToCheck.add(s.end)
      const dayAfter = new Date(s.end + 'T00:00:00')
      dayAfter.setDate(dayAfter.getDate() + 1)
      const afterStr = dayAfter.toISOString().split('T')[0]
      if (afterStr <= lastDay) daysToCheck.add(afterStr)
    }
  }

  let peak = 0
  let hasAvailable = false
  for (const day of daysToCheck) {
    const c = countStagiairesOnDate(day)
    if (c > peak) peak = c
    if (c < MAX_STAGIAIRES) hasAvailable = true
  }

  return { peak, hasAvailable }
}

const monthCapacity = computed(() =>
  months.value.map(m => {
    const { peak, hasAvailable } = monthStats(m.year, m.month, m.days)
    return { ...m, count: peak, full: peak >= MAX_STAGIAIRES, hasAvailable }
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
        <UButton label="Nouveau candidat" icon="i-lucide-plus" size="sm" to="/candidats/nouveau" />
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
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
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
                : 'Capacité maximale atteinte'
              }}
            </span>
            <template v-if="nextAvailableDate">
              <span class="text-stone-300">·</span>
              <span class="text-xs text-amber-600 font-medium flex items-center gap-1">
                <UIcon name="i-lucide-calendar-plus" class="size-3.5" />
                Prochain créneau : {{ formatDateLong(nextAvailableDate) }}
              </span>
            </template>
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
                <UTooltip :text="ganttTooltip(s)" :delay-duration="200" :ui="{ content: 'whitespace-pre-line' }">
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
                </UTooltip>
              </div>

              <!-- Capacity count row -->
              <div class="gantt-count-row">
                <div
                  v-for="m in monthCapacity"
                  :key="'cnt-' + m.key"
                  class="gantt-count-cell"
                  :style="{ width: m.days * 4 + 'px' }"
                >
                  <UTooltip
                    :text="m.full && m.hasAvailable
                      ? `Pic : ${m.count}/${MAX_STAGIAIRES} — des places se libèrent ce mois`
                      : m.full
                        ? `Complet tout le mois (${m.count}/${MAX_STAGIAIRES})`
                        : m.count > 0
                          ? `Pic : ${m.count}/${MAX_STAGIAIRES}`
                          : 'Aucun stagiaire'"
                  >
                    <span
                      class="gantt-count-badge"
                      :class="m.full && !m.hasAvailable
                        ? 'bg-red-100 text-red-700'
                        : m.full && m.hasAvailable
                          ? 'bg-orange-100 text-orange-700'
                          : m.count > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-400'"
                    >
                      {{ m.count }}/{{ MAX_STAGIAIRES }}
                      <span v-if="m.full && m.hasAvailable" class="ml-0.5 opacity-70">↓</span>
                    </span>
                  </UTooltip>
                </div>
              </div>
            </div>
          </div>
          <!-- Tous les candidats -->
          <div class="pt-2 space-y-3">
            <!-- Header candidats -->
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-stone-700 flex items-center gap-2 mr-auto">
                <UIcon name="i-lucide-user-search" class="size-4 text-stone-400" />
                Candidats
                <span class="text-xs font-normal text-stone-400">({{ activeCandidats.length }})</span>
              </h3>
              <UInput
                v-model="candidatSearch"
                placeholder="Rechercher..."
                icon="i-lucide-search"
                size="xs"
                class="w-44"
              />
              <div class="flex items-center gap-0.5 text-xs text-stone-400">
                <button
                  v-for="opt in [{ key: 'date', label: 'Date' }, { key: 'nom', label: 'Nom' }, { key: 'statut', label: 'Statut' }]"
                  :key="opt.key"
                  class="px-2 py-1 rounded transition-colors"
                  :class="candidatSort === opt.key ? 'text-primary font-semibold bg-primary/10' : 'hover:text-stone-600'"
                  @click="toggleSort(opt.key as 'date' | 'nom' | 'statut')"
                >
                  {{ opt.label }}
                  <span v-if="candidatSort === opt.key">{{ candidatSortDir === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </div>
              <UButton label="Nouveau" icon="i-lucide-plus" size="xs" to="/candidats/nouveau" />
            </div>

            <!-- Liste vide -->
            <div v-if="!allCandidats.length" class="flex flex-col items-center py-8 text-center">
              <UIcon name="i-lucide-user-search" class="size-10 text-stone-300 mb-3" />
              <p class="text-sm text-stone-500">Aucun candidat pour le moment</p>
              <UButton label="Ajouter un candidat" icon="i-lucide-plus" size="sm" class="mt-3" to="/candidats/nouveau" />
            </div>
            <div v-else-if="!filteredCandidats.length" class="text-center py-6">
              <p class="text-sm text-stone-400">Aucun résultat pour "{{ candidatSearch }}"</p>
            </div>

            <template v-else>
              <!-- Grille actifs -->
              <div v-if="activeCandidats.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <NuxtLink
                  v-for="c in activeCandidats"
                  :key="c.id"
                  :to="`/candidats/${c.id}`"
                  class="block"
                >
                  <div class="candidat-card group">
                    <!-- Bande couleur statut -->
                    <div
                      class="candidat-card-band"
                      :style="{ background: `var(--color-${getCandidatStatutConfig(c.statut).color}-500, #6b7280)` }"
                    />
                    <div class="candidat-card-body">
                      <!-- Nom + date -->
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <h4 class="text-sm font-semibold text-stone-900 leading-tight truncate">{{ c.prenom }} {{ c.nom }}</h4>
                        <span class="text-xs text-stone-400 shrink-0">{{ formatCandidatDate(c.date_contact || c.date_created) }}</span>
                      </div>
                      <!-- Date entretien -->
                      <p v-if="c.statut === 'entretien_prevu' && c.date_entretien" class="text-xs text-violet-600 font-medium flex items-center gap-1 mb-1">
                        <UIcon name="i-lucide-calendar-clock" class="size-3 shrink-0" />
                        {{ new Date(c.date_entretien).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
                      </p>
                      <!-- Offre -->
                      <p v-if="getOffreTitre(c)" class="text-xs text-stone-500 truncate flex items-center gap-1 mb-2">
                        <UIcon name="i-lucide-megaphone" class="size-3 text-stone-400 shrink-0" />
                        {{ getOffreTitre(c) }}
                      </p>
                      <!-- Pipeline steps -->
                      <div class="flex items-center gap-0.5 mb-2.5">
                        <template v-for="(step, i) in CANDIDAT_PIPELINE_ORDER" :key="step">
                          <UTooltip :text="getCandidatStatutConfig(step).label">
                            <div
                              class="pipeline-step transition-all"
                              :class="c.statut === step
                                ? `pipeline-step-current pipeline-step-${getCandidatStatutConfig(step).color}`
                                : pipelineStepDone(c.statut, step)
                                  ? `pipeline-step-done pipeline-step-${getCandidatStatutConfig(step).color}`
                                  : 'pipeline-step-empty'"
                            />
                          </UTooltip>
                          <div v-if="i < CANDIDAT_PIPELINE_ORDER.length - 1" class="pipeline-connector"
                            :class="pipelineStepDone(c.statut, CANDIDAT_PIPELINE_ORDER[i + 1]) ? 'pipeline-connector-done' : ''"
                          />
                        </template>
                      </div>
                      <!-- Statut + retour attendu -->
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-semibold" :style="{ color: `var(--color-${getCandidatStatutConfig(c.statut).color}-600, #6b7280)` }">
                          <UIcon :name="getCandidatStatutConfig(c.statut).icon" class="size-3 inline mr-0.5" />
                          {{ getCandidatStatutConfig(c.statut).label }}
                        </span>
                        <span
                          v-if="c.retour_attendu_de"
                          class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded shrink-0"
                          :class="c.retour_attendu_de === 'nous'
                            ? 'bg-orange-500 text-white'
                            : 'bg-sky-500 text-white'"
                        >
                          <UIcon
                            :name="c.retour_attendu_de === 'nous' ? 'i-lucide-phone-outgoing' : 'i-lucide-clock'"
                            class="size-2.5"
                          />
                          {{ c.retour_attendu_de === 'nous' ? 'À nous' : 'Son retour' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
              </div>

              <!-- Section Échecs (réduite) -->
              <div v-if="echecCandidats.length">
                <button
                  class="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-600 transition-colors py-1 select-none"
                  @click="showEchec = !showEchec"
                >
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-3.5 transition-transform"
                    :class="showEchec ? 'rotate-90' : ''"
                  />
                  <span>Échecs</span>
                  <span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">{{ echecCandidats.length }}</span>
                </button>
                <div v-if="showEchec" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  <NuxtLink
                    v-for="c in echecCandidats"
                    :key="c.id"
                    :to="`/candidats/${c.id}`"
                    class="block"
                  >
                    <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer">
                      <UIcon name="i-lucide-x-circle" class="size-3.5 text-red-400 shrink-0" />
                      <span class="text-xs font-medium text-stone-500 truncate">{{ c.prenom }} {{ c.nom }}</span>
                      <span class="ml-auto text-xs text-stone-400 shrink-0">{{ formatCandidatDate(c.date_contact || c.date_created) }}</span>
                    </div>
                  </NuxtLink>
                </div>
              </div>
            </template>
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

/* ── Candidat cards ── */
.candidat-card {
  display: flex;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: white;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  height: 100%;
}
.candidat-card:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border-color: rgba(175, 143, 60, 0.3);
}

.candidat-card-band {
  width: 4px;
  flex-shrink: 0;
}

.candidat-card-body {
  flex: 1;
  padding: 10px 12px;
  min-width: 0;
}

/* ── Pipeline steps ── */
.pipeline-step {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s;
}
.pipeline-step-empty {
  background: #e7e5e4;
}
.pipeline-step-done {
  background: currentColor;
  opacity: 0.5;
}
.pipeline-step-current {
  background: currentColor;
  width: 13px;
  height: 13px;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
}
.pipeline-step-blue    { color: var(--color-blue-500, #3b82f6); background: var(--color-blue-500, #3b82f6); }
.pipeline-step-violet  { color: var(--color-violet-500, #8b5cf6); background: var(--color-violet-500, #8b5cf6); }
.pipeline-step-sky     { color: var(--color-sky-500, #0ea5e9); background: var(--color-sky-500, #0ea5e9); }
.pipeline-step-amber   { color: var(--color-amber-500, #f59e0b); background: var(--color-amber-500, #f59e0b); }
.pipeline-step-green   { color: var(--color-green-500, #22c55e); background: var(--color-green-500, #22c55e); }

.pipeline-connector {
  flex: 1;
  height: 2px;
  background: #e7e5e4;
  border-radius: 1px;
  min-width: 4px;
  transition: background 0.2s;
}
.pipeline-connector-done {
  background: var(--color-stone-300, #d6d3d1);
}
</style>
