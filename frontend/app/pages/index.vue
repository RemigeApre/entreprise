<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Groupe Le Geai - Edition, Informatique, Medias',
  description: 'Le Geai est un groupe pluridisciplinaire reunissant edition, services informatiques et production mediatique. Decouvrez notre univers.',
  ogTitle: 'Groupe Le Geai',
  ogDescription: 'Edition, Informatique, Medias - Un groupe, trois visions.',
  ogType: 'website',
  ogSiteName: 'Le Geai'
})

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: 'https://entreprise.legeai-editions.com' }]
})

const visible = ref(false)

onMounted(() => {
  // Stagger the entrance animation
  requestAnimationFrame(() => {
    visible.value = true
  })
})
</script>

<template>
  <div class="relative flex flex-col items-center justify-center min-h-full px-6 overflow-hidden">

    <!-- Ambient background -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <!-- Subtle radial glow -->
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-100/40 via-transparent to-transparent dark:from-amber-900/10 blur-3xl" />
      <div class="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-stone-200/30 via-transparent to-transparent dark:from-stone-800/20 blur-3xl" />
    </div>

    <!-- Content -->
    <div
      class="relative z-10 flex flex-col items-center text-center max-w-xl transition-all duration-1000 ease-out"
      :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
    >
      <!-- Logo -->
      <div class="relative mb-8">
        <img
          src="/logo.svg"
          alt="Le Geai"
          class="size-20 sm:size-28 logo-float"
        />
        <!-- Subtle ring around logo -->
        <div class="absolute inset-0 -m-3 rounded-full border border-stone-200/40 dark:border-stone-700/30 logo-ring" />
      </div>

      <!-- Title -->
      <h1 class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
        Le Geai
      </h1>

      <!-- Separator -->
      <div class="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mt-5 mb-4" />

      <!-- Slogan -->
      <p
        class="text-base sm:text-lg text-stone-500 dark:text-stone-400 font-light tracking-wide transition-all duration-1000 delay-300 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        Edition &middot; Informatique &middot; Medias
      </p>

      <!-- Subtitle -->
      <p
        class="mt-6 text-sm text-stone-400 dark:text-stone-500 max-w-sm leading-relaxed transition-all duration-1000 delay-500 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        Un groupe pluridisciplinaire au service de la creation, de la technologie et de l'information.
      </p>

      <!-- CTA -->
      <div
        class="mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-1000 delay-700 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <NuxtLink
          to="/le-geai"
          class="px-6 py-2.5 rounded-full text-sm font-medium bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition-colors duration-300 shadow-sm"
        >
          Decouvrir
        </NuxtLink>
        <NuxtLink
          to="/recrutement"
          class="px-6 py-2.5 rounded-full text-sm font-medium border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-500 transition-colors duration-300"
        >
          Nous rejoindre
        </NuxtLink>
      </div>
    </div>

    <!-- Scroll hint (only on landing) -->
    <div
      class="absolute bottom-20 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-1000 ease-out"
      :class="visible ? 'opacity-40' : 'opacity-0'"
    >
      <div class="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-600">
        <span class="text-[10px] uppercase tracking-[0.2em]">Explorer</span>
        <UIcon name="i-lucide-chevron-down" class="size-4 animate-bounce" />
      </div>
    </div>
  </div>
</template>
