<script setup lang="ts">
import { updateMe } from '@directus/sdk'
import type { Prospect, ProspectStatut } from '~/utils/types'
import { PROSPECT_STATUTS } from '~/utils/constants'
import { downloadCsv } from '~/utils/csv'

const { user, isProspecteur, fetchCurrentUser } = useAuth()
const { $directus } = useNuxtApp()
const { getAll } = useProspects()
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

const { data: prospects, status } = useAsyncData('prospects', getAll)

const search = ref('')
const filterStatut = ref<ProspectStatut | 'all'>('all')
const filterVille = ref('all')

const villeOptions = computed(() => {
  if (!prospects.value) return [{ label: 'Toutes les villes', value: 'all' }]
  const villes = [...new Set(prospects.value.map((p: Prospect) => p.ville).filter(Boolean))].sort()
  return [{ label: 'Toutes les villes', value: 'all' }, ...villes.map(v => ({ label: v, value: v }))]
})

// Sort
const { sort, toggleSort, sortItems } = useListSort<Prospect>('date_created', 'desc')

const sortProspectOptions = [
  { label: 'Date', key: 'date_created' },
  { label: 'Entreprise', key: 'nom_entreprise' },
  { label: 'Ville', key: 'ville' },
  { label: 'Statut', key: 'statut' },
  { label: 'Contacts', key: 'nb_contacts' }
]

function prospectAccessor(p: Prospect, key: string): string | number | null {
  return (p as any)[key] ?? null
}

const filteredProspects = computed(() => {
  if (!prospects.value) return []
  const filtered = prospects.value.filter((p: Prospect) => {
    const q = search.value.toLowerCase()
    const matchesSearch = !q || [
      p.nom_entreprise, p.secteur, p.ville, p.contact_nom, p.email, p.telephone,
      getProspecteurName(p)
    ].some(field => field?.toLowerCase().includes(q))
    const matchesStatus = filterStatut.value === 'all' || p.statut === filterStatut.value
    const matchesVille = filterVille.value === 'all' || p.ville === filterVille.value
    return matchesSearch && matchesStatus && matchesVille
  })
  return sortItems(filtered, prospectAccessor)
})

const { paginatedItems: pagedProspects, page, totalPages, showPagination, next, prev } = usePagination(filteredProspects, 24)

const hasFilters = computed(() => !!search.value || filterStatut.value !== 'all' || filterVille.value !== 'all')

function clearFilters() {
  search.value = ''
  filterStatut.value = 'all'
  filterVille.value = 'all'
}

const stats = computed(() => {
  if (!prospects.value) return { total: 0 }
  return { total: prospects.value.length }
})

function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return ''
  const { first_name, last_name } = p.prospecteur
  return [first_name, last_name].filter(Boolean).join(' ')
}

function formatDateFr(date: string | null) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function exportCsv() {
  const data = filteredProspects.value
  if (!data.length) return
  const rows = data.map(p => ({
    'Entreprise': p.nom_entreprise,
    'Ville': p.ville,
    'Secteur': p.secteur || '',
    'Contact': p.contact_nom || '',
    'Telephone': p.telephone || '',
    'Email': p.email || '',
    'Site web': p.site_web || '',
    'Statut': PROSPECT_STATUTS[p.statut]?.label || p.statut,
    'Nb contacts': p.nb_contacts || 0,
    'Prospecteur': getProspecteurName(p),
    'Notes': p.notes || '',
    'Date creation': p.date_created?.split('T')[0] || ''
  }))
  downloadCsv(rows, `prospects_${new Date().toISOString().split('T')[0]}.csv`)
}

// Load quota on mount
if (import.meta.client) {
  onMounted(loadWeekContacts)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Opt-in screen for non-prospecteurs -->
    <template v-if="!isProspecteur">
      <PageHeader title="Prospection" />
      <div class="flex-1 overflow-y-auto p-4 sm:p-6">
        <div class="max-w-lg mx-auto text-center py-16">
          <div class="inline-flex items-center justify-center size-16 rounded-full bg-[rgba(175,143,60,0.08)] mb-6">
            <UIcon name="i-lucide-target" class="size-8 text-[#af8f3c]" />
          </div>
          <h2 class="text-lg font-semibold text-stone-900 mb-3">
            Prospection
          </h2>
          <p class="text-sm text-stone-600 leading-relaxed mb-6">
            La prospection, c'est rechercher des clients pour l'entreprise.
            Que ce soit pour nos services informatiques
            (<span class="font-medium">legeai-informatique.fr</span>)
            ou pour nos livres et produits derives.
          </p>
          <p class="text-sm text-stone-600 mb-8">
            Si vous souhaitez participer a la prospection, cliquez sur le bouton ci-dessous.
            Vous pourrez creer des fiches de prospection et consulter celles des autres.
          </p>
          <UButton
            label="Oui, je veux participer"
            icon="i-lucide-check"
            size="lg"
            :loading="optingIn"
            @click="handleOptIn"
          />
        </div>
      </div>
    </template>

    <!-- Normal prospection view -->
    <template v-else>
      <PageHeader>
        <template #left>
          <!-- Quota compact -->
          <button
            v-if="hasQuota && !quotaLoading"
            class="flex items-center gap-2 text-xs tabular-nums cursor-pointer hover:opacity-80 transition-opacity"
            @click="openQuotaModal"
          >
            <span class="font-semibold" :class="todayContacts >= objectifJour! ? 'text-emerald-600' : 'text-stone-700'">
              {{ todayContacts }}/{{ objectifJour }}
            </span>
            <span class="text-stone-400">aujourd'hui</span>
            <span class="text-stone-300">|</span>
            <span class="font-semibold" :class="weekContacts >= objectifSemaine! ? 'text-emerald-600' : 'text-stone-700'">
              {{ weekContacts }}/{{ objectifSemaine }}
            </span>
            <span class="text-stone-400">semaine</span>
          </button>
          <UButton
            v-else-if="!hasQuota"
            label="Objectif"
            icon="i-lucide-target"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="openQuotaModal"
          />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-download"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="!filteredProspects.length"
            @click="exportCsv"
          />
          <UButton
            label="Nouveau prospect"
            icon="i-lucide-plus"
            size="sm"
            to="/prospection/nouveau"
          />
        </template>
      </PageHeader>

      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        </div>

        <template v-else>
          <!-- Status filter pills -->
          <div v-if="prospects && prospects.length" class="flex flex-wrap items-center gap-1.5">
            <button
              class="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterStatut === 'all'
                ? 'bg-stone-800 text-white'
                : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterStatut = 'all'"
            >
              Tous
              <span class="ml-0.5 opacity-60">{{ stats.total }}</span>
            </button>
            <button
              v-for="(config, key) in PROSPECT_STATUTS"
              :key="key"
              class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              :class="filterStatut === key
                ? 'bg-stone-800 text-white'
                : 'text-stone-500 hover:bg-stone-200/60'"
              @click="filterStatut = filterStatut === key ? 'all' : (key as ProspectStatut)"
            >
              <UIcon :name="config.icon" class="size-3" />
              {{ config.label }}
            </button>
          </div>

          <!-- Search + ville filter -->
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              placeholder="Rechercher..."
              icon="i-lucide-search"
              size="sm"
              class="w-full sm:w-52"
            />
            <USelect v-model="filterVille" :items="villeOptions" value-key="value" size="sm" class="w-[calc(50%-4px)] sm:w-44" />
            <UButton
              v-if="hasFilters"
              label="Effacer"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="clearFilters"
            />
            <span v-if="hasFilters" class="text-xs text-stone-500 ml-1">
              {{ filteredProspects.length }} resultat{{ filteredProspects.length > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Sort -->
          <div v-if="filteredProspects.length" class="flex items-center gap-1 text-xs">
            <span class="text-stone-400 mr-1">Trier :</span>
            <button
              v-for="opt in sortProspectOptions"
              :key="opt.key"
              class="px-2 py-1 rounded transition-colors"
              :class="sort.key === opt.key ? 'text-primary font-semibold bg-primary/10' : 'text-stone-400 hover:text-stone-600'"
              @click="toggleSort(opt.key)"
            >
              {{ opt.label }}
              <span v-if="sort.key === opt.key">{{ sort.dir === 'asc' ? '&uarr;' : '&darr;' }}</span>
            </button>
          </div>

          <!-- Empty -->
          <div v-if="!filteredProspects.length" class="text-center py-12">
            <UIcon name="i-lucide-target" class="size-10 text-stone-300 mx-auto mb-3" />
            <p class="text-stone-500">
              {{ hasFilters ? 'Aucun prospect pour ces filtres' : 'Aucun prospect' }}
            </p>
            <UButton
              v-if="hasFilters"
              label="Effacer les filtres"
              icon="i-lucide-x"
              variant="subtle"
              class="mt-3"
              @click="clearFilters"
            />
            <UButton
              v-else
              label="Creer un prospect"
              icon="i-lucide-plus"
              class="mt-4"
              to="/prospection/nouveau"
            />
          </div>

          <!-- Cards -->
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
            <NuxtLink
              v-for="prospect in pagedProspects"
              :key="prospect.id"
              :to="`/prospection/${prospect.id}`"
              class="block group"
            >
              <div
                class="relative flex items-center gap-3 rounded-lg border-l-[3px] bg-white/60 shadow-sm px-3.5 py-3 transition-all hover:shadow-md hover:bg-white/80 border border-white/80"
                :class="{
                  'border-l-stone-400': prospect.statut === 'a_contacter',
                  'border-l-blue-500': prospect.statut === 'premier_contact',
                  'border-l-amber-500': prospect.statut === 'en_discussion',
                  'border-l-emerald-500': prospect.statut === 'client',
                  'border-l-stone-300 opacity-50': prospect.statut === 'cloture'
                }"
              >
                <!-- Center: info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-semibold text-[#2c2419] truncate group-hover:text-[#af8f3c] transition-colors">
                      {{ prospect.nom_entreprise }}
                    </h3>
                    <span class="text-[11px] text-stone-400 shrink-0">{{ prospect.ville }}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                    <span v-if="prospect.contact_nom" class="truncate">{{ prospect.contact_nom }}</span>
                    <span v-if="prospect.telephone" class="flex items-center gap-0.5 shrink-0 font-medium tabular-nums">
                      <UIcon name="i-lucide-phone" class="size-2.5" />
                      {{ prospect.telephone }}
                    </span>
                    <span v-if="prospect.nb_contacts" class="shrink-0 text-stone-400">
                      {{ prospect.nb_contacts }} contact{{ prospect.nb_contacts > 1 ? 's' : '' }}
                    </span>
                  </div>
                </div>

                <!-- Right: date -->
                <span class="text-[10px] text-stone-400 shrink-0">{{ formatDateFr(prospect.date_created) }}</span>
              </div>
            </NuxtLink>
          </div>

          <!-- Pagination -->
          <div v-if="showPagination" class="flex items-center justify-center gap-2 pt-4">
            <UButton icon="i-lucide-chevron-left" size="xs" color="neutral" variant="ghost" :disabled="page <= 1" @click="prev" />
            <span class="text-xs text-stone-500 tabular-nums">{{ page }} / {{ totalPages }}</span>
            <UButton icon="i-lucide-chevron-right" size="xs" color="neutral" variant="ghost" :disabled="page >= totalPages" @click="next" />
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
