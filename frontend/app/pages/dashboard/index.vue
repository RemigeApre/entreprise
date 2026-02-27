<script setup lang="ts">
import type { DashboardModule } from '~/composables/useDashboardPreferences'

const { user, isDirecteur } = useAuth()
const { isVisible, hide } = useDashboardPreferences()
const { hasSites } = useSiteMonitor()

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
  if (hour < 6) return 'Bonne nuit'
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon apres-midi'
  return 'Bonsoir'
})

const greetingSubtext = computed(() => {
  const day = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return day.charAt(0).toUpperCase() + day.slice(1)
})

function hideModule(key: DashboardModule) {
  hide(key)
}

// Calcul dynamique des paires visibles pour adapter la grille
const planningRow = computed(() => {
  const a = isVisible('weekSummary')
  const b = isVisible('presence')
  return { a, b, count: +a + +b }
})

const projectsRow = computed(() => {
  const a = isVisible('activeProjects')
  const b = isVisible('prospectSummary')
  return { a, b, count: +a + +b }
})

const adminRow = computed(() => {
  if (!isDirecteur.value) return { a: false, b: false, count: 0 }
  const a = isVisible('stageTracker')
  const b = isVisible('jobListings')
  return { a, b, count: +a + +b }
})
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
    <!-- Greeting -->
    <div class="text-center pt-4 pb-2">
      <h1 class="text-2xl sm:text-3xl font-bold font-heading text-stone-900 dark:text-white tracking-tight">
        {{ greeting }}, {{ userDisplayName }}
      </h1>
      <p class="text-sm text-stone-400 dark:text-stone-500 mt-1">{{ greetingSubtext }}</p>
    </div>

    <!-- Notifications (toujours pleine largeur) -->
    <div v-if="isVisible('notifications')" class="relative group">
      <button
        class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Masquer"
        @click="hideModule('notifications')"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
      <DashboardNotifications />
    </div>

    <!-- Planning + Presence -->
    <div
      v-if="planningRow.count > 0"
      class="grid gap-6"
      :class="planningRow.count === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'"
    >
      <div v-if="planningRow.a" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('weekSummary')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardWeekSummary />
      </div>
      <div v-if="planningRow.b" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('presence')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardPresence />
      </div>
    </div>

    <!-- Projects + Prospects -->
    <div
      v-if="projectsRow.count > 0"
      class="grid gap-6"
      :class="projectsRow.count === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'"
    >
      <div v-if="projectsRow.a" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('activeProjects')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardActiveProjects />
      </div>
      <div v-if="projectsRow.b" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('prospectSummary')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardProspectSummary />
      </div>
    </div>

    <!-- Site status (only if user has sites) -->
    <div v-if="hasSites && isVisible('siteStatus')" class="relative group">
      <button
        class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Masquer"
        @click="hideModule('siteStatus')"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
      <DashboardSiteStatus />
    </div>

    <!-- Stage tracker + Job listings (directors only) -->
    <div
      v-if="adminRow.count > 0"
      class="grid gap-6"
      :class="adminRow.count === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'"
    >
      <div v-if="adminRow.a" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('stageTracker')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardStageTracker />
      </div>
      <div v-if="adminRow.b" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('jobListings')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardJobListings />
      </div>
    </div>
  </div>
</template>
