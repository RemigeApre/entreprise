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
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="h-12 flex items-center justify-center border-b border-stone-200 dark:border-stone-800 shrink-0">
      <span class="font-heading font-bold text-lg tracking-tight text-stone-900 dark:text-white">Le Geai</span>
    </div>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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

      <!-- Week summary -->
      <DashboardWeekSummary />

      <!-- Projects + Prospects -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardActiveProjects />
        <DashboardProspectSummary />
      </div>

      <!-- Stage tracker + Job listings (directors only) -->
      <div v-if="isDirecteur" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardStageTracker />
        <DashboardJobListings />
      </div>
    </div>
  </div>
</template>
