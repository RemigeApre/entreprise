<script setup lang="ts">
import { updateMe } from '@directus/sdk'
import type { Prospect, ProspectStatut } from '~/utils/types'
import { PROSPECT_STATUTS } from '~/utils/constants'

const { user, isProspecteur, fetchCurrentUser } = useAuth()
const { $directus } = useNuxtApp()
const { getAll } = useProspects()
const toast = useToast()

const optingIn = ref(false)

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
const filterStatut = ref<ProspectStatut | ''>('')
const filterVille = ref('')

const statutOptions = [
  { label: 'Tous les statuts', value: '' },
  ...Object.entries(PROSPECT_STATUTS).map(([value, config]) => ({ label: config.label, value }))
]

const villeOptions = computed(() => {
  if (!prospects.value) return [{ label: 'Toutes les villes', value: '' }]
  const villes = [...new Set(prospects.value.map((p: Prospect) => p.ville).filter(Boolean))].sort()
  return [{ label: 'Toutes les villes', value: '' }, ...villes.map(v => ({ label: v, value: v }))]
})

const filteredProspects = computed(() => {
  if (!prospects.value) return []
  return prospects.value.filter((p: Prospect) => {
    const q = search.value.toLowerCase()
    const matchesSearch = !q || [
      p.nom_entreprise, p.secteur, p.ville, p.contact_nom, p.email, p.telephone,
      getProspecteurName(p)
    ].some(field => field?.toLowerCase().includes(q))
    const matchesStatus = !filterStatut.value || p.statut === filterStatut.value
    const matchesVille = !filterVille.value || p.ville === filterVille.value
    return matchesSearch && matchesStatus && matchesVille
  })
})

const hasFilters = computed(() => !!search.value || !!filterStatut.value || !!filterVille.value)

function clearFilters() {
  search.value = ''
  filterStatut.value = ''
  filterVille.value = ''
}

const stats = computed(() => {
  if (!prospects.value) return { total: 0, a_contacter: 0, en_discussion: 0, clients: 0 }
  const all = prospects.value
  return {
    total: all.length,
    a_contacter: all.filter((p: Prospect) => p.statut === 'a_contacter').length,
    en_discussion: all.filter((p: Prospect) => p.statut === 'premier_contact' || p.statut === 'en_discussion').length,
    clients: all.filter((p: Prospect) => p.statut === 'client').length
  }
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

function getStatutConfig(statut: ProspectStatut) {
  return PROSPECT_STATUTS[statut] || PROSPECT_STATUTS.a_contacter
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
          <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-3">
            Prospection
          </h2>
          <p class="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-6">
            La prospection, c'est rechercher des clients pour l'entreprise.
            Que ce soit pour nos services informatiques
            (<span class="font-medium">legeai-informatique.fr</span>)
            ou pour nos livres et produits derives.
          </p>
          <p class="text-sm text-stone-600 dark:text-stone-400 mb-8">
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
      <PageHeader title="Prospection">
        <template #right>
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
          <!-- Stats -->
          <div v-if="prospects && prospects.length" class="flex flex-wrap items-center gap-4 text-xs">
            <span class="text-[#2c2419]/60 dark:text-stone-400">
              <strong class="text-[#2c2419] dark:text-stone-200">{{ stats.total }}</strong> prospect{{ stats.total > 1 ? 's' : '' }}
            </span>
            <span class="flex items-center gap-1 text-stone-500 dark:text-stone-400">
              <span class="size-1.5 rounded-full bg-stone-400" />
              {{ stats.a_contacter }} a contacter
            </span>
            <span class="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span class="size-1.5 rounded-full bg-amber-500" />
              {{ stats.en_discussion }} en discussion
            </span>
            <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span class="size-1.5 rounded-full bg-emerald-500" />
              {{ stats.clients }} client{{ stats.clients > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="search"
              placeholder="Rechercher..."
              icon="i-lucide-search"
              size="sm"
              class="w-52"
            />
            <USelect v-model="filterVille" :items="villeOptions" value-key="value" size="sm" class="w-44" />
            <USelect v-model="filterStatut" :items="statutOptions" value-key="value" size="sm" class="w-40" />
            <UButton
              v-if="hasFilters"
              label="Effacer"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="clearFilters"
            />
            <span v-if="hasFilters" class="text-xs text-stone-400 dark:text-stone-500 ml-1">
              {{ filteredProspects.length }} resultat{{ filteredProspects.length > 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Empty -->
          <div v-if="!filteredProspects.length" class="text-center py-12">
            <UIcon name="i-lucide-target" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <p class="text-stone-500 dark:text-stone-400">
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
          <div v-else class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            <NuxtLink
              v-for="prospect in filteredProspects"
              :key="prospect.id"
              :to="`/prospection/${prospect.id}`"
              class="block group"
            >
              <div
                class="relative flex flex-col gap-2.5 rounded-xl border p-4 transition-all h-full hover:border-[#af8f3c]/30 dark:hover:border-stone-600 hover:bg-[#af8f3c]/[0.03] dark:hover:bg-stone-800/30"
                :class="prospect.statut === 'client'
                  ? 'border-emerald-200/60 dark:border-emerald-800/30'
                  : prospect.statut === 'cloture'
                    ? 'border-stone-200/60 dark:border-stone-700/40 opacity-60'
                    : 'border-stone-200 dark:border-stone-700/60'"
              >
                <!-- Header -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold text-[#2c2419] dark:text-stone-100 truncate group-hover:text-[#af8f3c] dark:group-hover:text-amber-400 transition-colors">
                      {{ prospect.nom_entreprise }}
                    </h3>
                    <p v-if="prospect.contact_nom" class="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {{ prospect.contact_nom }}
                    </p>
                  </div>
                  <UBadge
                    :color="(getStatutConfig(prospect.statut).color as any)"
                    variant="subtle"
                    size="xs"
                  >
                    {{ getStatutConfig(prospect.statut).label }}
                  </UBadge>
                </div>

                <!-- Info -->
                <div class="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <span class="flex items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3" />
                    {{ prospect.ville }}
                  </span>
                  <span v-if="prospect.secteur" class="flex items-center gap-1">
                    <UIcon name="i-lucide-briefcase" class="size-3" />
                    {{ prospect.secteur }}
                  </span>
                  <span v-if="prospect.telephone" class="flex items-center gap-1">
                    <UIcon name="i-lucide-phone" class="size-3" />
                    {{ prospect.telephone }}
                  </span>
                </div>

                <!-- Footer -->
                <div class="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500 mt-auto pt-2 border-t border-stone-100 dark:border-stone-800">
                  <span v-if="prospect.nb_contacts" class="flex items-center gap-1">
                    <UIcon name="i-lucide-message-circle" class="size-3" />
                    {{ prospect.nb_contacts }} contact{{ prospect.nb_contacts > 1 ? 's' : '' }}
                  </span>
                  <span v-else>Aucun contact</span>
                  <div class="flex items-center gap-2">
                    <span v-if="getProspecteurName(prospect)">{{ getProspecteurName(prospect) }}</span>
                    <span>{{ formatDateFr(prospect.date_created) }}</span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
