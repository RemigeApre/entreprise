<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { user, isDirecteur } = useAuth()
const { getActiveUsers, getAllUsers } = useUsers()

const { data: users, status } = useAsyncData('team', () =>
  isDirecteur.value ? getAllUsers() : getActiveUsers()
)

const search = ref('')
const groupBy = ref<'contrat' | 'pole'>('contrat')
const showAVenir = ref(false)
const showTermine = ref(false)
const showInactive = ref(false)

function matchSearch(u: UserProfile): boolean {
  if (!search.value) return true
  const q = search.value.toLowerCase()
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
  return name.includes(q) || u.email.toLowerCase().includes(q)
}

// --- Filtrage par statut_emploi ---
const activeUsers = computed(() => {
  if (!users.value) return []
  return users.value.filter((u: UserProfile) => u.actif && (!u.statut_emploi || u.statut_emploi === 'actif') && matchSearch(u))
})

const aVenirUsers = computed(() => {
  if (!users.value || !isDirecteur.value) return []
  return users.value.filter((u: UserProfile) => u.statut_emploi === 'a_venir' && matchSearch(u))
})

const termineUsers = computed(() => {
  if (!users.value || !isDirecteur.value) return []
  return users.value.filter((u: UserProfile) => u.statut_emploi === 'termine' && matchSearch(u))
})

const inactiveUsers = computed(() => {
  if (!users.value || !isDirecteur.value) return []
  return users.value.filter((u: UserProfile) => !u.actif && u.statut_emploi !== 'a_venir' && u.statut_emploi !== 'termine' && matchSearch(u))
})

// --- Ma carte (exclue des groupes) ---
const myCard = computed(() => {
  if (!user.value || !users.value) return null
  return users.value.find((u: UserProfile) => u.id === user.value!.id) || null
})

const othersActive = computed(() => {
  if (!user.value) return activeUsers.value
  return activeUsers.value.filter((u: UserProfile) => u.id !== user.value!.id)
})

// --- Groupement par contrat ---
const CONTRACT_ORDER = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance']

const groupedByContract = computed(() => {
  const groups: { key: string; label: string; users: UserProfile[] }[] = []
  const map = new Map<string, UserProfile[]>()

  for (const u of othersActive.value) {
    const key = u.type_contrat || 'Non defini'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(u)
  }

  for (const contrat of CONTRACT_ORDER) {
    if (map.has(contrat)) {
      groups.push({ key: contrat, label: contrat, users: map.get(contrat)! })
      map.delete(contrat)
    }
  }
  for (const [key, usrs] of map) {
    groups.push({ key, label: key, users: usrs })
  }

  return groups
})

// --- Groupement par pole (avec dedup) ---
const groupedByPole = computed(() => {
  const map = new Map<string, { displayName: string; users: UserProfile[] }>()

  for (const u of othersActive.value) {
    const cat = getCategoryName(u)
    const normalizedKey = cat ? cat.trim().toLowerCase() : '_sans_pole'
    const displayName = cat?.trim() || 'Sans pole'

    if (!map.has(normalizedKey)) {
      map.set(normalizedKey, { displayName, users: [] })
    }
    map.get(normalizedKey)!.users.push(u)
  }

  const entries = Array.from(map.entries()).sort((a, b) => {
    if (a[0] === '_sans_pole') return 1
    if (b[0] === '_sans_pole') return -1
    return a[1].displayName.localeCompare(b[1].displayName, 'fr')
  })

  return entries.map(([key, val]) => ({
    key,
    label: val.displayName,
    users: val.users
  }))
})

const currentGroups = computed(() =>
  groupBy.value === 'contrat' ? groupedByContract.value : groupedByPole.value
)

// --- Stats ---
const stats = computed(() => {
  if (!users.value) return { total: 0, actifs: 0, aVenir: 0, termines: 0, inactifs: 0 }
  const total = users.value.length
  const actifs = activeUsers.value.length
  const aVenir = aVenirUsers.value.length
  const termines = termineUsers.value.length
  return { total, actifs, aVenir, termines, inactifs: inactiveUsers.value.length }
})

// --- Helpers ---
function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}

function getCategoryColor(u: UserProfile): string | null {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.couleur || null
}

const CONTRACT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CDI: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/40' },
  CDD: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/40' },
  Alternance: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800/40' },
  Stage: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/40' },
  Freelance: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/40' }
}

function getContractStyle(contrat: string | null) {
  if (!contrat) return CONTRACT_COLORS.CDI
  return CONTRACT_COLORS[contrat] || { bg: 'bg-stone-50 dark:bg-stone-800/30', text: 'text-stone-600 dark:text-stone-400', border: 'border-stone-200 dark:border-stone-700' }
}

</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Equipe">
      <template #right>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Rechercher..."
          size="sm"
          class="w-40"
        />
        <UButton
          v-if="isDirecteur"
          label="Nouveau"
          icon="i-lucide-user-plus"
          size="sm"
          to="/equipe/nouveau"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
        </div>

        <template v-else-if="users">
          <!-- Ma carte -->
          <NuxtLink
            v-if="myCard"
            :to="`/equipe/${myCard.id}`"
            class="block group"
          >
            <div class="flex items-center gap-3 p-3 rounded-lg border border-[rgba(175,143,60,0.15)] bg-[rgba(175,143,60,0.04)] hover:bg-[rgba(175,143,60,0.08)] transition-colors">
              <UAvatar :alt="getUserName(myCard)" size="md" />
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-stone-900 dark:text-white text-sm group-hover:text-primary transition-colors">
                  {{ getUserName(myCard) }}
                  <span class="text-xs font-normal text-stone-400 dark:text-stone-500 ml-1">— c'est vous</span>
                </p>
                <div class="flex items-center gap-1.5 mt-1">
                  <span
                    v-if="getCategoryName(myCard)"
                    class="text-xs font-medium"
                    :style="getCategoryColor(myCard) ? { color: getCategoryColor(myCard)! } : {}"
                    :class="!getCategoryColor(myCard) ? 'text-stone-500 dark:text-stone-400' : ''"
                  >
                    {{ getCategoryName(myCard) }}
                  </span>
                  <span v-if="getCategoryName(myCard) && myCard.type_contrat" class="text-stone-300 dark:text-stone-600 text-xs">·</span>
                  <span
                    v-if="myCard.type_contrat"
                    class="text-[11px] font-medium px-1.5 py-0.5 rounded-md border"
                    :class="[getContractStyle(myCard.type_contrat).bg, getContractStyle(myCard.type_contrat).text, getContractStyle(myCard.type_contrat).border]"
                  >
                    {{ myCard.type_contrat }}
                  </span>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-4 text-stone-300 dark:text-stone-600 group-hover:text-primary transition-colors shrink-0" />
            </div>
          </NuxtLink>

          <!-- Stats (directeur) -->
          <div v-if="isDirecteur" class="flex items-center gap-6 text-sm">
            <span class="text-stone-500 dark:text-stone-400">
              <strong class="text-stone-900 dark:text-stone-100">{{ stats.total }}</strong> membres
            </span>
            <span class="text-stone-500 dark:text-stone-400">
              <strong class="text-emerald-600 dark:text-emerald-400">{{ stats.actifs }}</strong> actifs
            </span>
            <span v-if="stats.aVenir" class="text-stone-500 dark:text-stone-400">
              <strong class="text-blue-500">{{ stats.aVenir }}</strong> a venir
            </span>
            <span v-if="stats.termines" class="text-stone-500 dark:text-stone-400">
              <strong class="text-stone-400">{{ stats.termines }}</strong> termines
            </span>
            <span v-if="stats.inactifs" class="text-stone-500 dark:text-stone-400">
              <strong class="text-red-500">{{ stats.inactifs }}</strong> inactifs
            </span>
          </div>

          <!-- Toggle groupement -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider font-semibold">Trier par</span>
            <div class="flex rounded-lg border border-[rgba(175,143,60,0.12)] overflow-hidden">
              <button
                class="px-3 py-1 text-xs font-medium transition-colors"
                :class="groupBy === 'contrat'
                  ? 'bg-[#af8f3c] text-white'
                  : 'text-[#2c2419]/50 dark:text-[#e8e0d0]/50 hover:bg-[rgba(175,143,60,0.06)]'"
                @click="groupBy = 'contrat'"
              >
                Contrat
              </button>
              <button
                class="px-3 py-1 text-xs font-medium transition-colors"
                :class="groupBy === 'pole'
                  ? 'bg-[#af8f3c] text-white'
                  : 'text-[#2c2419]/50 dark:text-[#e8e0d0]/50 hover:bg-[rgba(175,143,60,0.06)]'"
                @click="groupBy = 'pole'"
              >
                Pole
              </button>
            </div>
          </div>

          <!-- Groupes actifs -->
          <div v-if="currentGroups.length" class="space-y-6">
            <div v-for="group in currentGroups" :key="group.key">
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-sm font-semibold text-stone-700 dark:text-stone-300">{{ group.label }}</h3>
                <span class="text-xs text-stone-400 dark:text-stone-600">{{ group.users.length }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <NuxtLink
                  v-for="member in group.users"
                  :key="member.id"
                  :to="`/equipe/${member.id}`"
                  class="group"
                >
                  <div class="flex items-center gap-3 p-3 rounded-lg border border-[rgba(175,143,60,0.08)] hover:border-[rgba(175,143,60,0.2)] hover:bg-[rgba(175,143,60,0.04)] dark:hover:bg-[rgba(175,143,60,0.04)] transition-colors">
                    <UAvatar :alt="getUserName(member)" size="md" />
                    <div class="min-w-0 flex-1">
                      <p class="font-medium text-sm text-stone-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {{ getUserName(member) }}
                      </p>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span
                          v-if="getCategoryName(member) && groupBy !== 'pole'"
                          class="text-xs font-medium"
                          :style="getCategoryColor(member) ? { color: getCategoryColor(member)! } : {}"
                          :class="!getCategoryColor(member) ? 'text-stone-500 dark:text-stone-400' : ''"
                        >
                          {{ getCategoryName(member) }}
                        </span>
                        <span v-if="getCategoryName(member) && groupBy !== 'pole' && member.type_contrat && groupBy !== 'contrat'" class="text-stone-300 dark:text-stone-600 text-xs">·</span>
                        <span
                          v-if="member.type_contrat && groupBy !== 'contrat'"
                          class="text-[11px] font-medium px-1.5 py-0.5 rounded-md border"
                          :class="[getContractStyle(member.type_contrat).bg, getContractStyle(member.type_contrat).text, getContractStyle(member.type_contrat).border]"
                        >
                          {{ member.type_contrat }}
                        </span>
                      </div>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Aucun resultat -->
          <div v-else-if="search" class="text-center py-8">
            <UIcon name="i-lucide-search-x" class="size-8 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <p class="text-stone-500 dark:text-stone-400 text-sm">Aucun membre ne correspond a "{{ search }}"</p>
          </div>

          <!-- Section A venir (directeur) -->
          <div v-if="isDirecteur && aVenirUsers.length" class="pt-2">
            <button
              class="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
              @click="showAVenir = !showAVenir"
            >
              <UIcon
                name="i-lucide-chevron-right"
                class="size-4 transition-transform"
                :class="showAVenir ? 'rotate-90' : ''"
              />
              <UIcon name="i-lucide-clock" class="size-4" />
              A venir
              <span class="text-xs text-blue-400 dark:text-blue-600">({{ aVenirUsers.length }})</span>
            </button>

            <div v-if="showAVenir" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink
                v-for="member in aVenirUsers"
                :key="member.id"
                :to="`/equipe/${member.id}`"
                class="group"
              >
                <div class="flex items-center gap-3 p-3 rounded-lg border border-blue-200/40 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all">
                  <UAvatar :alt="getUserName(member)" size="md" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-sm text-stone-900 dark:text-white truncate">
                        {{ getUserName(member) }}
                      </p>
                      <UBadge color="blue" variant="subtle" size="xs">A venir</UBadge>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span
                        v-if="getCategoryName(member)"
                        class="text-xs font-medium text-stone-500 dark:text-stone-400"
                      >
                        {{ getCategoryName(member) }}
                      </span>
                      <span v-if="getCategoryName(member) && member.type_contrat" class="text-stone-300 dark:text-stone-600 text-xs">·</span>
                      <span
                        v-if="member.type_contrat"
                        class="text-[11px] font-medium px-1.5 py-0.5 rounded-md border"
                        :class="[getContractStyle(member.type_contrat).bg, getContractStyle(member.type_contrat).text, getContractStyle(member.type_contrat).border]"
                      >
                        {{ member.type_contrat }}
                      </span>
                      <span v-if="member.date_debut_contrat" class="text-[11px] text-blue-500 dark:text-blue-400">
                        debut {{ new Date(member.date_debut_contrat).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }}
                      </span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Section Termines (directeur) -->
          <div v-if="isDirecteur && termineUsers.length" class="pt-2">
            <button
              class="flex items-center gap-2 text-sm font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-3"
              @click="showTermine = !showTermine"
            >
              <UIcon
                name="i-lucide-chevron-right"
                class="size-4 transition-transform"
                :class="showTermine ? 'rotate-90' : ''"
              />
              <UIcon name="i-lucide-log-out" class="size-4" />
              Termines
              <span class="text-xs text-stone-400 dark:text-stone-600">({{ termineUsers.length }})</span>
            </button>

            <div v-if="showTermine" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink
                v-for="member in termineUsers"
                :key="member.id"
                :to="`/equipe/${member.id}`"
                class="group"
              >
                <div class="flex items-center gap-3 p-3 rounded-lg border border-[rgba(175,143,60,0.06)] opacity-60 hover:opacity-80 transition-all">
                  <UAvatar :alt="getUserName(member)" size="md" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-sm text-stone-900 dark:text-white truncate">
                        {{ getUserName(member) }}
                      </p>
                      <UBadge color="neutral" variant="subtle" size="xs">Termine</UBadge>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span
                        v-if="getCategoryName(member)"
                        class="text-xs font-medium text-stone-500 dark:text-stone-400"
                      >
                        {{ getCategoryName(member) }}
                      </span>
                      <span v-if="getCategoryName(member) && member.type_contrat" class="text-stone-300 dark:text-stone-600 text-xs">·</span>
                      <span
                        v-if="member.type_contrat"
                        class="text-[11px] font-medium px-1.5 py-0.5 rounded-md border"
                        :class="[getContractStyle(member.type_contrat).bg, getContractStyle(member.type_contrat).text, getContractStyle(member.type_contrat).border]"
                      >
                        {{ member.type_contrat }}
                      </span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- Section Inactifs (directeur) -->
          <div v-if="isDirecteur && inactiveUsers.length" class="pt-2">
            <button
              class="flex items-center gap-2 text-sm font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-3"
              @click="showInactive = !showInactive"
            >
              <UIcon
                name="i-lucide-chevron-right"
                class="size-4 transition-transform"
                :class="showInactive ? 'rotate-90' : ''"
              />
              Inactifs
              <span class="text-xs text-stone-400 dark:text-stone-600">({{ inactiveUsers.length }})</span>
            </button>

            <div v-if="showInactive" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <NuxtLink
                v-for="member in inactiveUsers"
                :key="member.id"
                :to="`/equipe/${member.id}`"
                class="group"
              >
                <div class="flex items-center gap-3 p-3 rounded-lg border border-[rgba(175,143,60,0.06)] opacity-50 hover:opacity-80 transition-all">
                  <UAvatar :alt="getUserName(member)" size="md" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="font-medium text-sm text-stone-900 dark:text-white truncate">
                        {{ getUserName(member) }}
                      </p>
                      <UBadge color="error" variant="subtle" size="xs">Inactif</UBadge>
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                      <span
                        v-if="getCategoryName(member)"
                        class="text-xs font-medium text-stone-500 dark:text-stone-400"
                      >
                        {{ getCategoryName(member) }}
                      </span>
                      <span v-if="getCategoryName(member) && member.type_contrat" class="text-stone-300 dark:text-stone-600 text-xs">·</span>
                      <span
                        v-if="member.type_contrat"
                        class="text-[11px] font-medium px-1.5 py-0.5 rounded-md border"
                        :class="[getContractStyle(member.type_contrat).bg, getContractStyle(member.type_contrat).text, getContractStyle(member.type_contrat).border]"
                      >
                        {{ member.type_contrat }}
                      </span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>
