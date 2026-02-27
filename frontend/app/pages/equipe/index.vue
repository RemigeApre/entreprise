<script setup lang="ts">
import type { UserProfile } from '~/utils/types'

const { isDirecteur } = useAuth()
const { getActiveUsers, getAllUsers, updateExistingUser } = useUsers()
const toast = useToast()

const { data: users, status, refresh } = useAsyncData('team', () =>
  isDirecteur.value ? getAllUsers() : getActiveUsers()
)

const search = ref('')
const statusFilter = ref('all')
const togglingId = ref<string | null>(null)

const statusFilterOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Actifs', value: 'active' },
  { label: 'Inactifs', value: 'inactive' }
]

const filteredUsers = computed(() => {
  if (!users.value) return []
  let result = users.value

  if (isDirecteur.value && statusFilter.value === 'active') {
    result = result.filter((u: UserProfile) => u.actif)
  } else if (isDirecteur.value && statusFilter.value === 'inactive') {
    result = result.filter((u: UserProfile) => !u.actif)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter((u: UserProfile) => {
      const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase()
      return name.includes(q) || u.email.toLowerCase().includes(q)
    })
  }

  return result
})

const userStats = computed(() => {
  if (!users.value) return { total: 0, actifs: 0, inactifs: 0 }
  const total = users.value.length
  const actifs = users.value.filter((u: UserProfile) => u.actif).length
  return { total, actifs, inactifs: total - actifs }
})

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

// Telephone visible: directeur voit tout, autres ne voient pas le tel des stagiaires
function canSeePhone(member: UserProfile) {
  if (isDirecteur.value) return true
  const role = typeof member.role === 'string' ? '' : member.role.name
  return role !== 'Stagiaire'
}

function handleClickMember(member: UserProfile) {
  if (isDirecteur.value) {
    navigateTo(`/admin/utilisateurs/${member.id}`)
  } else {
    navigateTo(`/equipe/${member.id}`)
  }
}

async function handleToggleActive(e: Event, user: UserProfile) {
  e.stopPropagation()
  togglingId.value = user.id
  try {
    await updateExistingUser(user.id, { actif: !user.actif })
    toast.add({
      title: user.actif ? 'Utilisateur desactive' : 'Utilisateur active',
      color: 'success'
    })
    refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    togglingId.value = null
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Equipe">
      <template #right>
        <div class="flex items-center gap-2">
          <UInput
            v-model="search"
            placeholder="Rechercher..."
            icon="i-lucide-search"
            class="w-48 sm:w-64"
            size="sm"
          />
          <USelectMenu
            v-if="isDirecteur"
            v-model="statusFilter"
            :items="statusFilterOptions"
            value-key="value"
            class="w-28"
            size="sm"
          />
          <UButton
            v-if="isDirecteur"
            label="Nouveau"
            icon="i-lucide-user-plus"
            size="sm"
            to="/admin/utilisateurs/nouveau"
          />
        </div>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      <!-- Stats (directeur) -->
      <div v-if="isDirecteur && users" class="flex items-center gap-6 text-sm">
        <span class="text-stone-500 dark:text-stone-400">
          <strong class="text-stone-900 dark:text-stone-100">{{ userStats.total }}</strong> membres
        </span>
        <span class="text-stone-500 dark:text-stone-400">
          <strong class="text-emerald-600 dark:text-emerald-400">{{ userStats.actifs }}</strong> actifs
        </span>
        <span v-if="userStats.inactifs" class="text-stone-500 dark:text-stone-400">
          <strong class="text-red-500">{{ userStats.inactifs }}</strong> inactifs
        </span>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="!filteredUsers.length" class="text-center py-12">
        <UIcon name="i-lucide-users" class="size-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-gray-500 dark:text-gray-400">Aucun membre trouve</p>
      </div>

      <!-- User grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="member in filteredUsers"
          :key="member.id"
          class="card-hover-warm cursor-pointer transition-opacity"
          :class="{ 'opacity-50': !member.actif }"
          @click="handleClickMember(member)"
        >
          <div class="flex items-center gap-3">
            <UAvatar
              :alt="getUserName(member)"
              size="lg"
            />
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ getUserName(member) }}
                </h3>
                <UBadge
                  v-if="isDirecteur && !member.actif"
                  color="error"
                  variant="subtle"
                  size="xs"
                >
                  Inactif
                </UBadge>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <UBadge variant="subtle" size="xs">
                  {{ getRoleName(member) }}
                </UBadge>
                <UBadge v-if="getCategoryName(member)" variant="outline" size="xs" color="neutral">
                  {{ getCategoryName(member) }}
                </UBadge>
                <UBadge v-if="isDirecteur && member.type_contrat" variant="outline" size="xs" color="neutral">
                  {{ member.type_contrat }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ member.email }}
              </p>
              <p v-if="member.telephone && canSeePhone(member)" class="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                <UIcon name="i-lucide-phone" class="size-3" />
                {{ member.telephone }}
              </p>
            </div>

            <!-- Admin actions -->
            <div v-if="isDirecteur" class="flex items-center gap-1 shrink-0">
              <UTooltip :text="member.actif ? 'Desactiver' : 'Activer'">
                <UButton
                  :icon="member.actif ? 'i-lucide-user-x' : 'i-lucide-user-check'"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  :loading="togglingId === member.id"
                  @click="handleToggleActive($event, member)"
                />
              </UTooltip>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
