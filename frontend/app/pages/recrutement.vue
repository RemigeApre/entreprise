<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { OffreEmploi } from '~/utils/types'

definePageMeta({ layout: 'public' })

useSeoMeta({
  title: 'Recrutement - Le Geai',
  description: 'Decouvrez les offres d\'emploi du groupe Le Geai. Rejoignez une equipe pluridisciplinaire en edition, informatique et medias.',
  ogTitle: 'Recrutement - Le Geai',
  ogDescription: 'Rejoignez-nous. Decouvrez les opportunites au sein du groupe Le Geai.'
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

const visible = ref(false)
onMounted(() => { requestAnimationFrame(() => { visible.value = true }) })

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-full">
    <!-- Header -->
    <section class="px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 text-center">
      <div
        class="max-w-2xl mx-auto transition-all duration-1000 ease-out"
        :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
      >
        <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
          Rejoignez-nous
        </h1>
        <div class="w-12 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mx-auto mt-5 mb-4" />
        <p class="text-stone-500 dark:text-stone-400 text-base sm:text-lg">
          Decouvrez les opportunites au sein du groupe Le Geai
        </p>
      </div>
    </section>

    <!-- Content -->
    <section class="px-6 pb-20">
      <div class="max-w-3xl mx-auto">

        <!-- Loading -->
        <div v-if="status === 'pending'" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="size-8 text-stone-400 animate-spin" />
        </div>

        <!-- Empty -->
        <div
          v-else-if="!offres?.length"
          class="text-center py-16 transition-all duration-700 delay-300"
          :class="visible ? 'opacity-100' : 'opacity-0'"
        >
          <div class="size-16 rounded-full bg-stone-100 dark:bg-stone-800/60 flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-lucide-inbox" class="size-7 text-stone-400 dark:text-stone-500" />
          </div>
          <h3 class="font-heading text-lg font-semibold mb-2">Aucune offre pour le moment</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Revenez bientot, de nouvelles opportunites sont en preparation.
          </p>
        </div>

        <!-- Job listings -->
        <div v-else class="space-y-4">
          <article
            v-for="(offre, i) in offres"
            :key="offre.id"
            class="group rounded-2xl border border-stone-200/60 dark:border-stone-800/60 p-5 sm:p-6 cursor-pointer transition-all duration-500 ease-out hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm"
            :class="visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'"
            :style="{ transitionDelay: `${300 + i * 100}ms` }"
            @click="openDetail(offre)"
          >
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div>
                <h2 class="font-heading text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                  {{ offre.titre }}
                </h2>
                <div class="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-stone-400 dark:text-stone-500">
                  <span v-if="offre.localisation" class="flex items-center gap-1">
                    <UIcon name="i-lucide-map-pin" class="size-3.5" />
                    {{ offre.localisation }}
                  </span>
                  <span v-if="formatSalaire(offre)" class="flex items-center gap-1">
                    <UIcon name="i-lucide-banknote" class="size-3.5" />
                    {{ formatSalaire(offre) }}
                  </span>
                  <span v-if="offre.date_publication" class="flex items-center gap-1">
                    <UIcon name="i-lucide-calendar" class="size-3.5" />
                    {{ formatDate(offre.date_publication) }}
                  </span>
                </div>
              </div>
              <UBadge variant="subtle" color="neutral" size="sm" class="shrink-0 self-start">
                {{ offre.type_contrat }}
              </UBadge>
            </div>
            <p
              class="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed"
              v-html="offre.description"
            />
          </article>
        </div>
      </div>
    </section>

    <!-- Detail slideover -->
    <USlideover v-model:open="isSlideoverOpen">
      <template #content>
        <div v-if="selectedOffre" class="p-6 space-y-6">
          <div>
            <div class="flex items-start justify-between gap-3 mb-3">
              <h2 class="font-heading text-xl font-bold">{{ selectedOffre.titre }}</h2>
              <UBadge variant="subtle" color="neutral">{{ selectedOffre.type_contrat }}</UBadge>
            </div>
            <div class="flex flex-wrap gap-3 text-sm text-stone-400 dark:text-stone-500">
              <span v-if="selectedOffre.localisation" class="flex items-center gap-1">
                <UIcon name="i-lucide-map-pin" class="size-4" />
                {{ selectedOffre.localisation }}
              </span>
              <span v-if="formatSalaire(selectedOffre)" class="flex items-center gap-1">
                <UIcon name="i-lucide-banknote" class="size-4" />
                {{ formatSalaire(selectedOffre) }}
              </span>
            </div>
          </div>

          <div class="h-px bg-stone-200 dark:bg-stone-800" />

          <div>
            <h3 class="font-semibold mb-2">Description</h3>
            <div class="prose prose-sm prose-stone dark:prose-invert max-w-none" v-html="selectedOffre.description" />
          </div>

          <div v-if="selectedOffre.competences_requises">
            <h3 class="font-semibold mb-2">Competences requises</h3>
            <div class="prose prose-sm prose-stone dark:prose-invert max-w-none" v-html="selectedOffre.competences_requises" />
          </div>

          <div v-if="selectedOffre.avantages">
            <h3 class="font-semibold mb-2">Avantages</h3>
            <div class="prose prose-sm prose-stone dark:prose-invert max-w-none" v-html="selectedOffre.avantages" />
          </div>

          <div class="h-px bg-stone-200 dark:bg-stone-800" />

          <p class="text-sm text-stone-500 dark:text-stone-400">
            Pour postuler, envoyez votre CV et lettre de motivation a
            <strong class="text-stone-700 dark:text-stone-300">recrutement@legeai-editions.com</strong>
          </p>
        </div>
      </template>
    </USlideover>

    <!-- Footer -->
    <footer class="px-6 pb-6 text-center">
      <div class="max-w-4xl mx-auto pt-6 border-t border-stone-200/40 dark:border-stone-800/40">
        <p class="text-[11px] text-stone-400 dark:text-stone-600">
          &copy; {{ new Date().getFullYear() }} Groupe Le Geai &mdash; Tous droits reserves
        </p>
      </div>
    </footer>
  </div>
</template>
