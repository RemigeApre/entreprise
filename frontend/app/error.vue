<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const is404 = computed(() => props.error.statusCode === 404)

const quotes = [
  { text: 'Errare humanum est, sed perseverare diabolicum.', author: 'Seneca' },
  { text: 'Non omnis qui errat perditus est.', author: 'J.R.R. Tolkien' },
  { text: 'Ce n\'est pas le chemin qui est difficile, c\'est le difficile qui est chemin.', author: 'Kierkegaard' },
  { text: 'Le vrai voyage de decouverte ne consiste pas a chercher de nouveaux paysages, mais a avoir de nouveaux yeux.', author: 'Marcel Proust' }
]

const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

function handleBack() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="min-h-dvh bg-stone-950 text-stone-300 flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <!-- Background texture -->
    <div class="absolute inset-0 opacity-[0.03]" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><rect width=%224%22 height=%224%22 fill=%22%23000%22/><rect width=%221%22 height=%221%22 fill=%22%23fff%22/></svg>'); background-size: 4px 4px;" />

    <!-- Vignette effect -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

    <!-- Content -->
    <div class="relative z-10 text-center max-w-lg space-y-8">
      <!-- Logo -->
      <div class="flex justify-center">
        <img src="/logo.svg" alt="Le Geai" class="size-16 opacity-30 grayscale" />
      </div>

      <!-- Error code -->
      <div class="space-y-2">
        <p class="font-heading text-8xl font-bold text-stone-600 tracking-tighter">
          {{ error.statusCode }}
        </p>
        <p v-if="is404" class="text-xl text-stone-400 font-heading italic">
          Ce manuscrit n'a pas encore ete retrouve.
        </p>
        <p v-else class="text-xl text-stone-400 font-heading italic">
          Une ombre s'est glissee dans les rouages.
        </p>
      </div>

      <!-- Decorative separator -->
      <div class="flex items-center justify-center gap-4">
        <div class="h-px w-16 bg-stone-700" />
        <span class="text-stone-600 text-xs tracking-widest uppercase">Obscuritas nutrit flammam</span>
        <div class="h-px w-16 bg-stone-700" />
      </div>

      <!-- Quote -->
      <blockquote class="space-y-2">
        <p class="text-sm text-stone-500 italic leading-relaxed">
          &laquo; {{ randomQuote.text }} &raquo;
        </p>
        <cite class="text-xs text-stone-600 not-italic">
          — {{ randomQuote.author }}
        </cite>
      </blockquote>

      <!-- Error detail (subtle) -->
      <p v-if="error.message && !is404" class="text-xs text-stone-700 font-mono truncate max-w-md mx-auto">
        {{ error.message }}
      </p>

      <!-- Action -->
      <button
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-500 transition-all duration-300 text-sm group"
        @click="handleBack"
      >
        <svg class="size-4 transition-transform group-hover:-translate-x-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        Regagner le manoir
      </button>
    </div>

    <!-- Footer -->
    <p class="absolute bottom-6 text-[10px] text-stone-800 tracking-wider">
      Le Geai Editions — Intranet
    </p>
  </div>
</template>
