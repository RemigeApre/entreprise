<script setup lang="ts">
definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Notre identite - Le Geai',
  description: 'Decouvrez les valeurs, la vision et le manifeste du groupe Le Geai. Edition, informatique et medias reunis sous une meme ambition.',
  ogTitle: 'Le Geai - Notre identite',
  ogDescription: 'Un groupe fonde sur l\'exigence, la creativite et l\'accessibilite.'
})

const visible = ref(false)

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})

const values = [
  {
    icon: 'i-lucide-gem',
    title: 'Exigence',
    text: 'Chaque detail compte. Nous ne livrons que ce dont nous sommes fiers, du premier pixel a la derniere ligne de code.'
  },
  {
    icon: 'i-lucide-accessibility',
    title: 'Accessibilite',
    text: 'Si un utilisateur ne s\'y retrouve pas, c\'est nous qui avons echoue. La simplicite est notre complexite.'
  },
  {
    icon: 'i-lucide-lightbulb',
    title: 'Creativite',
    text: 'Nous croyons que l\'innovation nait au croisement des disciplines. Edition, technologie et medias se nourrissent mutuellement.'
  },
  {
    icon: 'i-lucide-handshake',
    title: 'Integrite',
    text: 'Des engagements tenus, une transparence totale. La confiance se construit sur la constance.'
  }
]

const branches = [
  {
    title: 'Edition',
    desc: 'Maison d\'edition dediee aux ouvrages qui marquent, avec un soin particulier porte a la qualite editoriale et graphique.',
    status: 'En refonte'
  },
  {
    title: 'Informatique',
    desc: 'Conception de sites web, d\'applications et de solutions numeriques sur mesure pour les entreprises et les createurs.',
    href: 'https://legeai-informatique.fr'
  },
  {
    title: 'Medias',
    desc: 'Production de contenus, journalisme independant et creation mediatique a travers nos differentes plateformes.',
    href: 'https://bergfrid.com'
  }
]
</script>

<template>
  <div class="min-h-full">
    <!-- Hero -->
    <section class="relative flex items-center justify-center px-6 pt-24 pb-16 sm:pt-28 sm:pb-20">
      <div
        class="text-center max-w-2xl transition-all duration-1000 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <!-- Ornament -->
        <div class="flex items-center justify-center gap-3 mb-6 opacity-40">
          <div class="w-10 h-px bg-stone-400 dark:bg-stone-600" />
          <div class="size-1.5 rotate-45 bg-stone-400 dark:bg-stone-600" />
          <div class="w-10 h-px bg-stone-400 dark:bg-stone-600" />
        </div>

        <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Notre identite
        </h1>
        <div class="w-14 h-px bg-gradient-to-r from-transparent via-[var(--color-brand-gold)]/50 to-transparent mx-auto mt-5 mb-4" />
        <p class="text-stone-500 dark:text-stone-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
          Le Geai reunit des savoir-faire complementaires autour d'une conviction commune : creer avec exigence, partager avec sincerite.
        </p>
      </div>
    </section>

    <!-- Values -->
    <section class="px-6 pb-16 sm:pb-20">
      <div class="max-w-4xl mx-auto">
        <h2
          class="text-xs uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 text-center mb-10 transition-all duration-700 delay-200"
          :class="visible ? 'opacity-100' : 'opacity-0'"
        >
          Nos valeurs
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
          <div
            v-for="(val, i) in values"
            :key="val.title"
            class="transition-all duration-700 ease-out"
            :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            :style="{ transitionDelay: `${300 + i * 150}ms` }"
          >
            <div class="flex items-start gap-4">
              <div class="size-10 rounded-xl bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center shrink-0 border border-stone-200/60 dark:border-stone-700/40">
                <UIcon :name="val.icon" class="size-5 text-stone-500 dark:text-stone-400" />
              </div>
              <div>
                <h3 class="font-heading text-lg font-semibold mb-1">{{ val.title }}</h3>
                <p class="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{{ val.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Branches -->
    <section class="px-6 pb-20 sm:pb-24">
      <div class="max-w-4xl mx-auto">
        <h2
          class="text-xs uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 text-center mb-10 transition-all duration-700 delay-500"
          :class="visible ? 'opacity-100' : 'opacity-0'"
        >
          Nos branches
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            v-for="(branch, i) in branches"
            :key="branch.title"
            class="rounded-2xl border border-stone-200/60 dark:border-stone-800/60 p-6 transition-all duration-700 ease-out hover:border-stone-300 dark:hover:border-stone-700"
            :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            :style="{ transitionDelay: `${600 + i * 150}ms` }"
          >
            <h3 class="font-heading text-base font-semibold mb-2">{{ branch.title }}</h3>
            <p class="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-4">{{ branch.desc }}</p>
            <a
              v-if="branch.href"
              :href="branch.href"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-300"
            >
              Visiter
              <UIcon name="i-lucide-external-link" class="size-3.5" />
            </a>
            <span
              v-else-if="branch.status"
              class="inline-flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-600 italic"
            >
              {{ branch.status }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="px-6 pb-6 text-center">
      <div class="max-w-4xl mx-auto pt-6 border-t border-stone-200/40 dark:border-stone-800/40">
        <p class="text-[11px] text-stone-400 dark:text-stone-600">
          &copy; {{ new Date().getFullYear() }} Groupe Le Geai &mdash; Tous droits reserves
        </p>
        <p class="text-[10px] text-stone-300 dark:text-stone-700 mt-1">
          Site realise par
          <a href="https://legeai-informatique.fr" target="_blank" class="underline hover:text-stone-500 transition-colors">Le Geai Informatique</a>
        </p>
      </div>
    </footer>
  </div>
</template>
