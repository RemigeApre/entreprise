<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})

const links = [
  {
    title: 'Espace intranet',
    desc: 'Accedez a votre espace collaborateur',
    icon: 'i-lucide-log-in',
    color: 'amber',
    to: '/login',
    external: false,
    label: 'Se connecter',
    badge: null
  },
  {
    title: 'Services informatiques',
    desc: 'Decouvrez nos prestations informatiques',
    icon: 'i-lucide-monitor',
    color: 'blue',
    to: 'https://legeai-informatique.fr',
    external: true,
    label: 'Visiter le site',
    badge: null
  },
  {
    title: "Maison d'edition",
    desc: "Explorez notre catalogue d'ouvrages",
    icon: 'i-lucide-book-open',
    color: 'violet',
    to: 'https://legeai-editions.com',
    external: true,
    label: 'Visiter le site',
    badge: 'Bientot'
  },
  {
    title: 'Recrutement',
    desc: "Decouvrez nos offres d'emploi",
    icon: 'i-lucide-briefcase',
    color: 'emerald',
    to: '/recrutement',
    external: false,
    label: 'Voir les offres',
    badge: null
  }
]

const colorClasses: Record<string, { iconBg: string, icon: string, border: string, accent: string }> = {
  amber: {
    iconBg: 'bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500 dark:border-l-amber-600',
    accent: 'group-hover:border-amber-300 dark:group-hover:border-amber-700'
  },
  blue: {
    iconBg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    border: 'border-l-blue-400 dark:border-l-blue-600',
    accent: 'group-hover:border-blue-300 dark:group-hover:border-blue-700'
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    icon: 'text-violet-500',
    border: 'border-l-violet-400 dark:border-l-violet-600',
    accent: 'group-hover:border-violet-300 dark:group-hover:border-violet-700'
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'border-l-emerald-400 dark:border-l-emerald-600',
    accent: 'group-hover:border-emerald-300 dark:group-hover:border-emerald-700'
  }
}
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden">
    <!-- Theme toggle -->
    <div class="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="isDark = !isDark"
      />
    </div>

    <!-- Header with logo -->
    <header class="pt-10 sm:pt-14 text-center shrink-0 px-4">
      <div class="flex items-center justify-center mb-3">
        <img src="/logo.svg" alt="Le Geai" class="size-10 sm:size-14" />
      </div>
      <h1 class="font-heading text-2xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
        Groupe Le Geai
      </h1>
      <div class="w-10 h-px mx-auto mt-3 bg-amber-400/50 dark:bg-amber-600/40" />
      <p class="text-xs sm:text-sm text-stone-400 dark:text-stone-500 mt-3">
        Bienvenue sur notre portail
      </p>
    </header>

    <!-- Main content -->
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8">
      <!-- Mobile: banners -->
      <div class="flex flex-col gap-2.5 w-full max-w-md sm:hidden">
        <NuxtLink
          v-for="link in links"
          :key="link.title"
          :to="link.to"
          :external="link.external"
          :target="link.external ? '_blank' : undefined"
          class="group flex items-center gap-3.5 rounded-xl border border-stone-200 dark:border-stone-800 border-l-[3px] px-4 py-3.5 transition-all active:scale-[0.98]"
          :class="[colorClasses[link.color].border, colorClasses[link.color].accent]"
        >
          <div
            class="shrink-0 rounded-lg p-2"
            :class="colorClasses[link.color].iconBg"
          >
            <UIcon :name="link.icon" class="size-5" :class="colorClasses[link.color].icon" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {{ link.title }}
            </p>
            <p class="text-[11px] text-stone-400 dark:text-stone-500 truncate">{{ link.label }}</p>
          </div>
          <UBadge v-if="link.badge" variant="subtle" color="violet" size="xs">
            {{ link.badge }}
          </UBadge>
          <UIcon
            :name="link.external ? 'i-lucide-external-link' : 'i-lucide-chevron-right'"
            class="size-4 text-stone-300 dark:text-stone-600 shrink-0"
          />
        </NuxtLink>
      </div>

      <!-- Desktop: 2x2 cards -->
      <div class="hidden sm:grid grid-cols-2 gap-5 w-full max-w-2xl">
        <NuxtLink
          v-for="link in links"
          :key="link.title"
          :to="link.to"
          :external="link.external"
          :target="link.external ? '_blank' : undefined"
          class="group block rounded-2xl border border-stone-200 dark:border-stone-800 p-6 text-center transition-all hover:shadow-lg hover:shadow-stone-200/50 dark:hover:shadow-stone-900/50 hover:-translate-y-0.5"
          :class="colorClasses[link.color].accent"
        >
          <div
            class="rounded-full p-3 w-fit mx-auto mb-3"
            :class="colorClasses[link.color].iconBg"
          >
            <UIcon :name="link.icon" class="size-6" :class="colorClasses[link.color].icon" />
          </div>
          <h2 class="font-heading text-base font-semibold text-stone-900 dark:text-stone-100">
            {{ link.title }}
          </h2>
          <UBadge v-if="link.badge" variant="subtle" color="violet" size="xs" class="mt-1">
            {{ link.badge }}
          </UBadge>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-2 mb-4">
            {{ link.desc }}
          </p>
          <span
            class="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            :class="colorClasses[link.color].icon"
          >
            {{ link.label }}
            <UIcon
              :name="link.external ? 'i-lucide-external-link' : 'i-lucide-arrow-right'"
              class="size-4"
            />
          </span>
        </NuxtLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="pb-4 sm:pb-5 text-center shrink-0 space-y-1 px-4">
      <p class="text-[11px] text-stone-400 dark:text-stone-600">
        &copy; {{ new Date().getFullYear() }} Groupe Le Geai &mdash; Tous droits reserves
      </p>
      <p class="text-[10px] text-stone-300 dark:text-stone-700">
        Site realise par
        <a
          href="https://legeai-informatique.fr"
          target="_blank"
          class="underline hover:text-stone-500 dark:hover:text-stone-500 transition-colors"
        >Le Geai - Informatique</a>
      </p>
    </footer>
  </div>
</template>
