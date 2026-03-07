<script setup lang="ts">
import type { DashboardModule } from '~/composables/useDashboardPreferences'

const { user, isDirecteur } = useAuth()
const { isVisible, hide } = useDashboardPreferences()
const { hasSites } = useSiteMonitor()

const userDisplayName = computed(() => {
  if (!user.value) return ''
  const { first_name, last_name, email } = user.value
  if (first_name || last_name) {
    return [first_name, last_name].filter(Boolean).join(' ')
  }
  return email
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
</script>

<template>
  <div class="flex-1 overflow-y-auto p-4 sm:p-6">
    <!-- Greeting -->
    <div class="text-center pt-4 pb-2">
      <h1 class="font-heading text-2xl sm:text-3xl tracking-wide text-[#2c2419] dark:text-[#e8e0d0] opacity-80">
        {{ greeting }}, {{ userDisplayName }}
      </h1>
      <div class="flex items-center justify-center gap-3 mt-2">
        <div class="w-8 h-px bg-gradient-to-r from-transparent via-[#af8f3c] to-transparent opacity-30" />
        <p class="text-sm text-[#af8f3c] opacity-50 tracking-wider">{{ greetingSubtext }}</p>
        <div class="w-8 h-px bg-gradient-to-r from-transparent via-[#af8f3c] to-transparent opacity-30" />
      </div>
    </div>

    <!-- Notifications (always full width) -->
    <div v-if="isVisible('notifications')" class="relative group mb-4">
      <button
        class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        title="Masquer"
        @click="hideModule('notifications')"
      >
        <UIcon name="i-lucide-x" class="size-3.5" />
      </button>
      <DashboardNotifications />
    </div>

    <!-- Main flowing grid -->
    <div class="dash-grid">
      <!-- Planning -->
      <div v-if="isVisible('weekSummary')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('weekSummary')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardWeekSummary />
      </div>

      <!-- Presence -->
      <div v-if="isVisible('presence')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('presence')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardPresence />
      </div>

      <!-- Active Projects -->
      <div v-if="isVisible('activeProjects')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('activeProjects')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardActiveProjects />
      </div>

      <!-- Prospect Summary -->
      <div v-if="isVisible('prospectSummary')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('prospectSummary')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardProspectSummary />
      </div>

      <!-- Site Status -->
      <div v-if="hasSites && isVisible('siteStatus')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('siteStatus')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardSiteStatus />
      </div>

      <!-- Stage Tracker (admin) -->
      <div v-if="isDirecteur && isVisible('stageTracker')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          title="Masquer"
          @click="hideModule('stageTracker')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardStageTracker />
      </div>

      <!-- Job Listings (admin) -->
      <div v-if="isDirecteur && isVisible('jobListings')" class="relative group">
        <button
          class="absolute -top-1 -right-1 z-10 size-6 rounded-full bg-[#f5efe0] dark:bg-[#1a2520] border border-[rgba(175,143,60,0.1)] text-[#af8f3c]/40 hover:text-[#b74d34] hover:border-[#b74d34]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
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

<style scoped>
.dash-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 1280px) {
  .dash-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}
</style>
