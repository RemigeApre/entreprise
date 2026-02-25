<script setup lang="ts">
const { user, isDirecteur, roleName } = useAuth()

const userDisplayName = computed(() => {
  if (!user.value) return ''
  const { first_name, last_name } = user.value
  if (first_name || last_name) {
    return [first_name, last_name].filter(Boolean).join(' ')
  }
  return user.value.email
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon apres-midi'
  return 'Bonsoir'
})

const quickActions = computed(() => {
  const actions = [
    { label: 'Planning', icon: 'i-lucide-calendar', to: '/planning' },
    { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' },
    { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
    { label: 'Projets', icon: 'i-lucide-folder-kanban', to: '/projets' }
  ]
  if (isDirecteur.value) {
    actions.push({ label: 'Offres', icon: 'i-lucide-megaphone', to: '/offres' })
  }
  return actions
})
</script>

<template>
  <div>
    <UDashboardNavbar title="Dashboard" />

    <div class="p-4 sm:p-6 space-y-6">
      <!-- Greeting -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold font-heading text-gray-900 dark:text-white">
            {{ greeting }}, {{ userDisplayName }}
          </h1>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Bienvenue sur l'intranet LeGeai
          </p>
        </div>
        <UBadge v-if="roleName" variant="subtle" size="sm">
          {{ roleName }}
        </UBadge>
      </div>

      <!-- Notifications -->
      <DashboardNotifications />

      <!-- Week summary - full width -->
      <DashboardWeekSummary />

      <!-- Projects + Prospects - 2 columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardActiveProjects />
        <DashboardProspectSummary />
      </div>

      <!-- Quick access - compact -->
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="action in quickActions"
          :key="action.to"
          :label="action.label"
          :icon="action.icon"
          :to="action.to"
          variant="soft"
          size="sm"
        />
      </div>
    </div>
  </div>
</template>
