<script setup lang="ts">
import { updateMe } from '@directus/sdk'
import type { Prospect, ProspectStatut, ContactCanal, ContactResultat } from '~/utils/types'
import { PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS } from '~/utils/constants'
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

const search = ref('')
const filterStatut = ref<ProspectStatut | 'all'>('all')

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
      const matchesSearch = !q || [p.nom_entreprise, p.contact_nom, p.telephone].some(f => f?.toLowerCase().includes(q))
      const matchesStatus = filterStatut.value === 'all' || p.statut === filterStatut.value
      return matchesSearch && matchesStatus
    }),
    prospectAccessor
  )
})

const { paginatedItems: pagedProspects, page, totalPages, showPagination, next, prev } = usePagination(filteredProspects, 50)

const hasFilters = computed(() => !!search.value || filterStatut.value !== 'all')

function clearFilters() {
  search.value = ''
  filterStatut.value = 'all'
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

const statusBorder: Record<string, string> = {
  a_contacter: 'border-l-stone-400',
  premier_contact: 'border-l-blue-500',
  en_discussion: 'border-l-amber-500',
  client: 'border-l-emerald-500',
  cloture: 'border-l-stone-300'
}

function exportCsv() {
  const data = filteredProspects.value
  if (!data.length) return
  const rows = data.map(p => ({
    'Entreprise': p.nom_entreprise,
    'Ville': p.ville,
    'Contact': p.contact_nom || '',
    'Telephone': p.telephone || '',
    'Email': p.email || '',
    'Statut': PROSPECT_STATUTS[p.statut]?.label || p.statut,
    'Nb contacts': p.nb_contacts || 0,
    'Date creation': p.date_created?.split('T')[0] || ''
  }))
  downloadCsv(rows, `prospects_${new Date().toISOString().split('T')[0]}.csv`)
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
          <UButton icon="i-lucide-download" color="neutral" variant="ghost" size="sm" :disabled="!filteredProspects.length" @click="exportCsv" />
          <UButton label="Nouveau" icon="i-lucide-plus" size="sm" to="/prospection/nouveau" />
        </template>
      </PageHeader>

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
                Tous <span class="opacity-60 tabular-nums">{{ prospects?.length || 0 }}</span>
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
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              <div
                v-for="prospect in pagedProspects"
                :key="prospect.id"
                class="rounded-xl bg-white/60 shadow-sm border border-white/70 overflow-hidden border-l-[3px] transition-all"
                :class="[
                  statusBorder[prospect.statut] || 'border-l-transparent',
                  prospect.statut === 'cloture' ? 'opacity-40' : ''
                ]"
              >
                <!-- Main row -->
                <NuxtLink :to="`/prospection/${prospect.id}`" class="block px-3.5 pt-3 pb-2 group">
                  <div class="flex items-start justify-between gap-2 mb-1.5">
                    <div class="min-w-0">
                      <h3 class="text-sm font-semibold text-stone-800 truncate group-hover:text-[#af8f3c] transition-colors">
                        {{ prospect.nom_entreprise }}
                      </h3>
                      <p v-if="prospect.contact_nom" class="text-xs text-stone-500 truncate">{{ prospect.contact_nom }}</p>
                    </div>
                    <UBadge
                      :color="(PROSPECT_STATUTS[prospect.statut]?.color as any)"
                      variant="subtle"
                      size="xs"
                      class="shrink-0"
                    >
                      {{ PROSPECT_STATUTS[prospect.statut]?.label }}
                    </UBadge>
                  </div>

                  <!-- Last contact -->
                  <div class="flex items-center gap-1.5 text-[11px]" :class="getLastContact(prospect) ? 'text-stone-500' : 'text-stone-300'">
                    <template v-if="getLastContact(prospect)">
                      <UIcon :name="CONTACT_CANAUX[getLastContact(prospect)!.canal]?.icon || 'i-lucide-phone'" class="size-3" />
                      <span>{{ timeAgo(getLastContact(prospect)!.date_contact) }}</span>
                      <span class="text-stone-300">-</span>
                      <span :class="{
                        'text-emerald-600': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'green',
                        'text-red-500': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'red',
                        'text-amber-600': CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'yellow' || CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.color === 'orange'
                      }">
                        {{ CONTACT_RESULTATS[getLastContact(prospect)!.resultat]?.label }}
                      </span>
                      <span v-if="prospect.nb_contacts > 1" class="text-stone-300 ml-auto tabular-nums">{{ prospect.nb_contacts }} au total</span>
                    </template>
                    <template v-else>
                      <UIcon name="i-lucide-circle-dashed" class="size-3" />
                      Jamais contacte
                    </template>
                  </div>
                </NuxtLink>

                <!-- Action bar -->
                <div class="flex items-center gap-1 px-2.5 pb-2.5 pt-1">
                  <!-- Phone button -->
                  <a
                    v-if="prospect.telephone"
                    :href="`tel:${prospect.telephone}`"
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/8 text-primary hover:bg-primary/15 transition-colors tabular-nums"
                    @click.stop
                  >
                    <UIcon name="i-lucide-phone" class="size-3.5" />
                    {{ prospect.telephone }}
                  </a>
                  <span v-else class="text-[11px] text-stone-300 px-1">Pas de numero</span>

                  <div class="flex-1" />

                  <!-- Quick log -->
                  <button
                    class="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    :class="loggingId === prospect.id
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'"
                    @click="openQuickLog(prospect.id)"
                  >
                    <UIcon name="i-lucide-plus" class="size-3.5" />
                    Contact
                  </button>

                  <!-- Detail link -->
                  <NuxtLink
                    :to="`/prospection/${prospect.id}`"
                    class="flex items-center px-1.5 py-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <UIcon name="i-lucide-chevron-right" class="size-4" />
                  </NuxtLink>
                </div>

                <!-- Quick log form (inline, expandable) -->
                <div v-if="loggingId === prospect.id" class="border-t border-stone-100 px-3 py-2.5 bg-stone-50/50">
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
