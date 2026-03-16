<script setup lang="ts">
import { DASHBOARD_MODULES, PLANNING_DISPLAY_OPTIONS, PRESENCE_DISPLAY_OPTIONS } from '~/composables/useDashboardPreferences'

const { user, logout, isDirecteur, roleName, isProspecteur } = useAuth()
const config = useRuntimeConfig()
const cmsUrl = config.public.cmsUrl as string
const route = useRoute()
const mobileOpen = ref(false)
const expandedDomains = ref<Set<string>>(new Set())
const { isVisible, show, hide, hiddenCount, showAll, planningMode, setPlanningMode, presenceMode, setPresenceMode } = useDashboardPreferences()
const { hasSites } = useSiteMonitor()
const { toggle: searchToggle } = useGlobalSearch()

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

function toggleDomain(id: string) {
  const s = expandedDomains.value
  if (s.has(id)) s.delete(id)
  else s.add(id)
}

// Auto-expand active domain when drawer opens
watch(mobileOpen, (open) => {
  if (open && activeDomain.value) {
    expandedDomains.value.add(activeDomain.value.id)
  }
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
      prefixes: ['/planning', '/emploi-du-temps', '/equipe', '/stages', '/offres', '/candidats'],
      tabs: [
        { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/planning' },
        { label: 'Emploi du temps', icon: 'i-lucide-clock', to: '/emploi-du-temps' },
        { label: 'Equipe', icon: 'i-lucide-users', to: '/equipe' },
        ...(isDirecteur.value ? [
          { label: 'Stages', icon: 'i-lucide-graduation-cap', to: '/stages' },
          { label: 'Offres', icon: 'i-lucide-megaphone', to: '/offres' },
          { label: 'Candidats', icon: 'i-lucide-user-search', to: '/candidats' }
        ] : [])
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
        { label: 'Tickets', icon: 'i-lucide-ticket', to: '/projets/tickets' },
        ...(hasSites.value || isDirecteur.value ? [{ label: 'Sites', icon: 'i-lucide-activity', to: '/projets/status' }] : [])
      ]
    }
  ]

  list.push({
    id: 'clients',
    label: 'Clients',
    icon: 'i-lucide-target',
    to: '/prospection',
    prefixes: ['/prospection', '/clients'],
    tabs: [
          { label: 'Prospection', icon: 'i-lucide-target', to: '/prospection' },
          ...(isProspecteur.value ? [{ label: 'Clients', icon: 'i-lucide-building', to: '/clients' }] : [])
        ]
  })

  list.push({
    id: 'ressources',
    label: 'Ressources',
    icon: 'i-lucide-book-open',
    to: '/wiki',
    prefixes: ['/wiki'],
    tabs: []
  })

  if (isDirecteur.value) {
    list.push({
      id: 'articles',
      label: 'Articles',
      icon: 'i-lucide-feather',
      to: '/admin/articles',
      prefixes: ['/admin/articles'],
      tabs: []
    })
  }

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
    ...(isDirecteur.value ? [{ label: 'Administration', icon: 'i-lucide-shield', to: '/admin' }] : []),
    ...(isDirecteur.value && cmsUrl ? [{ label: 'Directus', icon: 'i-lucide-database', onSelect: () => window.open(cmsUrl, '_blank') }] : [])
  ],
  [{ label: 'Se deconnecter', icon: 'i-lucide-log-out', onSelect: () => logout() }]
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
        <UTooltip text="Rechercher (Ctrl+K)" :delay-duration="300">
          <button class="sidebar-icon" @click="searchToggle">
            <UIcon name="i-lucide-search" class="size-4" />
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

        <UTooltip v-if="isDirecteur && cmsUrl" text="Directus" :delay-duration="300">
          <a :href="cmsUrl" target="_blank" rel="noopener" class="sidebar-icon">
            <UIcon name="i-lucide-database" class="size-4" />
          </a>
        </UTooltip>

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

      <!-- Global search -->
      <GlobalSearch />

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
        enter-active-class="transition-opacity duration-200 ease-out"
        leave-active-class="transition-opacity duration-150 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <aside v-if="mobileOpen" class="mobile-drawer">
          <!-- Drawer header -->
          <div class="drawer-header">
            <NuxtLink to="/dashboard" class="drawer-logo" @click="mobileOpen = false">
              <span class="drawer-logo-glyph">G</span>
              <div class="drawer-logo-text">
                <span class="drawer-logo-name">Le Geai</span>
                <span class="drawer-logo-role">{{ roleName }}</span>
              </div>
            </NuxtLink>
            <button class="drawer-close" @click="mobileOpen = false">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <!-- Drawer navigation -->
          <nav class="drawer-nav">
            <!-- Dashboard link -->
            <NuxtLink
              to="/dashboard"
              class="drawer-link drawer-link--dashboard"
              :class="{ 'is-active': isOnDashboard }"
              @click="mobileOpen = false"
            >
              <UIcon name="i-lucide-layout-dashboard" class="size-5" />
              Tableau de bord
            </NuxtLink>

            <!-- Domain groups -->
            <div v-for="domain in domains" :key="domain.id" class="drawer-group">
              <!-- Domain without tabs: simple link -->
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

              <!-- Domain with tabs: collapsible -->
              <template v-else>
                <button
                  class="drawer-group-toggle"
                  :class="{ 'is-active': isDomainActive(domain), 'is-open': expandedDomains.has(domain.id) }"
                  @click="toggleDomain(domain.id)"
                >
                  <UIcon :name="domain.icon" class="size-5" />
                  <span class="drawer-group-label">{{ domain.label }}</span>
                  <UIcon name="i-lucide-chevron-down" class="size-4 drawer-chevron" />
                </button>
                <div v-if="expandedDomains.has(domain.id)" class="drawer-group-items">
                  <template v-for="tab in domain.tabs" :key="tab.to">
                    <span v-if="tab.disabled" class="drawer-tab is-disabled">
                      <UIcon :name="tab.icon" class="size-4" />
                      {{ tab.label }}
                    </span>
                    <NuxtLink
                      v-else
                      :to="tab.to"
                      class="drawer-tab"
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
            <button class="drawer-action" @click="searchToggle(); mobileOpen = false">
              <UIcon name="i-lucide-search" class="size-5" />
              Rechercher
            </button>

            <NuxtLink
              to="/profil"
              class="drawer-action"
              @click="mobileOpen = false"
            >
              <UAvatar :alt="userDisplayName" size="sm" />
              <span class="truncate">{{ userDisplayName }}</span>
            </NuxtLink>

            <button class="drawer-action drawer-action--logout" @click="logout()">
              <UIcon name="i-lucide-log-out" class="size-5" />
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
  --parchment: #f5efe0;
  --ink: #2c2419;
  --sidebar-w: 56px;

  display: flex;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--cream);
  color: var(--ink);
  font-family: 'Crimson Pro', Georgia, serif;
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
  border-right: 1px solid rgba(175, 143, 60, 0.15);
  background: linear-gradient(180deg, #ede5d0 0%, #e8dfc8 100%);
  position: relative;
  z-index: 10;
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
  opacity: 0.3;
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
  opacity: 0.4;
  transition: all 0.25s ease;
  position: relative;
}
.sidebar-icon:hover {
  opacity: 0.7;
  background: rgba(175, 143, 60, 0.08);
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
  position: relative;
  z-index: 1;
}

/* ============================
   TAB BAR
   ============================ */
.tab-bar {
  display: block;
  border-bottom: 1px solid rgba(175, 143, 60, 0.12);
  background: #f0e8d4;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}
@media (max-width: 1023px) {
  .tab-bar { display: none; }
}

.tab-bar-inner {
  display: flex;
  align-items: end;
  padding: 0 20px;
}
@media (max-width: 1023px) {
  .tab-bar-inner { padding: 0 12px; }
}

.tab-list {
  display: flex;
  align-items: end;
  gap: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tab-list::-webkit-scrollbar { display: none; }

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
@media (max-width: 1023px) {
  .tab-item {
    padding: 12px 14px;
    min-height: 44px;
  }
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
@media (max-width: 1023px) {
  .page-content {
    padding-top: 58px;
  }
}

/* Mobile menu */
.mobile-menu-btn {
  position: fixed;
  top: 10px;
  left: 10px;
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
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #ede5d0;
  border: 1px solid #d4c9a8;
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(44, 36, 25, 0.15);
  transition: transform 0.1s;
}
.mobile-menu-trigger:active {
  transform: scale(0.93);
  background: #e6dcc4;
}

/* ============================
   MOBILE DRAWER
   ============================ */
/* ============================
   MOBILE DRAWER
   ============================ */
.mobile-drawer {
  position: fixed;
  inset: 0;
  z-index: 61;
  background: #ede5d0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 1024px) {
  .mobile-drawer { display: none; }
}

/* ── Header ── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #d4c9a8;
  flex-shrink: 0;
  background: #e6dcc4;
}
.drawer-logo {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: var(--ink);
}
.drawer-logo-glyph {
  font-family: 'UnifrakturCook', cursive;
  font-size: 1.6rem;
  color: #fff;
  line-height: 1;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--gold);
}
.drawer-logo-text {
  display: flex;
  flex-direction: column;
}
.drawer-logo-name {
  font-family: 'IM Fell DW Pica', Georgia, serif;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  color: var(--ink);
}
.drawer-logo-role {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
  margin-top: 1px;
}
.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  color: var(--ink);
  opacity: 0.5;
}
.drawer-close:active {
  opacity: 1;
  background: #d9cfb3;
}

/* ── Navigation ── */
.drawer-nav {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Dashboard link */
.drawer-link--dashboard {
  background: #e6dcc4;
  border-left: 3px solid var(--gold);
  border-radius: 0 10px 10px 0;
  margin-bottom: 4px;
}
.drawer-link--dashboard.is-active {
  background: #ddd2b4;
}

/* Domain groups */
.drawer-group {
  border-radius: 0;
}
.drawer-group + .drawer-group {
  border-top: 1px solid #d4c9a8;
}

/* Collapsible toggle */
.drawer-group-toggle {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  min-height: 52px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  opacity: 0.65;
  transition: background 0.1s;
}
.drawer-group-toggle:active {
  background: #d9cfb3;
}
.drawer-group-toggle.is-active {
  color: var(--gold);
  opacity: 1;
}
.drawer-group-label {
  flex: 1;
  text-align: left;
}
.drawer-chevron {
  opacity: 0.4;
  transition: transform 0.2s ease;
}
.drawer-group-toggle.is-open .drawer-chevron {
  transform: rotate(180deg);
}

/* Expanded items */
.drawer-group-items {
  display: flex;
  flex-direction: column;
  padding: 0 4px 8px 20px;
  border-left: 2px solid #d4c9a8;
  margin-left: 28px;
  margin-bottom: 4px;
}

/* Links (standalone domains) */
.drawer-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  min-height: 52px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  color: var(--ink);
  transition: background 0.1s;
}
.drawer-link:active {
  background: #d9cfb3;
}
.drawer-link.is-active {
  color: var(--gold);
  background: #e6dcc4;
  font-weight: 600;
}

/* Tab links inside groups */
.drawer-tab {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  min-height: 48px;
  border-radius: 8px;
  font-size: 15px;
  text-decoration: none;
  color: var(--ink);
  opacity: 0.7;
  transition: background 0.1s;
}
.drawer-tab:active {
  background: #d9cfb3;
}
.drawer-tab.is-active {
  opacity: 1;
  color: var(--gold);
  background: #e6dcc4;
  font-weight: 600;
  border-left: 3px solid var(--gold);
  border-radius: 0 8px 8px 0;
  padding-left: 13px;
}
.drawer-tab.is-disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

/* ── Footer ── */
.drawer-footer {
  border-top: 1px solid #d4c9a8;
  padding: 10px 12px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #e6dcc4;
}
.drawer-action {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  min-height: 52px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  color: var(--ink);
  width: 100%;
  transition: background 0.1s;
}
.drawer-action:active {
  background: #d9cfb3;
}
.drawer-action--logout {
  color: #B74D34;
  font-weight: 600;
}
.drawer-action--logout:active {
  background: #e0cdb5;
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
  min-height: 40px;
  padding: 4px 0;
}

.settings-text {
  font-size: 13px;
  color: var(--ink);
  opacity: 0.7;
}

.settings-reset {
  font-size: 13px;
  color: var(--gold);
  opacity: 0.7;
  text-align: left;
  padding: 6px 0;
  min-height: 36px;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
}
.settings-reset:hover { opacity: 1; }

.settings-radio {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--ink);
  opacity: 0.7;
  min-height: 40px;
  padding: 4px 0;
}
.settings-radio input[type="radio"] {
  accent-color: var(--gold);
  width: 18px;
  height: 18px;
}
</style>

<style>
/* Global styles for intranet root background */
html:has(.intranet-root) {
  background-color: #F7F0DE;
}
</style>
