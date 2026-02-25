<script setup lang="ts">
const { user, logout, isDirecteur } = useAuth()

const navigation = computed(() => {
  const items = [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: '/dashboard'
    },
    {
      label: 'Planning',
      icon: 'i-lucide-calendar',
      to: '/planning'
    },
    {
      label: 'Equipe',
      icon: 'i-lucide-users',
      to: '/equipe'
    },
    {
      label: 'Prospection',
      icon: 'i-lucide-target',
      to: '/prospection'
    },
    {
      label: 'Projets',
      icon: 'i-lucide-folder-kanban',
      to: '/projets'
    }
  ]

  if (isDirecteur.value) {
    items.push(
      {
        label: 'Offres d\'emploi',
        icon: 'i-lucide-megaphone',
        to: '/offres'
      }
    )
  }

  return items
})

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

      <UNavigationMenu :items="navigation" orientation="vertical" />

      <template #footer>
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
