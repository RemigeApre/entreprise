<script setup lang="ts">
const { user, logout, isDirecteur } = useAuth()
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

const mainNav = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' }
]

const rhNav = computed(() => {
  const items = [
    { label: 'Planning', icon: 'i-lucide-calendar', to: '/planning' },
    { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' }
  ]
  if (isDirecteur.value) {
    items.push(
      { label: 'Offres d\'emploi', icon: 'i-lucide-megaphone', to: '/offres' },
      { label: 'Utilisateurs', icon: 'i-lucide-shield-check', to: '/admin/utilisateurs' }
    )
  }
  return items
})

const projetNav = [
  { label: 'Liste projets', icon: 'i-lucide-folder-kanban', to: '/projets' },
  { label: 'Tickets', icon: 'i-lucide-ticket', to: '/projets/tickets', disabled: true },
  { label: 'Status sites', icon: 'i-lucide-activity', to: '/projets/status', disabled: true }
]

const clientNav = [
  { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
  { label: 'Liste clients', icon: 'i-lucide-building', to: '/clients', disabled: true }
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
    <UDashboardSidebar>
      <template #header>
        <NuxtLink to="/dashboard" class="flex items-center gap-2 px-1">
          <UIcon name="i-lucide-building-2" class="size-6 text-primary" />
          <span class="font-bold text-lg">LeGeai</span>
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

      <div class="mt-5">
        <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">Clients</p>
        <UNavigationMenu :items="clientNav" orientation="vertical" />
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

    <UDashboardPanel>
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>
