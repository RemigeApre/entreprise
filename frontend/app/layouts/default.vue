<script setup lang="ts">
import { DASHBOARD_MODULES, PLANNING_DISPLAY_OPTIONS, PRESENCE_DISPLAY_OPTIONS } from '~/composables/useDashboardPreferences'

const { user, logout, isDirecteur, roleName } = useAuth()
const colorMode = useColorMode()
const route = useRoute()
const mobileOpen = ref(false)
const { isVisible, show, hide, hiddenCount, showAll, planningMode, setPlanningMode, presenceMode, setPresenceMode } = useDashboardPreferences()

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
      prefixes: ['/planning', '/equipe', '/offres'],
      tabs: [
        { label: 'Calendrier', icon: 'i-lucide-calendar', to: '/planning' },
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
        { label: 'Sites', icon: 'i-lucide-activity', to: '/projets/status', disabled: true }
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

  if (isDirecteur.value) {
    list.push({
      id: 'admin',
      label: 'Admin',
      icon: 'i-lucide-shield',
      to: '/admin/utilisateurs',
      prefixes: ['/admin'],
      tabs: [
        { label: 'Utilisateurs', icon: 'i-lucide-users', to: '/admin/utilisateurs' }
      ]
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
  // Longest prefix match: check if a more specific tab matches
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

const userMenuItems = [
  [{ label: 'Mon profil', icon: 'i-lucide-user', to: '/profil' }],
  [{ label: 'Se deconnecter', icon: 'i-lucide-log-out', click: () => logout() }]
]
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-white dark:bg-stone-950">

    <!-- ========================================================== -->
    <!-- DESKTOP: Icon Rail                                         -->
    <!-- ========================================================== -->
    <aside class="hidden lg:flex flex-col items-center w-[60px] shrink-0 border-r border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/40">
      <!-- Logo = Dashboard -->
      <UTooltip text="Tableau de bord" :delay-duration="300">
        <NuxtLink to="/dashboard" class="flex items-center justify-center h-14 shrink-0 group">
          <img
            src="/logo.svg"
            alt="Le Geai"
            class="size-8 transition-all duration-200"
            :class="isOnDashboard
              ? 'scale-110'
              : 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105'"
          />
        </NuxtLink>
      </UTooltip>

      <div class="w-8 h-px bg-stone-200 dark:bg-stone-800 mb-2" />

      <!-- Domain icons -->
      <nav class="flex-1 flex flex-col items-center gap-1 px-2 py-1">
        <UTooltip v-for="domain in domains" :key="domain.id" :text="domain.label" :delay-duration="300">
          <NuxtLink
            :to="domain.to"
            class="flex items-center justify-center size-10 rounded-lg transition-all duration-150"
            :class="isDomainActive(domain)
              ? 'bg-primary/10 text-primary shadow-sm'
              : 'text-stone-400 dark:text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 hover:text-stone-700 dark:hover:text-stone-300'"
          >
            <UIcon :name="domain.icon" class="size-5" />
          </NuxtLink>
        </UTooltip>
      </nav>

      <!-- Bottom: theme + settings + user -->
      <div class="flex flex-col items-center gap-1.5 pb-3 px-2">
        <UTooltip :text="isDark ? 'Mode clair' : 'Mode sombre'" :delay-duration="300">
          <button
            class="flex items-center justify-center size-9 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            @click="isDark = !isDark"
          >
            <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
          </button>
        </UTooltip>
        <UPopover>
          <UTooltip text="Parametres" :delay-duration="300">
            <button
              class="relative flex items-center justify-center size-9 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              <UIcon name="i-lucide-settings" class="size-4" />
              <span
                v-if="hiddenCount > 0"
                class="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold"
              >
                {{ hiddenCount }}
              </span>
            </button>
          </UTooltip>
          <template #content>
            <div class="p-3 w-64 space-y-4 max-h-[70vh] overflow-y-auto">
              <div class="space-y-2">
                <p class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Modules</p>
                <label
                  v-for="mod in DASHBOARD_MODULES"
                  :key="mod.key"
                  class="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span class="text-sm text-stone-700 dark:text-stone-300">{{ mod.label }}</span>
                  <USwitch
                    :model-value="isVisible(mod.key)"
                    size="xs"
                    @update:model-value="$event ? show(mod.key) : hide(mod.key)"
                  />
                </label>
                <button
                  v-if="hiddenCount > 0"
                  class="text-xs text-primary hover:underline"
                  @click="showAll()"
                >
                  Tout reafficher
                </button>
              </div>
              <div class="h-px bg-stone-200 dark:bg-stone-700" />
              <div class="space-y-1.5">
                <p class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Affichage planning</p>
                <div class="space-y-1">
                  <label
                    v-for="opt in PLANNING_DISPLAY_OPTIONS"
                    :key="opt.value"
                    class="flex items-center gap-2 cursor-pointer text-sm text-stone-700 dark:text-stone-300"
                  >
                    <input
                      type="radio"
                      name="planning-mode"
                      :value="opt.value"
                      :checked="planningMode === opt.value"
                      class="accent-primary"
                      @change="setPlanningMode(opt.value)"
                    />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
              <div class="h-px bg-stone-200 dark:bg-stone-700" />
              <div class="space-y-1.5">
                <p class="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Affichage presence</p>
                <div class="space-y-1">
                  <label
                    v-for="opt in PRESENCE_DISPLAY_OPTIONS"
                    :key="opt.value"
                    class="flex items-center gap-2 cursor-pointer text-sm text-stone-700 dark:text-stone-300"
                  >
                    <input
                      type="radio"
                      name="presence-mode"
                      :value="opt.value"
                      :checked="presenceMode === opt.value"
                      class="accent-primary"
                      @change="setPresenceMode(opt.value)"
                    />
                    {{ opt.label }}
                  </label>
                </div>
              </div>
            </div>
          </template>
        </UPopover>
        <UDropdownMenu :items="userMenuItems">
          <button
            class="flex items-center justify-center size-9 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
            :class="isDirecteur ? 'ring-1 ring-amber-400/50' : ''"
          >
            <UAvatar
              :alt="userDisplayName"
              size="xs"
              :class="isDirecteur ? 'ring-2 ring-amber-500' : ''"
            />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <!-- ========================================================== -->
    <!-- Main Content Area                                          -->
    <!-- ========================================================== -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Domain tab bar (desktop, shown when ≥ 2 tabs) -->
      <div v-if="activeTabs.length >= 2" class="hidden lg:block border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0">
        <div class="flex items-center gap-0.5 px-4 -mb-px overflow-x-auto">
          <span class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mr-3 shrink-0 py-2.5">
            {{ activeDomain?.label }}
          </span>
          <component
            :is="tab.disabled ? 'span' : 'NuxtLink'"
            v-for="tab in activeTabs"
            :key="tab.to"
            :to="tab.disabled ? undefined : tab.to"
            class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0"
            :class="[
              tab.disabled
                ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed border-transparent'
                : isTabActive(tab)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-stone-600'
            ]"
          >
            <UIcon :name="tab.icon" class="size-4" />
            {{ tab.label }}
          </component>
        </div>
      </div>

      <!-- Page content -->
      <div class="flex-1 overflow-hidden bg-watermark relative">
        <!-- Mobile menu button -->
        <div class="fixed top-3 left-3 z-50 lg:hidden">
          <button
            class="flex items-center justify-center size-10 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm active:scale-95 transition-transform"
            @click="mobileOpen = true"
          >
            <UIcon name="i-lucide-menu" class="size-5 text-stone-700 dark:text-stone-300" />
          </button>
        </div>
        <slot />
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- MOBILE: Slide-in drawer                                    -->
    <!-- ========================================================== -->
    <Teleport to="body">
      <!-- Backdrop -->
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

      <!-- Drawer panel -->
      <Transition
        enter-active-class="transition-transform duration-250 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        enter-from-class="-translate-x-full"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="mobileOpen"
          class="fixed inset-y-0 left-0 z-[61] w-72 bg-white dark:bg-stone-900 shadow-2xl lg:hidden flex flex-col overflow-y-auto"
        >
          <!-- Drawer header -->
          <div class="flex items-center justify-between px-4 h-14 border-b border-stone-200 dark:border-stone-800 shrink-0">
            <NuxtLink to="/dashboard" class="flex items-center gap-2" @click="mobileOpen = false">
              <img src="/logo.svg" alt="Le Geai" class="size-7" />
              <span class="font-heading font-bold text-lg tracking-tight">Le Geai</span>
            </NuxtLink>
            <button
              class="flex items-center justify-center size-8 rounded-md text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              @click="mobileOpen = false"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>

          <!-- Drawer navigation -->
          <nav class="flex-1 px-3 py-4 space-y-5">
            <div v-for="domain in domains" :key="domain.id">
              <!-- Domain with no tabs: single link -->
              <NuxtLink
                v-if="domain.tabs.length === 0"
                :to="domain.to"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="isDomainActive(domain)
                  ? 'bg-primary/10 text-primary'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'"
                @click="mobileOpen = false"
              >
                <UIcon :name="domain.icon" class="size-5" />
                {{ domain.label }}
              </NuxtLink>

              <!-- Domain with tabs: section header + sub-links -->
              <template v-else>
                <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-3 mb-1">
                  {{ domain.label }}
                </p>
                <div class="space-y-0.5">
                  <component
                    :is="tab.disabled ? 'span' : 'NuxtLink'"
                    v-for="tab in domain.tabs"
                    :key="tab.to"
                    :to="tab.disabled ? undefined : tab.to"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    :class="[
                      tab.disabled
                        ? 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
                        : isTabActive(tab)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    ]"
                    @click="!tab.disabled && (mobileOpen = false)"
                  >
                    <UIcon :name="tab.icon" class="size-4" />
                    {{ tab.label }}
                  </component>
                </div>
              </template>
            </div>
          </nav>

          <!-- Drawer footer -->
          <div class="border-t border-stone-200 dark:border-stone-800 px-3 py-3 shrink-0 space-y-2">
            <div class="flex items-center justify-between px-2">
              <button
                class="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                @click="isDark = !isDark"
              >
                <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
                {{ isDark ? 'Mode clair' : 'Mode sombre' }}
              </button>
            </div>
            <!-- Settings: dashboard modules -->
            <div class="px-2 py-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 space-y-3">
              <div class="space-y-2">
                <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Modules</p>
                <label
                  v-for="mod in DASHBOARD_MODULES"
                  :key="mod.key"
                  class="flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span class="text-xs text-stone-600 dark:text-stone-400">{{ mod.label }}</span>
                  <USwitch
                    :model-value="isVisible(mod.key)"
                    size="xs"
                    @update:model-value="$event ? show(mod.key) : hide(mod.key)"
                  />
                </label>
                <button
                  v-if="hiddenCount > 0"
                  class="text-xs text-primary hover:underline"
                  @click="showAll()"
                >
                  Tout reafficher
                </button>
              </div>
              <div class="h-px bg-stone-200 dark:bg-stone-700" />
              <div class="space-y-1.5">
                <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Planning</p>
                <label
                  v-for="opt in PLANNING_DISPLAY_OPTIONS"
                  :key="opt.value"
                  class="flex items-center gap-2 cursor-pointer text-xs text-stone-600 dark:text-stone-400"
                >
                  <input type="radio" name="mobile-planning-mode" :value="opt.value" :checked="planningMode === opt.value" class="accent-primary" @change="setPlanningMode(opt.value)" />
                  {{ opt.label }}
                </label>
              </div>
              <div class="h-px bg-stone-200 dark:bg-stone-700" />
              <div class="space-y-1.5">
                <p class="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Presence</p>
                <label
                  v-for="opt in PRESENCE_DISPLAY_OPTIONS"
                  :key="opt.value"
                  class="flex items-center gap-2 cursor-pointer text-xs text-stone-600 dark:text-stone-400"
                >
                  <input type="radio" name="mobile-presence-mode" :value="opt.value" :checked="presenceMode === opt.value" class="accent-primary" @change="setPresenceMode(opt.value)" />
                  {{ opt.label }}
                </label>
              </div>
            </div>
            <NuxtLink
              to="/profil"
              class="flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              @click="mobileOpen = false"
            >
              <UAvatar
                :alt="userDisplayName"
                size="xs"
                :class="isDirecteur ? 'ring-2 ring-amber-500' : ''"
              />
              <span class="truncate">{{ userDisplayName }}</span>
            </NuxtLink>
            <button
              class="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              @click="logout()"
            >
              <UIcon name="i-lucide-log-out" class="size-4" />
              Se deconnecter
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>
