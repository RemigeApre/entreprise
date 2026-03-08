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
  <div class="dash-page">
    <!-- ═══ HEADER ═══ -->
    <div class="dash-header">
      <div class="dash-greeting">
        <h1 class="font-heading text-xl sm:text-2xl tracking-wide text-[#2c2419] dark:text-[#e8e0d0] opacity-80">
          {{ greeting }}, {{ userDisplayName }}
        </h1>
        <p class="text-xs text-[#af8f3c]/50 tracking-wider mt-0.5">{{ greetingSubtext }}</p>
      </div>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="dash-content">
      <!-- Notifications (full width) -->
      <div v-if="isVisible('notifications')" class="dash-full relative group">
        <button
          class="dash-hide-btn"
          title="Masquer"
          @click="hideModule('notifications')"
        >
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardNotifications />
      </div>

      <div class="dash-grid">
        <!-- Planning -->
        <div v-if="isVisible('weekSummary')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('weekSummary')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardWeekSummary />
        </div>

        <!-- Presence -->
        <div v-if="isVisible('presence')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('presence')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardPresence />
        </div>

        <!-- Active Projects -->
        <div v-if="isVisible('activeProjects')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('activeProjects')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardActiveProjects />
        </div>

        <!-- Prospect Summary -->
        <div v-if="isVisible('prospectSummary')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('prospectSummary')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardProspectSummary />
        </div>

        <!-- Site Status -->
        <div v-if="hasSites && isVisible('siteStatus')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('siteStatus')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardSiteStatus />
        </div>

        <!-- Stage Tracker (admin) -->
        <div v-if="isDirecteur && isVisible('stageTracker')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('stageTracker')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardStageTracker />
        </div>

        <!-- Job Listings (admin) -->
        <div v-if="isDirecteur && isVisible('jobListings')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('jobListings')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardJobListings />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ PAGE ═══ */
.dash-page {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ═══ HEADER ═══ */
.dash-header {
  padding: 20px 24px 16px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dash-header {
    padding: 14px 16px 10px;
  }
}

.dash-greeting {
  min-width: 0;
}

/* ═══ CONTENT ═══ */
.dash-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 32px;
}

@media (max-width: 768px) {
  .dash-content { padding: 0 16px 24px; }
}

/* Full-width items (notifications) */
.dash-full {
  margin-bottom: 16px;
}

/* Module grid */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (min-width: 1400px) {
  .dash-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .dash-grid {
    grid-template-columns: 1fr;
  }
}

/* ═══ HIDE BUTTON ═══ */
.dash-hide-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 10;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: #f5efe0;
  border: 1px solid rgba(175, 143, 60, 0.1);
  color: rgba(175, 143, 60, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
  cursor: pointer;
}
:global(.dark) .dash-hide-btn {
  background: #1a2520;
}

.group:hover .dash-hide-btn { opacity: 1; }

.dash-hide-btn:hover {
  color: #b74d34;
  border-color: rgba(183, 77, 52, 0.2);
}
</style>
