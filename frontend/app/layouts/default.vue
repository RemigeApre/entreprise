<script setup lang="ts">
const { user, logout, isDirecteur, roleName } = useAuth()
const colorMode = useColorMode()
const sidebarOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { sidebarOpen.value = false })

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

const mainNav = [
  { label: 'Tableau de bord', icon: 'i-lucide-layout-dashboard', to: '/dashboard' }
]

const rhNav = computed(() => {
  const items = [
    { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/planning' },
    { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' }
  ]
  if (isDirecteur.value) {
    items.push(
      { label: 'Offres d\'emploi', icon: 'i-lucide-megaphone', to: '/offres' }
    )
  }
  return items
})

const projetNav = [
  { label: 'Liste projets', icon: 'i-lucide-folder-kanban', to: '/projets' },
  { label: 'Incidents', icon: 'i-lucide-ticket', to: '/projets/tickets', disabled: true },
  { label: 'Etat des sites', icon: 'i-lucide-activity', to: '/projets/status', disabled: true }
]

const clientNav = [
  { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
  { label: 'Liste clients', icon: 'i-lucide-building', to: '/clients', disabled: true }
]

const resourceNav = [
  { label: 'Wiki interne', icon: 'i-lucide-book-open', to: '/wiki' }
]

const userDisplayName = computed(() => {
  if (!user.value) return ''
  const { first_name, last_name, email } = user.value
  if (first_name || last_name) {
    return [first_name, last_name].filter(Boolean).join(' ')
  }
  return email
})

const userMenuItems = [
  [{
    label: 'Mon profil',
    icon: 'i-lucide-user',
    to: '/profil'
  }],
  [{
    label: 'Se deconnecter',
    icon: 'i-lucide-log-out',
    click: () => logout()
  }]
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar v-model:open="sidebarOpen">
      <template #header>
        <NuxtLink to="/dashboard" class="flex items-center gap-2 px-1">
          <img src="/logo.svg" alt="Le Geai" class="size-7" />
          <span class="font-heading font-bold text-lg tracking-tight">Le Geai</span>
        </NuxtLink>
      </template>

      <UNavigationMenu :items="mainNav" orientation="vertical" />

      <div class="mt-5">
        <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">RH</p>
        <UNavigationMenu :items="rhNav" orientation="vertical" />
      </div>

      <div class="mt-5">
        <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">Projets</p>
        <UNavigationMenu :items="projetNav" orientation="vertical" />
      </div>

      <div v-if="roleName !== 'Stagiaire'" class="mt-5">
        <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">Clients</p>
        <UNavigationMenu :items="clientNav" orientation="vertical" />
      </div>

      <div class="mt-5">
        <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">Ressources</p>
        <UNavigationMenu :items="resourceNav" orientation="vertical" />
      </div>

      <template #footer>
        <div class="mb-2 px-1">
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="isDark = !isDark"
          />
        </div>
        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            class="w-full justify-start"
            :label="userDisplayName"
            icon="i-lucide-circle-user"
            trailing-icon="i-lucide-chevrons-up-down"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel class="bg-watermark">
      <!-- Mobile sidebar toggle -->
      <div class="fixed top-3 left-3 z-50 lg:hidden">
        <button
          class="flex items-center justify-center size-10 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm active:scale-95 transition-transform"
          @click="sidebarOpen = true"
        >
          <UIcon name="i-lucide-menu" class="size-5 text-stone-700 dark:text-stone-300" />
        </button>
      </div>
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
