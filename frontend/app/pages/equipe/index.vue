<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { user, isDirecteur } = useAuth()
const { getActiveUsers, getAllUsers } = useUsers()

const { data: users, status } = useAsyncData('team', () =>
  isDirecteur.value ? getAllUsers() : getActiveUsers()
)

const search = ref('')
const groupBy = ref<'contrat' | 'pole'>('contrat')
const showInactive = ref(false)

// --- Filtrage ---
const activeUsers = computed(() => {
  if (!users.value) return []
  let result = users.value.filter((u: UserProfile) => u.actif)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((u: UserProfile) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
      return name.includes(q) || u.email.toLowerCase().includes(q)
    })
  }
  return result
})

const inactiveUsers = computed(() => {
  if (!users.value || !isDirecteur.value) return []
  let result = users.value.filter((u: UserProfile) => !u.actif)
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((u: UserProfile) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
      return name.includes(q) || u.email.toLowerCase().includes(q)
    })
  }
  return result
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
  if (!users.value) return { total: 0, actifs: 0, inactifs: 0 }
  const total = users.value.length
  const actifs = users.value.filter((u: UserProfile) => u.actif).length
  return { total, actifs, inactifs: total - actifs }
})

// --- Helpers ---
function getUserName(u: UserProfile) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

function getRoleName(u: UserProfile) {
  if (typeof u.role === 'string') return ''
  return u.role.name
}

function getCategoryName(u: UserProfile) {
  if (!u.categorie || typeof u.categorie === 'string') return null
  return u.categorie.nom
}

function getRoleColor(name: string) {
  const colors: Record<string, string> = {
    Directeur: 'red',
    Employe: 'blue',
    Freelance: 'orange',
    Alternant: 'purple',
    Stagiaire: 'yellow'
  }
  return colors[name] || 'neutral'
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
                <div class="flex items-center gap-1.5 mt-0.5">
                  <UBadge :color="getRoleColor(getRoleName(myCard))" variant="subtle" size="xs">
                    {{ getRoleName(myCard) }}
                  </UBadge>
                  <UBadge v-if="getCategoryName(myCard)" variant="outline" color="neutral" size="xs">
                    {{ getCategoryName(myCard) }}
                  </UBadge>
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
                      <div class="flex items-center gap-1.5 mt-0.5">
                        <UBadge :color="getRoleColor(getRoleName(member))" variant="subtle" size="xs">
                          {{ getRoleName(member) }}
                        </UBadge>
                        <UBadge v-if="getCategoryName(member) && groupBy !== 'pole'" variant="outline" color="neutral" size="xs">
                          {{ getCategoryName(member) }}
                        </UBadge>
                        <UBadge v-if="member.type_contrat && groupBy !== 'contrat'" variant="outline" color="neutral" size="xs">
                          {{ member.type_contrat }}
                        </UBadge>
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
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <UBadge :color="getRoleColor(getRoleName(member))" variant="subtle" size="xs">
                        {{ getRoleName(member) }}
                      </UBadge>
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
