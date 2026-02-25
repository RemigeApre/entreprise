<script setup lang="ts">
definePageMeta({
  layout: 'public'
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="py-6 px-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-building-2" class="size-8 text-primary" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">LeGeai</span>
        </div>
        <UColorModeButton />
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="max-w-3xl w-full text-center space-y-12">
        <div>
          <h1 class="text-4xl sm:text-5xl font-bold font-heading text-gray-900 dark:text-white leading-tight">
            Groupe LeGeai
          </h1>
          <p class="text-lg text-gray-500 dark:text-gray-400 mt-4">
            Bienvenue sur notre portail. Que recherchez-vous ?
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <!-- Se connecter -->
          <UCard class="card-hover-warm">
            <div class="text-center space-y-3">
              <div class="rounded-full bg-primary/10 p-3 w-fit mx-auto">
                <UIcon name="i-lucide-log-in" class="size-6 text-primary" />
              </div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                Espace intranet
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Accedez a votre espace collaborateur
              </p>
              <UButton
                to="/login"
                label="Se connecter"
                icon="i-lucide-arrow-right"
                trailing
                block
              />
            </div>
          </UCard>

          <!-- Services informatiques -->
          <UCard class="card-hover-warm">
            <div class="text-center space-y-3">
              <div class="rounded-full bg-blue-500/10 p-3 w-fit mx-auto">
                <UIcon name="i-lucide-monitor" class="size-6 text-blue-500" />
              </div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                Services informatiques
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
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
              />
            </div>
          </UCard>

          <!-- Maison d'edition -->
          <UCard class="card-hover-warm">
            <div class="text-center space-y-3">
              <div class="rounded-full bg-amber-500/10 p-3 w-fit mx-auto">
                <UIcon name="i-lucide-book-open" class="size-6 text-amber-500" />
              </div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                Maison d'edition
                <UBadge variant="subtle" color="amber" size="xs" class="ml-1">
                  En construction
                </UBadge>
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
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
              />
            </div>
          </UCard>

          <!-- Recrutement -->
          <UCard class="card-hover-warm">
            <div class="text-center space-y-3">
              <div class="rounded-full bg-green-500/10 p-3 w-fit mx-auto">
                <UIcon name="i-lucide-briefcase" class="size-6 text-green-500" />
              </div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                Recrutement
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Decouvrez nos offres d'emploi
              </p>
              <UButton
                to="/recrutement"
                label="Voir les offres"
                icon="i-lucide-arrow-right"
                trailing
                color="green"
                block
              />
            </div>
          </UCard>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-6 px-4 text-center">
      <p class="text-sm text-gray-400 dark:text-gray-600">
        &copy; {{ new Date().getFullYear() }} Groupe LeGeai - Tous droits reserves
      </p>
    </footer>
  </div>
</template>
