<script setup lang="ts">
import { DASHBOARD_MODULES, PLANNING_DISPLAY_OPTIONS, PRESENCE_DISPLAY_OPTIONS } from '~/composables/useDashboardPreferences'

const { user, logout, isDirecteur, roleName } = useAuth()
const colorMode = useColorMode()
const route = useRoute()
const mobileOpen = ref(false)
const { isVisible, show, hide, hiddenCount, showAll, planningMode, setPlanningMode, presenceMode, setPresenceMode } = useDashboardPreferences()
const { hasSites } = useSiteMonitor()

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=IM+Fell+DW+Pica:ital@0;1&family=UnifrakturCook:wght@700&display=swap'
    }
  ]
})

watch(() => route.fullPath, () => { mobileOpen.value = false })

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

// ─── Domain definitions ─────────────────────────────────

interface DomainTab {
  label: string
  icon: string
  to: string
  disabled?: boolean
}

interface Domain {
  id: string
  label: string
  icon: string
  to: string
  prefixes: string[]
  tabs: DomainTab[]
}

const domains = computed<Domain[]>(() => {
  const list: Domain[] = [
    {
      id: 'rh',
      label: 'RH',
      icon: 'i-lucide-users',
      to: '/planning',
      prefixes: ['/planning', '/emploi-du-temps', '/equipe', '/offres'],
      tabs: [
        { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/planning' },
        { label: 'Emploi du temps', icon: 'i-lucide-clock', to: '/emploi-du-temps' },
        { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' },
        ...(isDirecteur.value ? [{ label: 'Offres', icon: 'i-lucide-megaphone', to: '/offres' }] : [])
      ]
    },
    {
      id: 'projets',
      label: 'Projets',
      icon: 'i-lucide-folder-kanban',
      to: '/projets',
      prefixes: ['/projets'],
      tabs: [
        { label: 'Projets', icon: 'i-lucide-folder-kanban', to: '/projets' },
        { label: 'Incidents', icon: 'i-lucide-ticket', to: '/projets/tickets', disabled: true },
        ...(hasSites.value || isDirecteur.value ? [{ label: 'Sites', icon: 'i-lucide-activity', to: '/projets/status' }] : [])
      ]
    }
  ]

  if (roleName.value !== 'Stagiaire') {
    list.push({
      id: 'clients',
      label: 'Clients',
      icon: 'i-lucide-target',
      to: '/prospection',
      prefixes: ['/prospection', '/clients'],
      tabs: [
        { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
        { label: 'Clients', icon: 'i-lucide-building', to: '/clients', disabled: true }
      ]
    })
  }

  list.push({
    id: 'ressources',
    label: 'Ressources',
    icon: 'i-lucide-book-open',
    to: '/wiki',
    prefixes: ['/wiki'],
    tabs: []
  })

  return list
})

// ─── Active state logic ─────────────────────────────────

const isOnDashboard = computed(() => route.path === '/dashboard' || route.path.startsWith('/dashboard/'))

const activeDomain = computed(() => {
  const path = route.path
  return domains.value.find(d =>
    d.prefixes.some(p => path === p || path.startsWith(p + '/'))
  ) || null
})

const activeTabs = computed(() => activeDomain.value?.tabs || [])

function isDomainActive(domain: Domain) {
  return activeDomain.value?.id === domain.id
}

function isTabActive(tab: DomainTab) {
  const path = route.path
  if (!(path === tab.to || path.startsWith(tab.to + '/'))) return false
  const longerMatch = activeTabs.value.find(t =>
    t.to !== tab.to &&
    t.to.length > tab.to.length &&
    (path === t.to || path.startsWith(t.to + '/'))
  )
  return !longerMatch
}

// ─── User menu ──────────────────────────────────────────

const userDisplayName = computed(() => {
  if (!user.value) return ''
  const { first_name, last_name, email } = user.value
  if (first_name || last_name) {
    return [first_name, last_name].filter(Boolean).join(' ')
  }
  return email
})

const userMenuItems = computed(() => [
  [
    { label: 'Mon profil', icon: 'i-lucide-user', to: '/profil' },
    ...(isDirecteur.value ? [{ label: 'Administration', icon: 'i-lucide-shield', to: '/admin' }] : [])
  ],
  [{ label: 'Se deconnecter', icon: 'i-lucide-log-out', click: () => logout() }]
])
</script>

<template>
  <div class="intranet-root">
    <!-- Noise overlay -->
    <svg class="sr-only" aria-hidden="true">
      <filter id="intranet-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="intranet-noise" aria-hidden="true">
      <svg width="100%" height="100%"><rect width="100%" height="100%" filter="url(#intranet-noise)" /></svg>
    </div>

    <!-- Vignette -->
    <div class="intranet-vignette" aria-hidden="true" />

    <!-- ========================================================== -->
    <!-- DESKTOP: Sidebar                                           -->
    <!-- ========================================================== -->
    <aside class="sidebar">
      <!-- Logo glyph -->
      <UTooltip text="Tableau de bord" :delay-duration="300">
        <NuxtLink to="/dashboard" class="sidebar-logo" :class="{ 'is-active': isOnDashboard }">
          <span class="sidebar-glyph">G</span>
        </NuxtLink>
      </UTooltip>

      <div class="sidebar-sep" />

      <!-- Domain icons -->
      <nav class="sidebar-nav">
        <UTooltip v-for="domain in domains" :key="domain.id" :text="domain.label" :delay-duration="300">
          <NuxtLink
            :to="domain.to"
            class="sidebar-icon"
            :class="{ 'is-active': isDomainActive(domain) }"
          >
            <UIcon :name="domain.icon" class="size-[18px]" />
          </NuxtLink>
        </UTooltip>
      </nav>

      <!-- Bottom actions -->
      <div class="sidebar-bottom">
        <UTooltip :text="isDark ? 'Mode clair' : 'Mode sombre'" :delay-duration="300">
          <button class="sidebar-icon" @click="isDark = !isDark">
            <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
          </button>
        </UTooltip>

        <UPopover>
          <UTooltip text="Parametres" :delay-duration="300">
            <button class="sidebar-icon">
              <UIcon name="i-lucide-settings" class="size-4" />
            </button>
          </UTooltip>
          <template #content>
            <div class="settings-popover">
              <div class="settings-section">
                <p class="settings-label">Modules</p>
                <label
                  v-for="mod in DASHBOARD_MODULES"
                  :key="mod.key"
                  class="settings-row"
                >
                  <span class="settings-text">{{ mod.label }}</span>
                  <USwitch
                    :model-value="isVisible(mod.key)"
                    size="xs"
                    @update:model-value="$event ? show(mod.key) : hide(mod.key)"
                  />
                </label>
                <button
                  v-if="hiddenCount > 0"
                  class="settings-reset"
                  @click="showAll()"
                >
                  Tout reafficher
                </button>
              </div>
              <div class="separator-gold" />
              <div class="settings-section">
                <p class="settings-label">Affichage planning</p>
                <label
                  v-for="opt in PLANNING_DISPLAY_OPTIONS"
                  :key="opt.value"
                  class="settings-radio"
                >
                  <input
                    type="radio"
                    name="planning-mode"
                    :value="opt.value"
                    :checked="planningMode === opt.value"
                    @change="setPlanningMode(opt.value)"
                  />
                  {{ opt.label }}
                </label>
              </div>
              <div class="separator-gold" />
              <div class="settings-section">
                <p class="settings-label">Affichage presence</p>
                <label
                  v-for="opt in PRESENCE_DISPLAY_OPTIONS"
                  :key="opt.value"
                  class="settings-radio"
                >
                  <input
                    type="radio"
                    name="presence-mode"
                    :value="opt.value"
                    :checked="presenceMode === opt.value"
                    @change="setPresenceMode(opt.value)"
                  />
                  {{ opt.label }}
                </label>
              </div>
            </div>
          </template>
        </UPopover>

        <UDropdownMenu :items="userMenuItems">
          <button
            class="sidebar-avatar"
            :class="{ 'is-director': isDirecteur }"
          >
            <UAvatar
              :alt="userDisplayName"
              size="xs"
            />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <!-- ========================================================== -->
    <!-- Main Content Area                                          -->
    <!-- ========================================================== -->
    <div class="main-area">

      <!-- Domain tab bar (desktop, shown when >= 2 tabs) -->
      <div v-if="activeTabs.length >= 2" class="tab-bar">
        <div class="tab-bar-inner">
          <div class="tab-list">
            <template v-for="tab in activeTabs" :key="tab.to">
              <span v-if="tab.disabled" class="tab-item is-disabled">
                <UIcon :name="tab.icon" class="size-3.5" />
                {{ tab.label }}
              </span>
              <NuxtLink
                v-else
                :to="tab.to"
                class="tab-item"
                :class="{ 'is-active': isTabActive(tab) }"
              >
                <UIcon :name="tab.icon" class="size-3.5" />
                {{ tab.label }}
              </NuxtLink>
            </template>
          </div>
          <div id="page-actions" class="ml-auto flex items-center gap-2" />
        </div>
      </div>

      <!-- Page content -->
      <div class="page-content bg-watermark">
        <!-- Mobile menu button -->
        <div class="mobile-menu-btn">
          <button class="mobile-menu-trigger" @click="mobileOpen = true">
            <UIcon name="i-lucide-menu" class="size-5" />
          </button>
        </div>
        <slot />
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MOBILE: Slide-in drawer                                    -->
    <!-- ========================================================== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileOpen"
          class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          @click="mobileOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-250 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full"
      >
        <aside v-if="mobileOpen" class="mobile-drawer">
          <!-- Drawer header -->
          <div class="drawer-header">
            <NuxtLink to="/dashboard" class="drawer-logo" @click="mobileOpen = false">
              <span class="font-fraktur text-2xl text-[var(--gold)] leading-none">G</span>
              <span class="font-heading text-lg tracking-wide">Le Geai</span>
            </NuxtLink>
            <button class="drawer-close" @click="mobileOpen = false">
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>

          <!-- Drawer navigation -->
          <nav class="drawer-nav">
            <div v-for="domain in domains" :key="domain.id">
              <NuxtLink
                v-if="domain.tabs.length === 0"
                :to="domain.to"
                class="drawer-link"
                :class="{ 'is-active': isDomainActive(domain) }"
                @click="mobileOpen = false"
              >
                <UIcon :name="domain.icon" class="size-5" />
                {{ domain.label }}
              </NuxtLink>

              <template v-else>
                <p class="drawer-section-title">{{ domain.label }}</p>
                <div class="space-y-0.5">
                  <template v-for="tab in domain.tabs" :key="tab.to">
                    <span v-if="tab.disabled" class="drawer-link is-disabled">
                      <UIcon :name="tab.icon" class="size-4" />
                      {{ tab.label }}
                    </span>
                    <NuxtLink
                      v-else
                      :to="tab.to"
                      class="drawer-link"
                      :class="{ 'is-active': isTabActive(tab) }"
                      @click="mobileOpen = false"
                    >
                      <UIcon :name="tab.icon" class="size-4" />
                      {{ tab.label }}
                    </NuxtLink>
                  </template>
                </div>
              </template>
            </div>
          </nav>

          <!-- Drawer footer -->
          <div class="drawer-footer">
            <button class="drawer-theme-btn" @click="isDark = !isDark">
              <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
              {{ isDark ? 'Mode clair' : 'Mode sombre' }}
            </button>

            <div class="drawer-settings">
              <div class="settings-section">
                <p class="settings-label">Modules</p>
                <label v-for="mod in DASHBOARD_MODULES" :key="mod.key" class="settings-row">
                  <span class="settings-text text-xs">{{ mod.label }}</span>
                  <USwitch
                    :model-value="isVisible(mod.key)"
                    size="xs"
                    @update:model-value="$event ? show(mod.key) : hide(mod.key)"
                  />
                </label>
                <button v-if="hiddenCount > 0" class="settings-reset" @click="showAll()">
                  Tout reafficher
                </button>
              </div>
              <div class="separator-gold" />
              <div class="settings-section">
                <p class="settings-label">Planning</p>
                <label v-for="opt in PLANNING_DISPLAY_OPTIONS" :key="opt.value" class="settings-radio text-xs">
                  <input type="radio" name="mobile-planning-mode" :value="opt.value" :checked="planningMode === opt.value" @change="setPlanningMode(opt.value)" />
                  {{ opt.label }}
                </label>
              </div>
              <div class="separator-gold" />
              <div class="settings-section">
                <p class="settings-label">Presence</p>
                <label v-for="opt in PRESENCE_DISPLAY_OPTIONS" :key="opt.value" class="settings-radio text-xs">
                  <input type="radio" name="mobile-presence-mode" :value="opt.value" :checked="presenceMode === opt.value" @change="setPresenceMode(opt.value)" />
                  {{ opt.label }}
                </label>
              </div>
            </div>

            <NuxtLink
              to="/profil"
              class="drawer-profile"
              @click="mobileOpen = false"
            >
              <UAvatar :alt="userDisplayName" size="xs" />
              <span class="truncate">{{ userDisplayName }}</span>
            </NuxtLink>

            <button class="drawer-logout" @click="logout()">
              <UIcon name="i-lucide-log-out" class="size-4" />
              Se deconnecter
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================
   CSS Variables
   ============================ */
.intranet-root {
  --gold: #AF8F3C;
  --gold-dim: rgba(175, 143, 60, 0.25);
  --gold-faint: rgba(175, 143, 60, 0.08);
  --cream: #F7F0DE;
  --ink: #2c2419;
  --sidebar-w: 56px;

  display: flex;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--cream);
  color: var(--ink);
  font-family: 'Crimson Pro', Georgia, serif;
}
:global(.dark) .intranet-root {
  background-color: #1a2520;
  color: #e8e0d0;
}

/* ============================
   SIDEBAR
   ============================ */
.sidebar {
  display: none;
  flex-direction: column;
  align-items: center;
  width: var(--sidebar-w);
  flex-shrink: 0;
  padding: 10px 0 12px;
  border-right: 1px solid var(--gold-faint);
  background: linear-gradient(180deg, rgba(247, 240, 222, 0.6) 0%, rgba(245, 239, 224, 0.4) 100%);
  position: relative;
  z-index: 10;
}
:global(.dark) .sidebar {
  background: linear-gradient(180deg, rgba(26, 37, 32, 0.9) 0%, rgba(20, 30, 25, 0.95) 100%);
  border-color: rgba(175, 143, 60, 0.12);
}

@media (min-width: 1024px) {
  .sidebar { display: flex; }
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
}
.sidebar-logo:hover { transform: scale(1.08); }
.sidebar-logo.is-active { transform: scale(1.1); }

.sidebar-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.5rem;
  color: var(--gold);
  opacity: 0.5;
  line-height: 1;
  transition: opacity 0.3s;
}
.sidebar-logo:hover .sidebar-glyph,
.sidebar-logo.is-active .sidebar-glyph {
  opacity: 1;
}

.sidebar-sep {
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  opacity: 0.25;
  margin: 6px 0;
}

/* Nav icons */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
}

.sidebar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  color: var(--ink);
  opacity: 0.35;
  transition: all 0.25s ease;
  position: relative;
}
:global(.dark) .sidebar-icon {
  color: #e8e0d0;
  opacity: 0.4;
}
.sidebar-icon:hover {
  opacity: 0.7;
  background: var(--gold-faint);
}
.sidebar-icon.is-active {
  opacity: 1;
  color: var(--gold);
  background: rgba(175, 143, 60, 0.1);
}
.sidebar-icon.is-active::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 16px;
  background: var(--gold);
  border-radius: 1px;
  opacity: 0.6;
}

/* Bottom section */
.sidebar-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.sidebar-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  transition: background 0.2s;
}
.sidebar-avatar:hover {
  background: var(--gold-faint);
}
.sidebar-avatar.is-director :deep(span) {
  box-shadow: 0 0 0 2px var(--gold);
  border-radius: 9999px;
}

/* ============================
   MAIN AREA
   ============================ */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* ============================
   TAB BAR
   ============================ */
.tab-bar {
  display: none;
  border-bottom: 1px solid var(--gold-faint);
  background: rgba(247, 240, 222, 0.5);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}
:global(.dark) .tab-bar {
  background: rgba(26, 37, 32, 0.6);
  border-color: rgba(175, 143, 60, 0.1);
}

@media (min-width: 1024px) {
  .tab-bar { display: block; }
}

.tab-bar-inner {
  display: flex;
  align-items: end;
  padding: 0 20px;
}

.tab-list {
  display: flex;
  align-items: end;
  gap: 0;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--ink);
  opacity: 0.4;
  position: relative;
  transition: opacity 0.25s, color 0.25s;
  white-space: nowrap;
}
:global(.dark) .tab-item {
  color: #e8e0d0;
}
.tab-item:hover {
  opacity: 0.7;
}
.tab-item.is-active {
  opacity: 1;
  color: var(--gold);
}
.tab-item.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1.5px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
}
.tab-item.is-disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

/* ============================
   PAGE CONTENT
   ============================ */
.page-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Mobile menu */
.mobile-menu-btn {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 50;
  display: block;
}
@media (min-width: 1024px) {
  .mobile-menu-btn { display: none; }
}

.mobile-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(247, 240, 222, 0.9);
  border: 1px solid var(--gold-faint);
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s, box-shadow 0.2s;
}
:global(.dark) .mobile-menu-trigger {
  background: rgba(26, 37, 32, 0.9);
  color: #e8e0d0;
  border-color: rgba(175, 143, 60, 0.15);
}
.mobile-menu-trigger:active {
  transform: scale(0.95);
}

/* ============================
   MOBILE DRAWER
   ============================ */
.mobile-drawer {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 61;
  width: 280px;
  background: var(--cream);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
:global(.dark) .mobile-drawer {
  background: #1a2520;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
}

@media (min-width: 1024px) {
  .mobile-drawer { display: none; }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gold-faint);
  flex-shrink: 0;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--ink);
  opacity: 0.4;
  transition: opacity 0.2s, background 0.2s;
}
:global(.dark) .drawer-close { color: #e8e0d0; }
.drawer-close:hover {
  opacity: 0.8;
  background: var(--gold-faint);
}

.drawer-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--gold);
  opacity: 0.6;
  padding: 0 12px;
  margin-bottom: 4px;
}

.drawer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  color: var(--ink);
  opacity: 0.55;
  transition: all 0.2s;
}
:global(.dark) .drawer-link { color: #e8e0d0; }
.drawer-link:hover {
  opacity: 0.85;
  background: var(--gold-faint);
}
.drawer-link.is-active {
  opacity: 1;
  color: var(--gold);
  background: rgba(175, 143, 60, 0.08);
}
.drawer-link.is-disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.drawer-footer {
  border-top: 1px solid var(--gold-faint);
  padding: 12px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--ink);
  opacity: 0.5;
  transition: opacity 0.2s;
}
:global(.dark) .drawer-theme-btn { color: #e8e0d0; }
.drawer-theme-btn:hover { opacity: 0.8; }

.drawer-settings {
  padding: 10px;
  border-radius: 8px;
  background: rgba(175, 143, 60, 0.04);
  border: 1px solid var(--gold-faint);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
:global(.dark) .drawer-settings {
  background: rgba(175, 143, 60, 0.03);
}

.drawer-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s, background 0.2s;
}
.drawer-profile:hover {
  opacity: 1;
  background: var(--gold-faint);
}

.drawer-logout {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-brand-terracotta);
  opacity: 0.7;
  transition: opacity 0.2s, background 0.2s;
}
.drawer-logout:hover {
  opacity: 1;
  background: rgba(183, 77, 52, 0.06);
}

/* ============================
   SETTINGS POPOVER (shared)
   ============================ */
.settings-popover {
  padding: 12px;
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 70vh;
  overflow-y: auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--gold);
  opacity: 0.7;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
}

.settings-text {
  font-size: 13px;
  color: var(--ink);
  opacity: 0.7;
}
:global(.dark) .settings-text { color: #e8e0d0; }

.settings-reset {
  font-size: 12px;
  color: var(--gold);
  opacity: 0.7;
  text-align: left;
  transition: opacity 0.2s;
}
.settings-reset:hover { opacity: 1; }

.settings-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ink);
  opacity: 0.7;
}
:global(.dark) .settings-radio { color: #e8e0d0; }
.settings-radio input[type="radio"] {
  accent-color: var(--gold);
}
</style>

<style>
/* Global styles for intranet root background */
html:has(.intranet-root) {
  background-color: #F7F0DE;
  transition: background-color 0.3s ease;
}
html.dark:has(.intranet-root) {
  background-color: #1a2520;
}
</style>
