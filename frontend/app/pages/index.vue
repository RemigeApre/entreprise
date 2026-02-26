<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (v: boolean) => { colorMode.preference = v ? 'dark' : 'light' }
})
</script>

<template>
  <div class="h-dvh flex flex-col overflow-hidden px-4 sm:px-6">
    <!-- Theme toggle: absolute, no layout impact -->
    <div class="absolute top-4 right-4 z-10">
      <UButton
        :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="isDark = !isDark"
      />
    </div>

    <!-- Top: title -->
    <header class="pt-8 sm:pt-12 text-center shrink-0">
      <h1 class="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
        Groupe Le Geai
      </h1>
      <p class="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
        Bienvenue sur notre portail
      </p>
    </header>

    <!-- Center: cards grid -->
    <main class="flex-1 flex items-center justify-center py-6 sm:py-8">
      <div class="grid grid-cols-2 gap-3 sm:gap-5 w-full max-w-2xl">
        <!-- Espace intranet -->
        <UCard class="card-hover-warm">
          <div class="text-center space-y-2 sm:space-y-3">
            <div class="rounded-full bg-amber-500/10 p-2.5 sm:p-3 w-fit mx-auto">
              <UIcon name="i-lucide-log-in" class="size-5 sm:size-6 text-amber-500" />
            </div>
            <h2 class="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
              Espace intranet
            </h2>
            <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 hidden sm:block">
              Accedez a votre espace collaborateur
            </p>
            <UButton
              to="/login"
              label="Se connecter"
              icon="i-lucide-arrow-right"
              trailing
              block
              size="sm"
            />
          </div>
        </UCard>

        <!-- Services informatiques -->
        <UCard class="card-hover-warm">
          <div class="text-center space-y-2 sm:space-y-3">
            <div class="rounded-full bg-blue-500/10 p-2.5 sm:p-3 w-fit mx-auto">
              <UIcon name="i-lucide-monitor" class="size-5 sm:size-6 text-blue-500" />
            </div>
            <h2 class="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
              Services informatiques
            </h2>
            <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 hidden sm:block">
              Vous cherchez nos services informatiques ?
            </p>
            <UButton
              to="https://legeai-informatique.fr"
              external
              target="_blank"
              label="Visiter le site"
              icon="i-lucide-external-link"
              trailing
              color="blue"
              block
              size="sm"
            />
          </div>
        </UCard>

        <!-- Maison d'edition -->
        <UCard class="card-hover-warm">
          <div class="text-center space-y-2 sm:space-y-3">
            <div class="rounded-full bg-amber-500/10 p-2.5 sm:p-3 w-fit mx-auto">
              <UIcon name="i-lucide-book-open" class="size-5 sm:size-6 text-amber-500" />
            </div>
            <h2 class="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
              Maison d'edition
              <UBadge variant="subtle" color="amber" size="xs" class="ml-1">
                Bientot
              </UBadge>
            </h2>
            <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 hidden sm:block">
              Vous cherchez notre maison d'edition ?
            </p>
            <UButton
              to="https://legeai-editions.com"
              external
              target="_blank"
              label="Visiter le site"
              icon="i-lucide-external-link"
              trailing
              color="amber"
              block
              size="sm"
            />
          </div>
        </UCard>

        <!-- Recrutement -->
        <UCard class="card-hover-warm">
          <div class="text-center space-y-2 sm:space-y-3">
            <div class="rounded-full bg-green-500/10 p-2.5 sm:p-3 w-fit mx-auto">
              <UIcon name="i-lucide-briefcase" class="size-5 sm:size-6 text-green-500" />
            </div>
            <h2 class="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100">
              Recrutement
            </h2>
            <p class="text-xs sm:text-sm text-stone-500 dark:text-stone-400 hidden sm:block">
              Decouvrez nos offres d'emploi
            </p>
            <UButton
              to="/recrutement"
              label="Voir les offres"
              icon="i-lucide-arrow-right"
              trailing
              color="green"
              block
              size="sm"
            />
          </div>
        </UCard>
      </div>
    </main>

    <!-- Footer -->
    <footer class="pb-4 text-center shrink-0">
      <p class="text-xs text-stone-400 dark:text-stone-600">
        &copy; {{ new Date().getFullYear() }} Groupe Le Geai - Tous droits reserves
      </p>
    </footer>
  </div>
</template>
