<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

interface NavItem {
  label: string
  icon: string
  to?: string
  href?: string
  disabled?: boolean
  tooltip?: string
}

const nav: NavItem[] = [
  { label: 'Edition', icon: 'i-lucide-book-open', disabled: true, tooltip: 'Site en refonte' },
  { label: 'Informatique', icon: 'i-lucide-monitor', href: 'https://legeai-informatique.fr' },
  { label: 'Medias', icon: 'i-lucide-play-circle', href: 'https://bergfrid.com' },
  { label: 'Recrutement', icon: 'i-lucide-briefcase', to: '/recrutement' },
  { label: 'Notre identite', icon: 'i-lucide-feather', to: '/le-geai' },
  { label: 'Nous soutenir', icon: 'i-lucide-heart', to: '/soutenir' }
]

function isActive(item: NavItem) {
  if (!item.to) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}
</script>

<template>
  <div class="flex flex-col h-dvh overflow-hidden bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">

    <!-- Top bar: login + theme -->
    <header class="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4">
      <NuxtLink
        to="/login"
        class="flex items-center gap-2 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors duration-300"
        aria-label="Se connecter"
      >
        <div class="size-9 rounded-full border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-center bg-white/40 dark:bg-stone-900/40 backdrop-blur-sm">
          <UIcon name="i-lucide-user" class="size-4" />
        </div>
      </NuxtLink>

      <button
        class="size-9 rounded-full border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-center bg-white/40 dark:bg-stone-900/40 backdrop-blur-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors duration-300"
        :aria-label="isDark ? 'Mode clair' : 'Mode sombre'"
        @click="isDark = !isDark"
      >
        <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-4" />
      </button>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- Bottom navigation -->
    <nav class="shrink-0 border-t border-stone-200/40 dark:border-stone-800/40 bg-white/60 dark:bg-stone-900/60 backdrop-blur-xl">
      <div class="max-w-3xl mx-auto grid grid-cols-6">
        <template v-for="item in nav" :key="item.label">
          <!-- Disabled tab -->
          <UTooltip v-if="item.disabled" :text="item.tooltip || ''" :delay-duration="200">
            <div class="flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 cursor-not-allowed opacity-25">
              <UIcon :name="item.icon" class="size-4.5" />
              <span class="text-[9px] sm:text-[10px] font-medium tracking-wide truncate max-w-full">{{ item.label }}</span>
            </div>
          </UTooltip>

          <!-- External link -->
          <a
            v-else-if="item.href"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-300"
          >
            <UIcon :name="item.icon" class="size-4.5" />
            <span class="text-[9px] sm:text-[10px] font-medium tracking-wide truncate max-w-full">{{ item.label }}</span>
          </a>

          <!-- Internal link -->
          <NuxtLink
            v-else
            :to="item.to!"
            class="flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors duration-300 relative"
            :class="isActive(item)
              ? 'text-stone-900 dark:text-white'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200'"
          >
            <span
              v-if="isActive(item)"
              class="absolute top-0 inset-x-3 h-0.5 bg-stone-900 dark:bg-white rounded-full nav-indicator"
            />
            <UIcon :name="item.icon" class="size-4.5" />
            <span class="text-[9px] sm:text-[10px] font-medium tracking-wide truncate max-w-full">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </div>
    </nav>
  </div>
</template>
