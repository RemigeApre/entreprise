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

// ─── Module registry ────────────────────────
// Maps module keys to their component name and visibility condition
interface ModuleDef {
  key: DashboardModule
  component: string
  condition: () => boolean
  column: 'left' | 'right'
}

const allModules: ModuleDef[] = [
  { key: 'weekSummary', component: 'DashboardWeekSummary', column: 'left', condition: () => true },
  { key: 'activeProjects', component: 'DashboardActiveProjects', column: 'left', condition: () => true },
  { key: 'stageTracker', component: 'DashboardStageTracker', column: 'left', condition: () => isDirecteur.value },
  { key: 'presence', component: 'DashboardPresence', column: 'right', condition: () => true },
  { key: 'siteStatus', component: 'DashboardSiteStatus', column: 'right', condition: () => hasSites.value },
  { key: 'prospectSummary', component: 'DashboardProspectSummary', column: 'right', condition: () => true },
  { key: 'jobListings', component: 'DashboardJobListings', column: 'right', condition: () => isDirecteur.value }
]

// ─── Ordering (persisted in localStorage) ────────────────────────
const ORDER_KEY = 'dashboard-module-order'

const defaultLeftOrder: DashboardModule[] = ['weekSummary', 'activeProjects', 'stageTracker']
const defaultRightOrder: DashboardModule[] = ['presence', 'siteStatus', 'prospectSummary', 'jobListings']

const leftOrder = ref<DashboardModule[]>([...defaultLeftOrder])
const rightOrder = ref<DashboardModule[]>([...defaultRightOrder])

// Load from localStorage
if (import.meta.client) {
  const stored = localStorage.getItem(ORDER_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { left: DashboardModule[]; right: DashboardModule[] }
      if (parsed.left?.length) leftOrder.value = parsed.left
      if (parsed.right?.length) rightOrder.value = parsed.right
    } catch { /* ignore */ }
  }
}

function persistOrder() {
  if (import.meta.client) {
    localStorage.setItem(ORDER_KEY, JSON.stringify({ left: leftOrder.value, right: rightOrder.value }))
  }
}

// Visible modules in order
const leftModules = computed(() => {
  const ordered = leftOrder.value
    .map(key => allModules.find(m => m.key === key))
    .filter((m): m is ModuleDef => !!m && m.condition() && isVisible(m.key))
  // Add any missing left modules
  for (const m of allModules) {
    if (m.column === 'left' && m.condition() && isVisible(m.key) && !ordered.find(o => o.key === m.key)) {
      ordered.push(m)
    }
  }
  return ordered
})

const rightModules = computed(() => {
  const ordered = rightOrder.value
    .map(key => allModules.find(m => m.key === key))
    .filter((m): m is ModuleDef => !!m && m.condition() && isVisible(m.key))
  for (const m of allModules) {
    if (m.column === 'right' && m.condition() && isVisible(m.key) && !ordered.find(o => o.key === m.key)) {
      ordered.push(m)
    }
  }
  return ordered
})

// ─── Drag & drop ────────────────────────
const dragColumn = ref<'left' | 'right' | null>(null)
const dragIndex = ref(-1)
const dropIndex = ref(-1)

function onDragStart(col: 'left' | 'right', index: number, e: DragEvent) {
  dragColumn.value = col
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }
}

function onDragOver(col: 'left' | 'right', index: number, e: DragEvent) {
  if (dragColumn.value !== col) return
  e.preventDefault()
  dropIndex.value = index
}

function onDragEnd() {
  if (dragColumn.value && dragIndex.value >= 0 && dropIndex.value >= 0 && dragIndex.value !== dropIndex.value) {
    const order = dragColumn.value === 'left' ? leftOrder.value : rightOrder.value
    const visibleKeys = (dragColumn.value === 'left' ? leftModules : rightModules).value.map(m => m.key)

    const fromKey = visibleKeys[dragIndex.value]
    const toKey = visibleKeys[dropIndex.value]
    if (fromKey && toKey) {
      const fromIdx = order.indexOf(fromKey)
      const toIdx = order.indexOf(toKey)
      if (fromIdx >= 0 && toIdx >= 0) {
        order.splice(fromIdx, 1)
        order.splice(toIdx, 0, fromKey)
        persistOrder()
      }
    }
  }
  dragColumn.value = null
  dragIndex.value = -1
  dropIndex.value = -1
}

// ─── Component resolver ────────────────────────
const componentMap: Record<string, ReturnType<typeof resolveComponent>> = {}
onMounted(() => {
  for (const m of allModules) {
    componentMap[m.component] = resolveComponent(m.component)
  }
  componentMap['DashboardNotes'] = resolveComponent('DashboardNotes')
  componentMap['DashboardTickets'] = resolveComponent('DashboardTickets')
})
</script>

<template>
  <div class="dash-page">
    <!-- ═══ HEADER ═══ -->
    <div class="dash-header">
      <h1 class="font-heading text-xl sm:text-2xl tracking-wide text-[#2c2419] dark:text-[#e8e0d0] opacity-80">
        {{ greeting }}, {{ userDisplayName }}
      </h1>
      <p class="text-xs text-[#af8f3c]/50 tracking-wider mt-0.5">{{ greetingSubtext }}</p>
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="dash-content">
      <!-- Notifications (full width, not draggable) -->
      <div v-if="isVisible('notifications')" class="relative group">
        <button class="dash-hide-btn" title="Masquer" @click="hideModule('notifications')">
          <UIcon name="i-lucide-x" class="size-3.5" />
        </button>
        <DashboardNotifications />
      </div>

      <!-- ═══ MAIN LAYOUT: 2 colonnes ═══ -->
      <div class="dash-cols">
        <!-- ── Colonne gauche ── -->
        <div class="dash-col">
          <div
            v-for="(mod, i) in leftModules"
            :key="mod.key"
            class="dash-card-wrap group"
            :class="{
              'is-drag-over': dragColumn === 'left' && dropIndex === i && dragIndex !== i
            }"
            draggable="true"
            @dragstart="onDragStart('left', i, $event)"
            @dragover="onDragOver('left', i, $event)"
            @dragend="onDragEnd"
          >
            <div class="dash-drag-handle">
              <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
            </div>
            <button class="dash-hide-btn" title="Masquer" @click="hideModule(mod.key)">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
            <component :is="mod.component" />
          </div>
        </div>

        <!-- ── Colonne droite ── -->
        <div class="dash-col">
          <!-- Notes & Tickets : fixes en haut, pas draggables -->
          <div v-if="isVisible('notes')" class="relative group">
            <button class="dash-hide-btn" title="Masquer" @click="hideModule('notes')">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
            <DashboardNotes />
          </div>

          <div v-if="isVisible('tickets')" class="relative group">
            <button class="dash-hide-btn" title="Masquer" @click="hideModule('tickets')">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
            <DashboardTickets />
          </div>

          <!-- Modules draggables -->
          <div
            v-for="(mod, i) in rightModules"
            :key="mod.key"
            class="dash-card-wrap group"
            :class="{
              'is-drag-over': dragColumn === 'right' && dropIndex === i && dragIndex !== i
            }"
            draggable="true"
            @dragstart="onDragStart('right', i, $event)"
            @dragover="onDragOver('right', i, $event)"
            @dragend="onDragEnd"
          >
            <div class="dash-drag-handle">
              <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
            </div>
            <button class="dash-hide-btn" title="Masquer" @click="hideModule(mod.key)">
              <UIcon name="i-lucide-x" class="size-3.5" />
            </button>
            <component :is="mod.component" />
          </div>
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
  padding: 20px 24px 12px;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .dash-header { padding: 14px 16px 8px; }
}

/* ═══ CONTENT ═══ */
.dash-content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media (max-width: 768px) {
  .dash-content { padding: 4px 16px 24px; }
}

/* ═══ 2-COL LAYOUT ═══ */
.dash-cols {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 14px;
  align-items: start;
}
@media (max-width: 900px) {
  .dash-cols {
    grid-template-columns: 1fr;
  }
}

.dash-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* ═══ DRAGGABLE CARD ═══ */
.dash-card-wrap {
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s;
}

.dash-card-wrap[draggable="true"] {
  cursor: grab;
}
.dash-card-wrap[draggable="true"]:active {
  cursor: grabbing;
}

.dash-card-wrap.is-drag-over {
  transform: translateY(4px);
}
.dash-card-wrap.is-drag-over::before {
  content: '';
  position: absolute;
  top: -9px;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 1px;
  background: #AF8F3C;
  z-index: 20;
}

/* Drag handle */
.dash-drag-handle {
  position: absolute;
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  z-index: 10;
  width: 18px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(175, 143, 60, 0.2);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  pointer-events: none;
}
.group:hover .dash-drag-handle {
  opacity: 1;
}
.dash-drag-handle:hover {
  color: rgba(175, 143, 60, 0.5);
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
