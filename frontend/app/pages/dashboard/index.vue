<script setup lang="ts">
import type { DashboardModule } from '~/composables/useDashboardPreferences'

const { user, isDirecteur, isProspecteur } = useAuth()
const { isVisible, hide } = useDashboardPreferences()
const { hasSites, userSites, checkSiteStatus } = useSiteMonitor()
const { hasQuota } = useProspectQuota()

// ─── Minimalist site status for sidebar ────────────────────────
const siteStatuses = ref<Record<string, boolean | null>>({})

async function checkAllSites() {
  for (const site of userSites.value) {
    const result = await checkSiteStatus(site.url)
    siteStatuses.value = { ...siteStatuses.value, [site.url]: result.up }
  }
}

if (import.meta.client) {
  watch(userSites, (sites) => {
    if (sites.length) checkAllSites()
  }, { immediate: true })
}

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

// ─── Card definitions (center area) ────────────────────────
interface CardDef {
  key: DashboardModule
  condition: () => boolean
}

const cardDefs: CardDef[] = [
  { key: 'weekSummary', condition: () => true },
  { key: 'upcomingEvents', condition: () => true },
  { key: 'presence', condition: () => true },
  { key: 'activeProjects', condition: () => true },
  { key: 'prospectSummary', condition: () => true },
  { key: 'stageTracker', condition: () => isDirecteur.value },
  { key: 'jobListings', condition: () => isDirecteur.value }
]

// ─── Persisted order + sizes ────────────────────────
const LAYOUT_KEY = 'dashboard-layout'

type CardSize = 'full' | 'half'

const cardOrder = ref<DashboardModule[]>(cardDefs.map(d => d.key))
const cardSizes = ref<Record<string, CardSize>>({
  weekSummary: 'full',
  upcomingEvents: 'half',
  presence: 'half',
  activeProjects: 'half',
  prospectSummary: 'half',
  stageTracker: 'full',
  jobListings: 'half'
})

if (import.meta.client) {
  const stored = localStorage.getItem(LAYOUT_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { order: DashboardModule[]; sizes: Record<string, CardSize> }
      if (parsed.order?.length) cardOrder.value = parsed.order
      if (parsed.sizes) cardSizes.value = { ...cardSizes.value, ...parsed.sizes }
    } catch { /* ignore */ }
  }
}

function persistLayout() {
  if (import.meta.client) {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({ order: cardOrder.value, sizes: cardSizes.value }))
  }
}

function getSize(key: DashboardModule): CardSize {
  return cardSizes.value[key] || 'half'
}

function toggleSize(key: DashboardModule) {
  cardSizes.value[key] = getSize(key) === 'full' ? 'half' : 'full'
  cardSizes.value = { ...cardSizes.value }
  persistLayout()
}

// Visible cards in order
const visibleCards = computed(() => {
  const result: DashboardModule[] = []
  for (const key of cardOrder.value) {
    const def = cardDefs.find(d => d.key === key)
    if (def && def.condition() && isVisible(key)) result.push(key)
  }
  for (const def of cardDefs) {
    if (def.condition() && isVisible(def.key) && !result.includes(def.key)) {
      result.push(def.key)
    }
  }
  return result
})

// ─── Drag & drop ────────────────────────
const dragIndex = ref(-1)
const dropIndex = ref(-1)

function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  // Make the drag image semi-transparent
  const el = e.target as HTMLElement
  requestAnimationFrame(() => el.classList.add('is-dragging'))
}

function onDragOver(index: number, e: DragEvent) {
  e.preventDefault()
  dropIndex.value = index
}

function onDragEnd(e: DragEvent) {
  const el = e.target as HTMLElement
  el.classList.remove('is-dragging')

  if (dragIndex.value >= 0 && dropIndex.value >= 0 && dragIndex.value !== dropIndex.value) {
    const keys = visibleCards.value
    const fromKey = keys[dragIndex.value]
    const toKey = keys[dropIndex.value]
    if (fromKey && toKey) {
      const fromIdx = cardOrder.value.indexOf(fromKey)
      const toIdx = cardOrder.value.indexOf(toKey)
      if (fromIdx >= 0 && toIdx >= 0) {
        cardOrder.value.splice(fromIdx, 1)
        cardOrder.value.splice(toIdx, 0, fromKey)
        persistLayout()
      }
    }
  }
  dragIndex.value = -1
  dropIndex.value = -1
}
</script>

<template>
  <div class="dash-page">
    <!-- ═══ HEADER ═══ -->
    <div class="dash-header">
      <h1 class="font-heading text-xl sm:text-2xl tracking-wide text-[#2c2419] opacity-80">
        {{ greeting }}, {{ userDisplayName }}
      </h1>
      <p class="text-xs text-[#af8f3c]/50 tracking-wider mt-0.5">{{ greetingSubtext }}</p>
    </div>

    <!-- ═══ BODY: center scroll + right sticky ═══ -->
    <div class="dash-body">
      <!-- ── Centre (scrollable) ── -->
      <div class="dash-center">
        <!-- Notifications (full width, not draggable) -->
        <div v-if="isVisible('notifications')" class="dash-card dash-card--full relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('notifications')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardNotifications />
        </div>

        <!-- Cartes draggables en flex wrap -->
        <div class="dash-wrap">
          <div
            v-for="(key, i) in visibleCards"
            :key="key"
            class="dash-card group"
            :class="[
              getSize(key) === 'full' ? 'dash-card--full' : 'dash-card--half',
              { 'is-drag-over': dropIndex === i && dragIndex !== i },
              { 'is-dragging': dragIndex === i }
            ]"
            draggable="true"
            @dragstart="onDragStart(i, $event)"
            @dragover="onDragOver(i, $event)"
            @dragend="onDragEnd($event)"
          >
            <!-- Drag handle -->
            <div class="dash-drag-handle">
              <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
            </div>

            <!-- Size toggle -->
            <button
              class="dash-size-btn"
              :title="getSize(key) === 'full' ? 'Demi-largeur' : 'Pleine largeur'"
              @click.stop="toggleSize(key)"
            >
              <UIcon
                :name="getSize(key) === 'full' ? 'i-lucide-columns-2' : 'i-lucide-square'"
                class="size-3"
              />
            </button>

            <!-- Hide -->
            <button class="dash-hide-btn" title="Masquer" @click="hideModule(key)">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>

            <!-- Component -->
            <DashboardWeekSummary v-if="key === 'weekSummary'" />
            <DashboardUpcomingEvents v-else-if="key === 'upcomingEvents'" />
            <DashboardPresence v-else-if="key === 'presence'" />
            <DashboardActiveProjects v-else-if="key === 'activeProjects'" />
            <DashboardProspectSummary v-else-if="key === 'prospectSummary'" />
            <DashboardStageTracker v-else-if="key === 'stageTracker'" />
            <DashboardJobListings v-else-if="key === 'jobListings'" />
          </div>
        </div>
      </div>

      <!-- ── Sidebar droite (sticky) ── -->
      <div class="dash-sidebar">
        <!-- Sites status -->
        <div v-if="hasSites && isVisible('siteStatus')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('siteStatus')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold">Sites</h3>
                <UButton label="Details" variant="link" size="xs" to="/projets/status" trailing-icon="i-lucide-arrow-right" />
              </div>
            </template>
            <div class="space-y-0.5">
              <NuxtLink
                v-for="site in userSites"
                :key="site.id"
                to="/projets/status"
                class="flex items-center gap-2 py-1 px-1 rounded hover:bg-[rgba(175,143,60,0.04)] transition-colors"
              >
                <span
                  class="size-2 rounded-full shrink-0"
                  :class="siteStatuses[site.url] === true ? 'bg-emerald-500' : siteStatuses[site.url] === false ? 'bg-red-500' : 'bg-stone-300 animate-pulse'"
                />
                <span class="text-[12px] text-stone-600 truncate">{{ site.nom }}</span>
              </NuxtLink>
            </div>
          </UCard>
        </div>

        <!-- Prospect quota -->
        <div v-if="isProspecteur && hasQuota && isVisible('prospectQuota')" class="relative group">
          <button class="dash-hide-btn" title="Masquer" @click="hideModule('prospectQuota')">
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
          <DashboardProspectQuota />
        </div>

        <DashboardNotes />
        <DashboardTickets />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══ PAGE ═══ */
.dash-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* ═══ HEADER ═══ */
.dash-header {
  padding: 20px 24px 12px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .dash-header { padding: 6px 16px 8px; }
}

/* ═══ BODY: center + sidebar ═══ */
.dash-body {
  display: flex;
  gap: 14px;
  padding: 0 24px 32px;
  align-items: flex-start;
}
@media (max-width: 768px) {
  .dash-body {
    flex-direction: column;
    padding: 0 16px 24px;
  }
}

/* ═══ CENTER ═══ */
.dash-center {
  flex: 1;
  min-width: 0;
}

/* ═══ FLEX WRAP ═══ */
.dash-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  align-items: flex-start;
}

/* ═══ CARD SIZES ═══ */
.dash-card {
  position: relative;
  min-width: 0;
  transition: transform 0.15s, opacity 0.15s;
}

/* Fixed height for half-width cards */
.dash-card--half :deep(> .u-card),
.dash-card--half :deep(> div > .u-card) {
  height: 220px;
  display: flex;
  flex-direction: column;
}
.dash-card--half :deep(.u-card > div:last-child) {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}
.dash-card--half :deep(.u-card > div:last-child::-webkit-scrollbar) {
  display: none;
}

.dash-card--full {
  width: 100%;
}

.dash-card--half {
  width: calc(50% - 7px);
}

@media (max-width: 900px) {
  .dash-card--half {
    width: 100%;
  }
}

/* ═══ DRAG STATES ═══ */
.dash-card[draggable="true"] {
  cursor: grab;
}
.dash-card[draggable="true"]:active {
  cursor: grabbing;
}

.dash-card.is-dragging {
  opacity: 0.4;
}

.dash-card.is-drag-over::before {
  content: '';
  position: absolute;
  top: -9px;
  left: 8px;
  right: 8px;
  height: 2px;
  border-radius: 1px;
  background: #AF8F3C;
  z-index: 20;
}

/* ═══ DRAG HANDLE ═══ */
.dash-drag-handle {
  position: absolute;
  top: 12px;
  left: 8px;
  z-index: 10;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(175, 143, 60, 0.15);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  pointer-events: none;
}
.group:hover .dash-drag-handle {
  opacity: 1;
}

/* ═══ SIZE TOGGLE ═══ */
.dash-size-btn {
  position: absolute;
  top: -4px;
  right: 24px;
  z-index: 10;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: #f5efe0;
  border: 1px solid rgba(175, 143, 60, 0.15);
  color: rgba(175, 143, 60, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
  cursor: pointer;
}
.group:hover .dash-size-btn { opacity: 1; }
.dash-size-btn:hover {
  color: #AF8F3C;
  border-color: rgba(175, 143, 60, 0.25);
}

/* ═══ SIDEBAR (sticky) ═══ */
.dash-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media (max-width: 768px) {
  .dash-sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
  }
  .dash-sidebar > * {
    flex: 1;
    min-width: 0;
  }
}
@media (max-width: 1100px) and (min-width: 769px) {
  .dash-sidebar {
    width: 240px;
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
  border: 1px solid rgba(175, 143, 60, 0.15);
  color: rgba(175, 143, 60, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.15s;
  cursor: pointer;
}
.group:hover .dash-hide-btn { opacity: 1; }
.dash-hide-btn:hover {
  color: #b74d34;
  border-color: rgba(183, 77, 52, 0.2);
}
</style>
