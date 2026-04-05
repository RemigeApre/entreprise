<script setup lang="ts">
import { updateMe, readItems } from '@directus/sdk'
import type { Prospect, ProspectStatut, NiveauSite, ContactCanal, ContactResultat } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS, MOTIFS_CLOTURE, ORIGINES_PROSPECTION, NIVEAUX_SITE } from '~/utils/constants'
import { downloadCsv } from '~/utils/csv'

const { user, isProspecteur, fetchCurrentUser } = useAuth()
const { $directus } = useNuxtApp()
const { getAll, addContact, update: updateProspect } = useProspects()
const toast = useToast()
const { hasQuota, objectifJour, objectifSemaine, weekContacts, todayContacts, loading: quotaLoading, loadWeekContacts, setObjectif } = useProspectQuota()

const optingIn = ref(false)
const showQuotaModal = ref(false)
const quotaInput = ref<number | null>(null)
const quotaSaving = ref(false)

function openQuotaModal() {
  quotaInput.value = objectifJour.value
  showQuotaModal.value = true
}

async function saveQuota() {
  quotaSaving.value = true
  try {
    const val = quotaInput.value && quotaInput.value > 0 ? quotaInput.value : null
    await setObjectif(val)
    await loadWeekContacts()
    toast.add({ title: val ? `Objectif: ${val} contacts/jour` : 'Objectif desactive', color: 'success' })
    showQuotaModal.value = false
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    quotaSaving.value = false
  }
}

async function handleOptIn() {
  if (!user.value) return
  optingIn.value = true
  try {
    await $directus.request(updateMe({ actif_prospection: true } as any))
    await fetchCurrentUser()
    toast.add({ title: 'Bienvenue dans la prospection !', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    optingIn.value = false
  }
}

const { data: prospects, status, refresh } = useAsyncData('prospects', getAll)

// --- Filters persisted in URL ---
const route = useRoute()
const router = useRouter()

const search = ref((route.query.q as string) || '')
const filterStatut = ref<ProspectStatut | 'all'>((route.query.statut as ProspectStatut | 'all') || 'all')
const filterSite = ref<NiveauSite | 'all'>((route.query.site as NiveauSite | 'all') || 'all')

function syncFiltersToUrl() {
  const query: Record<string, string> = {}
  if (search.value) query.q = search.value
  if (filterStatut.value !== 'all') query.statut = filterStatut.value
  if (filterSite.value !== 'all') query.site = filterSite.value
  router.replace({ query })
}

watch(search, syncFiltersToUrl)
watch(filterStatut, syncFiltersToUrl)
watch(filterSite, syncFiltersToUrl)

// Sort
const { sort, toggleSort, sortItems } = useListSort<Prospect>('date_created', 'desc')

const sortOptions = [
  { label: 'Recents', key: 'date_created' },
  { label: 'Nom', key: 'nom_entreprise' },
  { label: 'Contacts', key: 'nb_contacts' }
]

function prospectAccessor(p: Prospect, key: string): string | number | null {
  if (key === 'last_contact') return getLastContactDate(p)?.getTime() ?? 0
  return (p as any)[key] ?? null
}

const filteredProspects = computed(() => {
  if (!prospects.value) return []
  return sortItems(
    prospects.value.filter((p: Prospect) => {
      const q = search.value.toLowerCase()
      const matchesSearch = !q || [p.nom_entreprise, p.contact_nom, p.telephone, p.ville, p.adresse].some(f => f?.toLowerCase().includes(q))
      const matchesSite = filterSite.value === 'all' || p.niveau_site === filterSite.value
      if (filterStatut.value === 'all') return matchesSearch && matchesSite && p.statut !== 'cloture'
      return matchesSearch && matchesSite && p.statut === filterStatut.value
    }),
    prospectAccessor
  )
})

const { paginatedItems: pagedProspects, page, totalPages, showPagination, next, prev } = usePagination(filteredProspects, 50)

const hasFilters = computed(() => !!search.value || filterStatut.value !== 'all' || filterSite.value !== 'all')

function clearFilters() {
  search.value = ''
  filterStatut.value = 'all'
  filterSite.value = 'all'
}

const statsByStatus = computed(() => {
  if (!prospects.value) return {} as Record<string, number>
  const c: Record<string, number> = {}
  for (const p of prospects.value) c[p.statut] = (c[p.statut] || 0) + 1
  return c
})

// --- Quick log contact from list ---
const loggingId = ref<string | null>(null)
const quickLog = reactive({
  canal: 'telephone' as ContactCanal,
  resultat: 'attente' as ContactResultat
})

const canalOptions = Object.entries(CONTACT_CANAUX).map(([value, config]) => ({ label: config.label, value }))
const resultatOptions = Object.entries(CONTACT_RESULTATS).map(([value, config]) => ({ label: config.label, value }))

function openQuickLog(id: string) {
  loggingId.value = loggingId.value === id ? null : id
  quickLog.canal = 'telephone'
  quickLog.resultat = 'attente'
}

async function submitQuickLog(prospect: Prospect) {
  if (!user.value) return
  try {
    await addContact({
      prospect: prospect.id,
      canal: quickLog.canal,
      resultat: quickLog.resultat,
      date_contact: new Date().toISOString().split('T')[0],
      notes: '',
      contacte_par: user.value.id
    })
    const newNb = (prospect.nb_contacts || 0) + 1
    const updates: Partial<Prospect> = { nb_contacts: newNb }
    if (prospect.statut === 'a_contacter') updates.statut = 'premier_contact'
    if (quickLog.resultat === 'positif' && prospect.statut === 'premier_contact') updates.statut = 'en_discussion'
    await updateProspect(prospect.id, updates)
    await loadWeekContacts()
    loggingId.value = null
    const quotaMsg = hasQuota.value && objectifJour.value ? ` (${todayContacts.value}/${objectifJour.value})` : ''
    toast.add({ title: `Contact enregistre${quotaMsg}`, color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  }
}

// --- Helpers ---
function getLastContact(p: Prospect) {
  if (!p.historique_contacts?.length) return null
  return [...p.historique_contacts].sort(
    (a, b) => new Date(b.date_contact).getTime() - new Date(a.date_contact).getTime()
  )[0]
}

function getLastContactDate(p: Prospect): Date | null {
  const last = getLastContact(p)
  return last ? new Date(last.date_contact) : null
}

function timeAgo(date: string | null): string {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
  return `Il y a ${Math.floor(days / 30)} mois`
}

const statusPillColor: Record<string, string> = {
  a_contacter: 'bg-stone-600 text-white',
  premier_contact: 'bg-blue-600 text-white',
  en_discussion: 'bg-amber-500 text-white',
  client: 'bg-emerald-600 text-white',
  cloture: 'bg-red-500 text-white'
}

const statusBadge: Record<string, string> = {
  a_contacter: 'bg-stone-100 text-stone-600',
  premier_contact: 'bg-blue-50 text-blue-600',
  en_discussion: 'bg-amber-50 text-amber-600',
  client: 'bg-emerald-50 text-emerald-600',
  cloture: 'bg-red-50 text-red-500'
}

function exportCsv() {
  const data = filteredProspects.value
  if (!data.length) return
  const rows = data.map(p => ({
    'Entreprise': p.nom_entreprise,
    'Ville': p.ville,
    'Adresse': p.adresse || '',
    'Secteur': p.secteur || '',
    'Contact': p.contact_nom || '',
    'Origine': p.origine ? (ORIGINES_PROSPECTION[p.origine]?.label || p.origine) : '',
    'Telephone': p.telephone || '',
    'Telephones secondaires': p.telephones_secondaires?.replace(/\n/g, ', ') || '',
    'Email': p.email || '',
    'Emails secondaires': p.emails_secondaires?.replace(/\n/g, ', ') || '',
    'Site web': p.site_web || '',
    'Niveau site': p.niveau_site ? (NIVEAUX_SITE[p.niveau_site]?.label || p.niveau_site) : '',
    'Statut': PROSPECT_STATUTS[p.statut]?.label || p.statut,
    'Motif cloture': p.motif_cloture ? (MOTIFS_CLOTURE[p.motif_cloture]?.label || p.motif_cloture) : '',
    'Nb contacts': p.nb_contacts || 0,
    'Date creation': p.date_created?.split('T')[0] || ''
  }))
  downloadCsv(rows, `prospects_${new Date().toISOString().split('T')[0]}.csv`)
}

// --- Stats panel ---
const showStats = ref(false)
const statsPeriod = ref<'week' | 'month' | 'year'>('week')
const statsLoading = ref(false)

interface StatEntry {
  userId: string
  name: string
  count: number
}

const statsData = ref<StatEntry[]>([])
const statsTotal = computed(() => statsData.value.reduce((sum, s) => sum + s.count, 0))

function getStatsBounds(period: 'week' | 'month' | 'year') {
  const now = new Date()
  const start = new Date(now)
  if (period === 'week') {
    const day = now.getDay()
    const diffToMonday = day === 0 ? 6 : day - 1
    start.setDate(now.getDate() - diffToMonday)
  } else if (period === 'month') {
    start.setDate(1)
  } else {
    start.setMonth(0, 1)
  }
  start.setHours(0, 0, 0, 0)
  return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const { start, end } = getStatsBounds(statsPeriod.value)
    const contacts = await $directus.request(readItems('contacts_history', {
      filter: {
        date_contact: { _gte: start, _lte: end }
      },
      fields: ['id', 'contacte_par.id', 'contacte_par.first_name', 'contacte_par.last_name'],
      limit: -1
    })) as { id: string; contacte_par: { id: string; first_name: string; last_name: string } }[]

    const map = new Map<string, StatEntry>()
    for (const c of contacts) {
      if (!c.contacte_par) continue
      const uid = c.contacte_par.id
      const existing = map.get(uid)
      if (existing) {
        existing.count++
      } else {
        map.set(uid, {
          userId: uid,
          name: `${c.contacte_par.first_name || ''} ${c.contacte_par.last_name || ''}`.trim() || 'Inconnu',
          count: 1
        })
      }
    }
    statsData.value = [...map.values()].sort((a, b) => b.count - a.count)
  } catch {
    statsData.value = []
  } finally {
    statsLoading.value = false
  }
}

async function toggleStats() {
  showStats.value = !showStats.value
  if (showStats.value) await loadStats()
}

watch(statsPeriod, () => {
  if (showStats.value) loadStats()
})

const periodLabels: Record<string, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  year: 'Cette annee'
}

if (import.meta.client) {
  onMounted(loadWeekContacts)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Opt-in -->
    <template v-if="!isProspecteur">
      <PageHeader title="Prospection" />
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div class="max-w-lg mx-auto text-center py-16">
          <div class="inline-flex items-center justify-center size-16 rounded-full bg-[rgba(175,143,60,0.08)] mb-6">
            <UIcon name="i-lucide-target" class="size-8 text-[#af8f3c]" />
          </div>
          <h2 class="text-lg font-semibold text-stone-900 mb-3">Prospection</h2>
          <p class="text-sm text-stone-600 leading-relaxed mb-8">
            Participez a la prospection pour trouver de nouveaux clients.
          </p>
          <UButton label="Oui, je veux participer" icon="i-lucide-check" size="lg" :loading="optingIn" @click="handleOptIn" />
        </div>
      </div>
    </template>

    <!-- Main -->
    <template v-else>
      <PageHeader>
        <template #left>
          <button
            v-if="hasQuota && !quotaLoading"
            class="flex items-center gap-2 text-xs tabular-nums cursor-pointer hover:opacity-80 transition-opacity"
            @click="openQuotaModal"
          >
            <span class="font-semibold" :class="todayContacts >= objectifJour! ? 'text-emerald-600' : 'text-stone-700'">
              {{ todayContacts }}/{{ objectifJour }}
            </span>
            <span class="text-stone-400">jour</span>
            <span class="text-stone-300">|</span>
            <span class="font-semibold" :class="weekContacts >= objectifSemaine! ? 'text-emerald-600' : 'text-stone-700'">
              {{ weekContacts }}/{{ objectifSemaine }}
            </span>
            <span class="text-stone-400">sem.</span>
          </button>
          <UButton v-else-if="!hasQuota" label="Objectif" icon="i-lucide-target" size="xs" variant="ghost" color="neutral" @click="openQuotaModal" />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-bar-chart-3"
            color="neutral"
            :variant="showStats ? 'soft' : 'ghost'"
            size="sm"
            @click="toggleStats"
          />
          <UButton icon="i-lucide-download" color="neutral" variant="ghost" size="sm" :disabled="!filteredProspects.length" @click="exportCsv" />
          <UButton label="Nouveau" icon="i-lucide-plus" size="sm" to="/prospection/nouveau" />
        </template>
      </PageHeader>

      <!-- Stats panel -->
      <div v-if="showStats" class="border-b border-stone-200/60 bg-white/40 px-4 sm:px-6 py-4">
        <div class="max-w-2xl mx-auto">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-stone-800">Contacts par prospecteur</h3>
            <div class="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
              <button
                v-for="(label, key) in periodLabels"
                :key="key"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                :class="statsPeriod === key ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'"
                @click="statsPeriod = key as 'week' | 'month' | 'year'"
              >
                {{ label }}
              </button>
            </div>
          </div>

          <div v-if="statsLoading" class="flex justify-center py-4">
            <UIcon name="i-lucide-loader-2" class="size-5 text-primary animate-spin" />
          </div>

          <div v-else-if="!statsData.length" class="text-center py-4 text-sm text-stone-400">
            Aucun contact sur cette periode
          </div>

          <div v-else class="space-y-2">
            <!-- Per person -->
            <div
              v-for="stat in statsData"
              :key="stat.userId"
              class="flex items-center gap-3"
            >
              <span class="text-sm font-medium text-stone-700 w-32 truncate">{{ stat.name }}</span>
              <div class="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary/80 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                  :style="{ width: `${Math.max((stat.count / (statsData[0]?.count || 1)) * 100, 12)}%` }"
                >
                  <span class="text-[11px] font-bold text-white tabular-nums">{{ stat.count }}</span>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="flex items-center gap-3 pt-2 border-t border-stone-200/60">
              <span class="text-sm font-bold text-stone-800 w-32">Total</span>
              <span class="text-sm font-bold text-stone-800 tabular-nums">{{ statsTotal }} contacts</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="status === 'pending'" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        </div>

        <template v-else>
          <!-- Sticky toolbar -->
          <div class="sticky top-0 z-10 bg-[#E6E2DA]/95 backdrop-blur-sm border-b border-stone-200/40 px-4 sm:px-6 py-2.5">
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <!-- Status pills -->
              <button
                class="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                :class="filterStatut === 'all' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-200/60'"
                @click="filterStatut = 'all'"
              >
                Actifs <span class="opacity-60 tabular-nums">{{ (prospects?.length || 0) - (statsByStatus['cloture'] || 0) }}</span>
              </button>
              <button
                v-for="(config, key) in PROSPECT_STATUTS"
                :key="key"
                class="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                :class="filterStatut === key ? (statusPillColor[key]) : 'text-stone-500 hover:bg-stone-200/60'"
                @click="filterStatut = filterStatut === key ? 'all' : (key as ProspectStatut)"
              >
                {{ config.label }}
                <span v-if="statsByStatus[key]" class="opacity-60 tabular-nums">{{ statsByStatus[key] }}</span>
              </button>

              <div class="shrink-0 w-px h-5 bg-stone-300/40 mx-1" />

              <!-- Site level filter -->
              <button
                v-for="(config, key) in NIVEAUX_SITE"
                :key="key"
                class="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all"
                :class="filterSite === key
                  ? {
                      'bg-stone-600 text-white': key === 'pas_de_site',
                      'bg-red-500 text-white': key === 'site_casse',
                      'bg-orange-500 text-white': key === 'site_nul',
                      'bg-amber-500 text-white': key === 'site_passable'
                    }
                  : 'text-stone-400 hover:bg-stone-200/60'"
                @click="filterSite = filterSite === key ? 'all' : (key as NiveauSite)"
              >
                <UIcon :name="config.icon" class="size-3" />
                {{ config.label }}
              </button>

              <div class="shrink-0 w-px h-5 bg-stone-300/40 mx-1" />

              <!-- Sort -->
              <button
                v-for="opt in sortOptions"
                :key="opt.key"
                class="shrink-0 px-2 py-1 rounded text-xs transition-colors"
                :class="sort.key === opt.key ? 'text-primary font-semibold' : 'text-stone-400 hover:text-stone-600'"
                @click="toggleSort(opt.key)"
              >
                {{ opt.label }}
                <span v-if="sort.key === opt.key">{{ sort.dir === 'asc' ? '↑' : '↓' }}</span>
              </button>

              <!-- Search -->
              <UInput
                v-model="search"
                placeholder="Rechercher..."
                icon="i-lucide-search"
                size="xs"
                class="ml-auto w-40 shrink-0"
              />
              <UButton v-if="hasFilters" icon="i-lucide-x" size="xs" color="neutral" variant="ghost" @click="clearFilters" />
            </div>
          </div>

          <!-- Content -->
          <div class="p-3 sm:p-4">
            <!-- Empty -->
            <div v-if="!filteredProspects.length" class="text-center py-16">
              <UIcon name="i-lucide-target" class="size-10 text-stone-300 mx-auto mb-3" />
              <p class="text-stone-500">{{ hasFilters ? 'Aucun resultat' : 'Aucun prospect' }}</p>
              <UButton v-if="hasFilters" label="Effacer" icon="i-lucide-x" variant="subtle" class="mt-3" @click="clearFilters" />
              <UButton v-else label="Creer un prospect" icon="i-lucide-plus" class="mt-4" to="/prospection/nouveau" />
            </div>

            <!-- Cards -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div
                v-for="prospect in pagedProspects"
                :key="prospect.id"
                class="rounded-xl bg-white/70 shadow-sm hover:shadow-md border border-white/80 overflow-hidden transition-all"
              >
                <!-- Header : nom + statut + ville -->
                <NuxtLink :to="`/prospection/${prospect.id}`" class="block group">
                  <div class="px-4 pt-3.5 pb-2">
                    <div class="flex items-start justify-between gap-2 mb-1">
                      <h3 class="text-[15px] font-bold text-stone-800 truncate group-hover:text-[#af8f3c] transition-colors leading-tight">
                        {{ prospect.nom_entreprise }}
                      </h3>
                      <span
                        class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        :class="statusBadge[prospect.statut]"
                      >{{ PROSPECT_STATUTS[prospect.statut]?.label }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-stone-500">
                      <span v-if="prospect.origine" class="inline-flex items-center gap-0.5 text-[10px] text-primary/70 shrink-0">
                        <UIcon :name="ORIGINES_PROSPECTION[prospect.origine]?.icon || 'i-lucide-help-circle'" class="size-2.5" />
                        {{ ORIGINES_PROSPECTION[prospect.origine]?.label }}
                      </span>
                      <span v-if="prospect.origine && (prospect.contact_nom || prospect.ville)" class="text-stone-300">-</span>
                      <span v-if="prospect.contact_nom" class="truncate">{{ prospect.contact_nom }}</span>
                      <span v-if="prospect.contact_nom && prospect.ville" class="text-stone-300">-</span>
                      <span class="text-stone-400 truncate">{{ prospect.ville }}</span>
                      <span v-if="prospect.statut === 'cloture' && prospect.motif_cloture" class="text-red-400 shrink-0">
                        {{ MOTIFS_CLOTURE[prospect.motif_cloture]?.label }}
                      </span>
                    </div>
                  </div>

                  <!-- Last contact banner -->
                  <div class="mx-4 mb-2 px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5"
                    :class="getLastContact(prospect) ? 'bg-stone-50' : 'bg-stone-50/50'"
                  >
                    <template v-if="getLastContact(prospect)">
                      <UIcon :name="CONTACT_CANAUX[getLastContact(prospect)!.canal]?.icon || 'i-lucide-phone'" class="size-3 text-stone-400" />
                      <span class="text-stone-600 font-medium">{{ timeAgo(getLastContact(prospect)!.date_contact) }}</span>
                      <span
                        class="font-semibold"
                        :class="{
                          'text-emerald-600': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'green',
                          'text-red-500': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'red',
                          'text-amber-600': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'yellow' || CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'orange',
                          'text-stone-500': !['green','red','yellow','orange'].includes(CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color || '')
                        }"
                      >{{ CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.label }}</span>
                      <span v-if="prospect.nb_contacts > 1" class="text-stone-300 ml-auto tabular-nums">{{ prospect.nb_contacts }}x</span>
                    </template>
                    <template v-else>
                      <UIcon name="i-lucide-circle-dashed" class="size-3 text-stone-300" />
                      <span class="text-stone-400">Jamais contacte</span>
                    </template>
                  </div>
                </NuxtLink>

                <!-- Actions -->
                <div class="flex items-center gap-1.5 px-3 pb-3">
                  <!-- Call button -->
                  <a
                    v-if="prospect.telephone"
                    :href="`tel:${prospect.telephone}`"
                    class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold tracking-wide bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-colors tabular-nums flex-1 justify-center select-all"
                    @click.stop
                  >
                    <UIcon name="i-lucide-phone" class="size-4" />
                    {{ prospect.telephone }}
                  </a>
                  <span v-else class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-stone-300 bg-stone-50 flex-1 justify-center">
                    <UIcon name="i-lucide-phone-off" class="size-3.5" />
                    Pas de numero
                  </span>

                  <!-- Quick log -->
                  <button
                    class="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                    :class="loggingId === prospect.id
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
                    @click="openQuickLog(prospect.id)"
                  >
                    <UIcon name="i-lucide-plus" class="size-3.5" />
                    Log
                  </button>

                  <!-- Detail -->
                  <NuxtLink
                    :to="`/prospection/${prospect.id}`"
                    class="flex items-center px-2 py-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <UIcon name="i-lucide-arrow-right" class="size-4" />
                  </NuxtLink>
                </div>

                <!-- Quick log expanded -->
                <div v-if="loggingId === prospect.id" class="border-t border-stone-100 px-3 py-2.5 bg-stone-50/60">
                  <div class="flex items-center gap-2">
                    <USelect v-model="quickLog.canal" :items="canalOptions" value-key="value" size="xs" class="w-28" />
                    <USelect v-model="quickLog.resultat" :items="resultatOptions" value-key="value" size="xs" class="flex-1" />
                    <UButton label="OK" size="xs" @click="submitQuickLog(prospect)" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="showPagination" class="flex items-center justify-center gap-3 pt-4 pb-2">
              <UButton icon="i-lucide-chevron-left" size="xs" color="neutral" variant="ghost" :disabled="page <= 1" @click="prev" />
              <span class="text-xs text-stone-500 tabular-nums">{{ page }} / {{ totalPages }}</span>
              <UButton icon="i-lucide-chevron-right" size="xs" color="neutral" variant="ghost" :disabled="page >= totalPages" @click="next" />
            </div>
          </div>
        </template>
      </div>
    </template>

    <!-- Quota modal -->
    <UModal :open="showQuotaModal" @update:open="showQuotaModal = $event">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-stone-900">Objectif de prospection</h3>
          <p class="text-sm text-stone-500">
            Fixez un nombre de contacts par jour ouvre.
            L'objectif hebdomadaire sera calcule automatiquement (x5 jours).
          </p>
          <UFormField label="Contacts par jour">
            <UInput v-model.number="quotaInput" type="number" :min="0" :max="100" placeholder="Ex: 5" icon="i-lucide-target" />
          </UFormField>
          <p v-if="quotaInput && quotaInput > 0" class="text-xs text-stone-500">
            = <strong>{{ Math.ceil(quotaInput / 2) }}</strong> par demi-journee,
            <strong>{{ quotaInput * 5 }}</strong> par semaine
          </p>
          <div class="flex justify-end gap-2 pt-2">
            <UButton v-if="hasQuota" label="Desactiver" color="error" variant="ghost" size="sm" @click="quotaInput = null; saveQuota()" :loading="quotaSaving" />
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showQuotaModal = false" />
            <UButton label="Enregistrer" icon="i-lucide-check" :loading="quotaSaving" @click="saveQuota" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
