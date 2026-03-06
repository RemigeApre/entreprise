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
  requestAnimationFrame(() => { visible.value = true })
})
</script>

<template>
  <div class="relative flex flex-col items-center justify-center h-full overflow-hidden select-none">

    <!-- Parchment ambient background -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="absolute inset-0 bg-gradient-to-b from-stone-50 via-amber-50/20 to-stone-100/50 dark:from-stone-950 dark:via-stone-900/50 dark:to-stone-950" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-amber-100/30 via-transparent to-transparent dark:from-amber-900/8 blur-3xl" />
    </div>

    <!-- Decorative corner ornaments -->
    <div class="absolute inset-6 sm:inset-10 pointer-events-none" aria-hidden="true">
      <!-- Top-left -->
      <div class="absolute top-0 left-0 w-8 h-8 border-t border-l border-stone-300/40 dark:border-stone-700/30 rounded-tl-sm" />
      <!-- Top-right -->
      <div class="absolute top-0 right-0 w-8 h-8 border-t border-r border-stone-300/40 dark:border-stone-700/30 rounded-tr-sm" />
      <!-- Bottom-left -->
      <div class="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-stone-300/40 dark:border-stone-700/30 rounded-bl-sm" />
      <!-- Bottom-right -->
      <div class="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-stone-300/40 dark:border-stone-700/30 rounded-br-sm" />
    </div>

    <!-- Central content -->
    <div class="relative z-10 flex flex-col items-center text-center px-6">

      <!-- Small decorative element above logo -->
      <div
        class="mb-6 flex items-center gap-3 transition-all duration-1000 ease-out"
        :class="visible ? 'opacity-60 translate-y-0' : 'opacity-0 -translate-y-4'"
      >
        <div class="w-8 h-px bg-stone-400/40 dark:bg-stone-600/40" />
        <div class="size-1.5 rotate-45 bg-stone-400/50 dark:bg-stone-600/40" />
        <div class="w-8 h-px bg-stone-400/40 dark:bg-stone-600/40" />
      </div>

      <!-- Logo -->
      <div
        class="relative mb-6 transition-all duration-1000 delay-100 ease-out"
        :class="visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
      >
        <img
          src="/logo.svg"
          alt="Le Geai"
          class="size-20 sm:size-24 logo-float"
        />
      </div>

      <!-- Title -->
      <h1
        class="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 transition-all duration-1000 delay-200 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        Le Geai
      </h1>

      <!-- Gold separator -->
      <div
        class="w-16 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)]/50 to-transparent mt-4 mb-3 transition-all duration-1000 delay-300 ease-out"
        :class="visible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'"
      />

      <!-- Slogan -->
      <p
        class="text-sm sm:text-base text-stone-500 dark:text-stone-400 tracking-[0.15em] uppercase font-light transition-all duration-1000 delay-400 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'"
      >
        Edition &middot; Informatique &middot; Medias
      </p>

      <!-- Motto -->
      <p
        class="mt-5 text-xs sm:text-sm text-stone-400 dark:text-stone-500 max-w-xs leading-relaxed italic font-serif transition-all duration-1000 delay-500 ease-out"
        :class="visible ? 'opacity-70 translate-y-0' : 'opacity-0 translate-y-3'"
      >
        &laquo; Creer avec exigence, partager avec sincerite &raquo;
      </p>

      <!-- Small decorative element below -->
      <div
        class="mt-6 flex items-center gap-3 transition-all duration-1000 delay-600 ease-out"
        :class="visible ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <div class="w-5 h-px bg-stone-400/40 dark:bg-stone-600/40" />
        <div class="size-1 rounded-full bg-stone-400/50 dark:bg-stone-600/40" />
        <div class="w-5 h-px bg-stone-400/40 dark:bg-stone-600/40" />
      </div>
    </div>
  </div>
</template>
