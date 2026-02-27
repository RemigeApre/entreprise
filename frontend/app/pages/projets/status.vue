<script setup lang="ts">
import type { MonitoredSite, MonitoredSiteUser, UserProfile } from '~/utils/types'
import type { SiteStatus } from '~/composables/useSiteMonitor'

definePageMeta({ middleware: ['auth'] })

const { isDirecteur } = useAuth()
const { userSites, loadUserSites, checkSiteStatus, sitesLoaded, getSiteUsers, addSiteUser, removeSiteUser } = useSiteMonitor()
const { getActiveUsers } = useUsers()
const toast = useToast()

const loading = ref(true)
const statuses = ref<Map<string, SiteStatus>>(new Map())
const lastChecked = ref<Date | null>(null)
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function checkAll() {
  loading.value = true
  const results = new Map<string, SiteStatus>()
  await Promise.all(
    userSites.value.map(async (site) => {
      const status = await checkSiteStatus(site.url)
      results.set(site.id, status)
    })
  )
  statuses.value = results
  lastChecked.value = new Date()
  loading.value = false
}

function getStatus(site: MonitoredSite): SiteStatus | undefined {
  return statuses.value.get(site.id)
}

function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function formatLastChecked(): string {
  if (!lastChecked.value) return ''
  return lastChecked.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getStatusColor(status: SiteStatus | undefined): string {
  if (!status) return 'neutral'
  return status.up ? 'success' : 'error'
}

function getStatusLabel(status: SiteStatus | undefined): string {
  if (!status) return 'Verification...'
  if (status.up) return 'En ligne'
  if (status.statusCode > 0) return `Erreur ${status.statusCode}`
  return 'Hors ligne'
}

// --- Admin: user management per site ---
const showUsersModal = ref(false)
const managingSite = ref<MonitoredSite | null>(null)
const siteUsers = ref<MonitoredSiteUser[]>([])
const allUsers = ref<UserProfile[]>([])
const usersLoading = ref(false)
const addingUser = ref(false)
const selectedUserId = ref('')

function getUserName(entry: MonitoredSiteUser): string {
  const u = entry.utilisateur
  if (!u || typeof u === 'string') return u as string
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

async function openUsersModal(site: MonitoredSite) {
  managingSite.value = site
  showUsersModal.value = true
  usersLoading.value = true
  selectedUserId.value = ''
  try {
    const [users, active] = await Promise.all([
      getSiteUsers(site.id),
      allUsers.value.length ? Promise.resolve(allUsers.value) : getActiveUsers()
    ])
    siteUsers.value = users
    allUsers.value = active
  } catch {
    toast.add({ title: 'Erreur lors du chargement', color: 'error' })
  } finally {
    usersLoading.value = false
  }
}

const availableUsers = computed(() => {
  const assignedIds = new Set(
    siteUsers.value.map(su => {
      const u = su.utilisateur
      return typeof u === 'string' ? u : u.id
    })
  )
  return allUsers.value.filter(u => !assignedIds.has(u.id))
})

const userOptions = computed(() =>
  availableUsers.value.map(u => ({
    label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
    value: u.id
  }))
)

async function handleAddUser() {
  if (!managingSite.value || !selectedUserId.value) return
  addingUser.value = true
  try {
    await addSiteUser(managingSite.value.id, selectedUserId.value)
    siteUsers.value = await getSiteUsers(managingSite.value.id)
    selectedUserId.value = ''
    toast.add({ title: 'Utilisateur ajoute', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de l\'ajout', color: 'error' })
  } finally {
    addingUser.value = false
  }
}

async function handleRemoveUser(entry: MonitoredSiteUser) {
  if (!managingSite.value) return
  try {
    await removeSiteUser(entry.id)
    siteUsers.value = siteUsers.value.filter(su => su.id !== entry.id)
    toast.add({ title: 'Utilisateur retire', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

onMounted(async () => {
  if (!sitesLoaded.value) {
    await loadUserSites()
  }
  if (userSites.value.length > 0) {
    await checkAll()
    refreshInterval = setInterval(checkAll, 60000)
  } else {
    loading.value = false
  }
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold text-stone-900 dark:text-white">Etat des sites</h1>
          <p v-if="lastChecked" class="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
            Derniere verification : {{ formatLastChecked() }}
            <span class="text-stone-300 dark:text-stone-600 mx-1">&middot;</span>
            Rafraichissement automatique toutes les 60s
          </p>
        </div>
        <UButton
          label="Rafraichir"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="soft"
          size="sm"
          :loading="loading"
          @click="checkAll"
        />
      </div>

      <!-- No sites message -->
      <div v-if="sitesLoaded && !userSites.length" class="text-center py-16">
        <div class="inline-flex items-center justify-center size-16 rounded-full bg-stone-100 dark:bg-stone-800 mb-4">
          <UIcon name="i-lucide-globe" class="size-8 text-stone-400 dark:text-stone-500" />
        </div>
        <h2 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Aucun site assigne
        </h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
          Contactez un administrateur pour etre ajoute a la surveillance d'un site.
        </p>
      </div>

      <!-- Sites grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <UCard v-for="site in userSites" :key="site.id">
          <div class="space-y-3">
            <!-- Site name + status dot -->
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="text-sm font-semibold text-stone-900 dark:text-white truncate">{{ site.nom }}</h3>
                <a
                  :href="site.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-stone-400 hover:text-primary truncate block"
                >
                  {{ site.url }}
                </a>
              </div>
              <span
                class="size-3 rounded-full shrink-0 mt-1"
                :class="!getStatus(site) ? 'bg-stone-300 dark:bg-stone-600 animate-pulse'
                  : getStatus(site)!.up ? 'bg-emerald-500' : 'bg-red-500'"
              />
            </div>

            <!-- Status details -->
            <div class="flex items-center gap-3">
              <UBadge
                :color="getStatusColor(getStatus(site))"
                variant="subtle"
                size="xs"
              >
                {{ getStatusLabel(getStatus(site)) }}
              </UBadge>
              <span
                v-if="getStatus(site) && getStatus(site)!.responseTime > 0"
                class="text-xs text-stone-400 dark:text-stone-500"
              >
                {{ formatResponseTime(getStatus(site)!.responseTime) }}
              </span>
            </div>

            <!-- Stats row -->
            <div v-if="getStatus(site)" class="grid grid-cols-3 gap-3 pt-1 border-t border-stone-100 dark:border-stone-800">
              <div class="text-center">
                <p class="text-sm font-semibold text-stone-900 dark:text-white">
                  {{ getStatus(site)!.statusCode || '\u2014' }}
                </p>
                <p class="text-[10px] text-stone-400 uppercase">Code HTTP</p>
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-stone-900 dark:text-white">
                  {{ getStatus(site)!.responseTime > 0 ? formatResponseTime(getStatus(site)!.responseTime) : '\u2014' }}
                </p>
                <p class="text-[10px] text-stone-400 uppercase">Latence</p>
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="getStatus(site)!.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ getStatus(site)!.up ? 'OK' : 'KO' }}
                </p>
                <p class="text-[10px] text-stone-400 uppercase">Statut</p>
              </div>
            </div>

            <!-- Admin: manage users button -->
            <button
              v-if="isDirecteur"
              class="w-full flex items-center justify-center gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-400 hover:text-primary transition-colors cursor-pointer"
              @click="openUsersModal(site)"
            >
              <UIcon name="i-lucide-users" class="size-3.5" />
              Gerer les acces
            </button>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Admin: users management modal -->
    <UModal v-if="isDirecteur" :open="showUsersModal" @update:open="showUsersModal = $event">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
            Acces a {{ managingSite?.nom }}
          </h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 mb-4">
            Les utilisateurs ci-dessous peuvent voir le statut de ce site.
          </p>

          <!-- Loading -->
          <div v-if="usersLoading" class="flex justify-center py-4">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-primary" />
          </div>

          <template v-else>
            <!-- Current users list -->
            <div class="space-y-1.5 mb-4 max-h-48 overflow-y-auto">
              <div
                v-for="entry in siteUsers"
                :key="entry.id"
                class="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50"
              >
                <span class="text-sm text-stone-700 dark:text-stone-300">{{ getUserName(entry) }}</span>
                <button
                  class="text-stone-400 hover:text-red-500 transition-colors"
                  @click="handleRemoveUser(entry)"
                >
                  <UIcon name="i-lucide-x" class="size-4" />
                </button>
              </div>
              <p v-if="!siteUsers.length" class="text-sm text-stone-400 text-center py-2">
                Aucun utilisateur assigne
              </p>
            </div>

            <!-- Add user -->
            <div v-if="userOptions.length" class="flex gap-2">
              <div class="flex-1">
                <USelect
                  v-model="selectedUserId"
                  :items="userOptions"
                  value-key="value"
                  placeholder="Ajouter un utilisateur..."
                />
              </div>
              <UButton
                icon="i-lucide-plus"
                :disabled="!selectedUserId"
                :loading="addingUser"
                @click="handleAddUser"
              />
            </div>
            <p v-else class="text-xs text-stone-400 text-center">
              Tous les utilisateurs sont deja assignes
            </p>
          </template>

          <div class="flex justify-end mt-4">
            <UButton label="Fermer" color="neutral" variant="ghost" @click="showUsersModal = false" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
