<script setup lang="ts">
import type { DashboardModule } from '~/composables/useDashboardPreferences'

const { user, isDirecteur } = useAuth()
const { isVisible, hide } = useDashboardPreferences()

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

function hideModule(key: DashboardModule) {
  hide(key)
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
    <!-- Greeting -->
    <div class="text-center pt-2">
      <h1 class="text-2xl font-bold font-heading text-gray-900 dark:text-white">
        {{ greeting }}, {{ userDisplayName }}
      </h1>
    </div>

    <!-- Notifications -->
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

    <!-- Week summary -->
    <div v-if="isVisible('weekSummary')" class="relative group">
      <button
        class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="Masquer"
        @click="hideModule('weekSummary')"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
      <DashboardWeekSummary />
    </div>

    <!-- Projects + Prospects -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-if="isVisible('activeProjects')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('activeProjects')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardActiveProjects />
      </div>
      <div v-if="isVisible('prospectSummary')" class="relative group">
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

    <!-- Stage tracker + Job listings (directors only) -->
    <div v-if="isDirecteur" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div v-if="isVisible('stageTracker')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Masquer"
          @click="hideModule('stageTracker')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardStageTracker />
      </div>
      <div v-if="isVisible('jobListings')" class="relative group">
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
