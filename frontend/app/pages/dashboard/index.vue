<script setup lang="ts">
import type { DashboardModule } from '~/composables/useDashboardPreferences'

const { user, isDirecteur, roleName } = useAuth()
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

// ─── Tabs for dashboard sections ────────────────────────
type DashTab = 'all' | 'planning' | 'business' | 'admin'

const activeTab = ref<DashTab>('all')

const tabs = computed(() => {
  const list: { key: DashTab; label: string; icon: string }[] = [
    { key: 'all', label: 'Tout', icon: 'i-lucide-layout-grid' },
    { key: 'planning', label: 'Planning', icon: 'i-lucide-calendar' },
    { key: 'business', label: 'Activite', icon: 'i-lucide-briefcase' }
  ]
  if (isDirecteur.value) {
    list.push({ key: 'admin', label: 'Direction', icon: 'i-lucide-shield' })
  }
  return list
})

// Which modules belong to which tab
function inTab(mod: DashboardModule): boolean {
  if (activeTab.value === 'all') return true
  const map: Record<DashTab, DashboardModule[]> = {
    all: [],
    planning: ['weekSummary', 'presence', 'notifications'],
    business: ['activeProjects', 'prospectSummary', 'siteStatus'],
    admin: ['stageTracker', 'jobListings']
  }
  return map[activeTab.value].includes(mod)
}

// Quick nav links
const quickLinks = computed(() => {
  const links = [
    { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/planning' },
    { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' },
    { label: 'Projets', icon: 'i-lucide-folder-kanban', to: '/projets' }
  ]
  if (roleName.value !== 'Stagiaire') {
    links.push({ label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' })
  }
  links.push({ label: 'Wiki', icon: 'i-lucide-book-open', to: '/wiki' })
  return links
})
</script>

<template>
  <div class="dash-page">
    <!-- ═══ HEADER: greeting + quick nav ═══ -->
    <div class="dash-header">
      <div class="dash-greeting">
        <h1 class="font-heading text-xl sm:text-2xl tracking-wide text-[#2c2419] dark:text-[#e8e0d0] opacity-80">
          {{ greeting }}, {{ userDisplayName }}
        </h1>
        <p class="text-xs text-[#af8f3c]/50 tracking-wider mt-0.5">{{ greetingSubtext }}</p>
      </div>
      <nav class="dash-quicknav">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="dash-quicklink"
        >
          <UIcon :name="link.icon" class="size-3.5" />
          <span>{{ link.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- ═══ TAB BAR ═══ -->
    <div class="dash-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="dash-tab"
        :class="{ 'is-active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <UIcon :name="tab.icon" class="size-3.5" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="dash-content">
      <!-- Notifications (full width, always on top when visible) -->
      <div v-if="isVisible('notifications') && inTab('notifications')" class="dash-full relative group">
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
        <div v-if="isVisible('weekSummary') && inTab('weekSummary')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('weekSummary')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardWeekSummary />
        </div>

        <!-- Presence -->
        <div v-if="isVisible('presence') && inTab('presence')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('presence')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardPresence />
        </div>

        <!-- Active Projects -->
        <div v-if="isVisible('activeProjects') && inTab('activeProjects')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('activeProjects')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardActiveProjects />
        </div>

        <!-- Prospect Summary -->
        <div v-if="isVisible('prospectSummary') && inTab('prospectSummary')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('prospectSummary')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardProspectSummary />
        </div>

        <!-- Site Status -->
        <div v-if="hasSites && isVisible('siteStatus') && inTab('siteStatus')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('siteStatus')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardSiteStatus />
        </div>

        <!-- Stage Tracker (admin) -->
        <div v-if="isDirecteur && isVisible('stageTracker') && inTab('stageTracker')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('stageTracker')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardStageTracker />
        </div>

        <!-- Job Listings (admin) -->
        <div v-if="isDirecteur && isVisible('jobListings') && inTab('jobListings')" class="relative group">
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
/* ============================
   PAGE
   ============================ */
.dash-page {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* ============================
   HEADER: greeting + quick nav
   ============================ */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px 8px;
  }
}

.dash-greeting {
  min-width: 0;
}

/* Quick nav links */
.dash-quicknav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.dash-quicklink {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #2c2419;
  opacity: 0.4;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}
:global(.dark) .dash-quicklink { color: #e8e0d0; }

.dash-quicklink:hover {
  opacity: 0.75;
  background: rgba(175, 143, 60, 0.06);
}

@media (max-width: 640px) {
  .dash-quicknav { display: none; }
}

/* ============================
   TAB BAR
   ============================ */
.dash-tabs {
  display: flex;
  gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid rgba(175, 143, 60, 0.08);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dash-tabs { padding: 0 16px; }
}

.dash-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #2c2419;
  opacity: 0.35;
  position: relative;
  transition: opacity 0.2s, color 0.2s;
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
}
:global(.dark) .dash-tab { color: #e8e0d0; }

.dash-tab:hover { opacity: 0.6; }

.dash-tab.is-active {
  opacity: 1;
  color: #AF8F3C;
}
.dash-tab.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, #AF8F3C, transparent);
}

/* ============================
   CONTENT
   ============================ */
.dash-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 32px;
}

@media (max-width: 768px) {
  .dash-content { padding: 16px 16px 24px; }
}

/* Full-width items (notifications) */
.dash-full {
  margin-bottom: 20px;
}

/* Module grid */
.dash-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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

/* ============================
   HIDE BUTTON (shared)
   ============================ */
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
