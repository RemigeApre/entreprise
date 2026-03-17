<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Nous soutenir - Le Geai',
  description: 'Soutenez le groupe Le Geai dans ses projets d\'édition, de création numérique et de production médiatique.',
  ogTitle: 'Nous soutenir - Le Geai',
  ogDescription: 'Accompagnez un groupe indépendant dans sa mission culturelle et numérique.'
})

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

const ways = [
  {
    icon: 'i-lucide-book-open',
    title: 'Acheter nos ouvrages',
    text: 'Chaque exemplaire vendu soutient directement notre travail éditorial et nos auteurs.'
  },
  {
    icon: 'i-lucide-share-2',
    title: 'Parler de nous',
    text: 'Le bouche-à-oreille reste notre meilleur allié. Partagez nos projets autour de vous.'
  },
  {
    icon: 'i-lucide-message-circle',
    title: 'Nous contacter',
    text: 'Une idée, un projet, une collaboration ? Écrivez-nous, chaque message est lu avec attention.'
  }
]
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <section class="px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 text-center">
      <div
        class="max-w-2xl mx-auto transition-all duration-1000 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <!-- Ornament -->
        <div class="flex items-center justify-center gap-3 mb-6 opacity-40">
          <div class="w-10 h-px bg-stone-400" />
          <div class="size-1.5 rotate-45 bg-stone-400" />
          <div class="w-10 h-px bg-stone-400" />
        </div>

        <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Nous soutenir
        </h1>
        <div class="w-14 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)]/50 to-transparent mx-auto mt-5 mb-4" />
        <p class="text-stone-500 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
          Le Geai est un projet indépendant. Votre soutien, sous toutes ses formes, nous permet de continuer à créer librement.
        </p>
      </div>
    </section>

    <!-- Ways to support -->
    <section class="px-6 pb-20">
      <div class="max-w-2xl mx-auto space-y-8">
        <div
          v-for="(way, i) in ways"
          :key="way.title"
          class="flex items-start gap-5 transition-all duration-700 ease-out"
          :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
          :style="{ transitionDelay: `${300 + i * 150}ms` }"
        >
          <div class="size-11 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200/60">
            <UIcon :name="way.icon" class="size-5 text-stone-500" />
          </div>
          <div>
            <h2 class="font-heading text-lg font-semibold mb-1">{{ way.title }}</h2>
            <p class="text-sm text-stone-500 leading-relaxed">{{ way.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="px-6 pb-20">
      <div
        class="max-w-md mx-auto text-center transition-all duration-700 delay-700 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <div class="rounded-2xl border border-stone-200/60 p-8">
          <p class="text-sm text-stone-500 mb-4">
            Pour toute question ou proposition de collaboration :
          </p>
          <a
            href="mailto:contact@legeai-editions.com"
            class="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors duration-300"
          >
            <UIcon name="i-lucide-mail" class="size-4" />
            contact@legeai-editions.com
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 pb-6 text-center">
      <div class="max-w-4xl mx-auto pt-6 border-t border-stone-200/40">
        <p class="text-[11px] text-stone-400">
          &copy; {{ new Date().getFullYear() }} Groupe Le Geai. Tous droits réservés
        </p>
      </div>
    </footer>
  </div>
</template>
