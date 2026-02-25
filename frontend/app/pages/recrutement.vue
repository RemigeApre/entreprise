<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

definePageMeta({
  layout: 'public'
})

useSeoMeta({
  title: 'Recrutement - LeGeai',
  description: 'Decouvrez les offres d\'emploi du groupe LeGeai'
})

const { $directus } = useNuxtApp()

const { data: offres, status } = useAsyncData('offres-publiques', async () => {
  try {
    const items = await $directus.request(readItems('offres_emploi', {
      filter: {
        publie: { _eq: true },
        _or: [
          { date_expiration: { _null: true } },
          { date_expiration: { _gte: new Date().toISOString().split('T')[0] } }
        ]
      },
      fields: [
        'id', 'titre', 'description', 'type_contrat', 'localisation',
        'salaire_min', 'salaire_max', 'salaire_periode',
        'competences_requises', 'avantages', 'date_publication',
        'categorie.id', 'categorie.nom', 'categorie.couleur'
      ],
      sort: ['-date_publication']
    }))
    return items as OffreEmploi[]
  } catch {
    return []
  }
})

const selectedOffre = ref<OffreEmploi | null>(null)
const isSlideoverOpen = ref(false)

function openDetail(offre: OffreEmploi) {
  selectedOffre.value = offre
  isSlideoverOpen.value = true
}

function formatSalaire(offre: OffreEmploi) {
  if (!offre.salaire_min && !offre.salaire_max) return null
  const periodeLabel = offre.salaire_periode === 'mois' ? '/mois' : offre.salaire_periode === 'annee' ? '/an' : '/h'
  if (offre.salaire_min && offre.salaire_max) {
    return `${offre.salaire_min.toLocaleString('fr-FR')} - ${offre.salaire_max.toLocaleString('fr-FR')} EUR${periodeLabel}`
  }
  return `${(offre.salaire_min || offre.salaire_max)!.toLocaleString('fr-FR')} EUR${periodeLabel}`
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="py-6 px-4 border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-lucide-building-2" class="size-8 text-primary" />
          <span class="text-xl font-bold text-gray-900 dark:text-white">LeGeai</span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <UColorModeButton />
          <UButton to="/login" label="Se connecter" variant="ghost" icon="i-lucide-log-in" />
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-5xl mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Rejoignez-nous
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400 mt-3">
          Decouvrez les opportunites au sein du groupe LeGeai
        </p>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Empty -->
      <div v-else-if="!offres?.length" class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="size-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Aucune offre pour le moment
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Revenez bientot, de nouvelles opportunites sont en preparation.
        </p>
      </div>

      <!-- Job listings grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard
          v-for="offre in offres"
          :key="offre.id"
          class="hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
          @click="openDetail(offre)"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold text-gray-900 dark:text-white text-lg">
                {{ offre.titre }}
              </h3>
              <UBadge variant="subtle" size="sm">
                {{ offre.type_contrat }}
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-map-pin" class="size-4" />
                {{ offre.localisation }}
              </span>
              <span v-if="formatSalaire(offre)" class="flex items-center gap-1">
                <UIcon name="i-lucide-banknote" class="size-4" />
                {{ formatSalaire(offre) }}
              </span>
            </div>

            <p
              class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2"
              v-html="offre.description"
            />
          </div>
        </UCard>
      </div>
    </main>

    <!-- Detail slideover -->
    <USlideover v-model:open="isSlideoverOpen">
      <template #content>
        <div v-if="selectedOffre" class="p-6 space-y-6">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ selectedOffre.titre }}
              </h2>
              <UBadge variant="subtle">
                {{ selectedOffre.type_contrat }}
              </UBadge>
            </div>

            <div class="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-map-pin" class="size-4" />
                {{ selectedOffre.localisation }}
              </span>
              <span v-if="formatSalaire(selectedOffre)" class="flex items-center gap-1">
                <UIcon name="i-lucide-banknote" class="size-4" />
                {{ formatSalaire(selectedOffre) }}
              </span>
            </div>
          </div>

          <USeparator />

          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="selectedOffre.description" />
          </div>

          <div v-if="selectedOffre.competences_requises">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Competences requises</h3>
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="selectedOffre.competences_requises" />
          </div>

          <div v-if="selectedOffre.avantages">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Avantages</h3>
            <div class="prose prose-sm dark:prose-invert max-w-none" v-html="selectedOffre.avantages" />
          </div>

          <USeparator />

          <p class="text-sm text-gray-500 dark:text-gray-400">
            Pour postuler, envoyez votre CV et lettre de motivation a
            <strong>recrutement@legeai-editions.com</strong>
          </p>
        </div>
      </template>
    </USlideover>

    <!-- Footer -->
    <footer class="py-6 px-4 text-center border-t border-gray-200 dark:border-gray-800">
      <p class="text-sm text-gray-400 dark:text-gray-600">
        &copy; {{ new Date().getFullYear() }} Groupe LeGeai - Tous droits reserves
      </p>
    </footer>
  </div>
</template>
