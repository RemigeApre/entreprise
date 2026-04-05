<script setup lang="ts">
const toast = useToast()

type DocTag = 'administratif' | 'rh' | 'graphique' | 'juridique' | 'commercial'

interface WikiDocument {
  id: string
  titre: string
  description: string
  fichier: string
  format: string
  tags: DocTag[]
  icone: string
}

const TAG_CONFIG: Record<DocTag, { label: string; color: string; bg: string }> = {
  administratif: { label: 'Administratif', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  rh: { label: 'Ressources humaines', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  graphique: { label: 'Ressources graphiques', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  juridique: { label: 'Juridique', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  commercial: { label: 'Commercial', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
}

const documents: WikiDocument[] = [
  {
    id: 'reglement',
    titre: 'Reglement interieur',
    description: 'Regles de vie et de fonctionnement au sein du groupe Le Geai. Horaires, comportement, outils, confidentialite.',
    fichier: '/documents/reglement_interieur.docx',
    format: 'DOCX',
    tags: ['administratif', 'rh'],
    icone: 'i-lucide-scale'
  },
  {
    id: 'charte',
    titre: 'Charte graphique',
    description: 'Identite visuelle complete : logo, couleurs, typographies, ambiances et references artistiques.',
    fichier: '/documents/charte_graphique.pdf',
    format: 'PDF',
    tags: ['graphique'],
    icone: 'i-lucide-palette'
  },
  {
    id: 'cession-droits',
    titre: 'Cession de droits d\'auteur',
    description: 'Modele de contrat de cession de droits d\'auteur utilise dans l\'entreprise pour les creations des collaborateurs.',
    fichier: '/documents/cession_droits_auteur.docx',
    format: 'DOCX',
    tags: ['juridique', 'rh'],
    icone: 'i-lucide-file-signature'
  },
  {
    id: 'droit-image',
    titre: 'Autorisation droit a l\'image',
    description: 'Modele d\'autorisation pour l\'utilisation de l\'image des collaborateurs dans les supports de communication.',
    fichier: '/documents/autorisation_droit_image.docx',
    format: 'DOCX',
    tags: ['juridique', 'rh'],
    icone: 'i-lucide-camera'
  },
  {
    id: 'offres-stages',
    titre: 'Offres de stages 2026',
    description: 'Descriptifs des postes de stages proposes par Le Geai pour l\'annee 2026.',
    fichier: '/documents/offres_stages_2026.pdf',
    format: 'PDF',
    tags: ['rh', 'commercial'],
    icone: 'i-lucide-graduation-cap'
  },
  {
    id: 'logo-svg',
    titre: 'Logo Le Geai (vecteur)',
    description: 'Logo officiel au format SVG vectoriel. Utilisable pour tous les supports print et web.',
    fichier: '/documents/LeGeai_logo_vecteur.svg',
    format: 'SVG',
    tags: ['graphique'],
    icone: 'i-lucide-image'
  }
]

// --- Filters ---
const search = ref('')
const activeTag = ref<DocTag | 'all'>('all')

const allTags = Object.entries(TAG_CONFIG) as [DocTag, typeof TAG_CONFIG[DocTag]][]

const filteredDocs = computed(() => {
  return documents.filter(doc => {
    const q = search.value.toLowerCase().trim()
    const matchesSearch = !q || doc.titre.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q)
    const matchesTag = activeTag.value === 'all' || doc.tags.includes(activeTag.value)
    return matchesSearch && matchesTag
  })
})

// --- Counts per tag ---
const tagCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const doc of documents) {
    for (const tag of doc.tags) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return counts
})

function downloadDoc(doc: WikiDocument) {
  const a = document.createElement('a')
  a.href = doc.fichier
  a.download = doc.fichier.split('/').pop() || doc.titre
  a.click()
}

function copyLink(doc: WikiDocument) {
  const url = window.location.origin + doc.fichier
  navigator.clipboard.writeText(url)
  toast.add({ title: 'Lien copie', color: 'success' })
}

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600 border-red-200',
  DOCX: 'bg-blue-50 text-blue-600 border-blue-200',
  SVG: 'bg-emerald-50 text-emerald-600 border-emerald-200'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Documents">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/wiki" />
      </template>
      <template #right>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Rechercher..."
          size="sm"
          class="w-44"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-4xl mx-auto">

        <!-- Intro -->
        <div class="mb-6">
          <p class="text-sm text-stone-500 leading-relaxed">
            Tous les documents officiels du groupe. Cliquez pour telecharger, ou utilisez les tags pour filtrer par categorie.
          </p>
        </div>

        <!-- Tags filter -->
        <div class="flex flex-wrap gap-2 mb-6">
          <button
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            :class="activeTag === 'all'
              ? 'bg-stone-800 text-white border-stone-800'
              : 'bg-white/60 text-stone-500 border-stone-200 hover:border-stone-300'"
            @click="activeTag = 'all'"
          >
            Tous <span class="opacity-60 tabular-nums ml-0.5">{{ documents.length }}</span>
          </button>
          <button
            v-for="([key, config]) in allTags"
            :key="key"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            :class="activeTag === key
              ? config.bg + ' ' + config.color + ' border-current font-semibold'
              : 'bg-white/60 text-stone-500 border-stone-200 hover:border-stone-300'"
            @click="activeTag = activeTag === key ? 'all' : key"
          >
            {{ config.label }}
            <span v-if="tagCounts[key]" class="opacity-60 tabular-nums ml-0.5">{{ tagCounts[key] }}</span>
          </button>
        </div>

        <!-- Documents grid -->
        <div v-if="filteredDocs.length" class="space-y-3">
          <div
            v-for="doc in filteredDocs"
            :key="doc.id"
            class="group rounded-xl bg-white/70 border border-white/80 shadow-sm hover:shadow-md hover:border-[rgba(175,143,60,0.2)] transition-all overflow-hidden"
          >
            <div class="flex items-start gap-4 p-4">
              <!-- Icon -->
              <div class="size-11 rounded-lg bg-[rgba(175,143,60,0.06)] flex items-center justify-center shrink-0 mt-0.5">
                <UIcon :name="doc.icone" class="size-5 text-[#AF8F3C]" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold text-stone-900 group-hover:text-[#AF8F3C] transition-colors truncate">
                    {{ doc.titre }}
                  </h3>
                  <span
                    class="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                    :class="FORMAT_COLORS[doc.format] || 'bg-stone-50 text-stone-500 border-stone-200'"
                  >
                    {{ doc.format }}
                  </span>
                </div>
                <p class="text-sm text-stone-500 leading-relaxed mb-2">{{ doc.description }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in doc.tags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    :class="TAG_CONFIG[tag].bg + ' ' + TAG_CONFIG[tag].color"
                  >
                    {{ TAG_CONFIG[tag].label }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-1 shrink-0">
                <UTooltip text="Copier le lien">
                  <UButton
                    icon="i-lucide-link"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="copyLink(doc)"
                  />
                </UTooltip>
                <UButton
                  icon="i-lucide-download"
                  label="Telecharger"
                  size="xs"
                  variant="soft"
                  @click="downloadDoc(doc)"
                />
              </div>
            </div>

            <!-- Special: link to reglement page for reglement interieur -->
            <NuxtLink
              v-if="doc.id === 'reglement'"
              to="/wiki/reglement"
              class="flex items-center gap-2 px-4 py-2 bg-[rgba(175,143,60,0.03)] border-t border-[rgba(175,143,60,0.06)] text-xs text-[#AF8F3C] hover:bg-[rgba(175,143,60,0.06)] transition-colors"
            >
              <UIcon name="i-lucide-book-open" class="size-3.5" />
              <span class="font-medium">Consulter le reglement article par article</span>
              <UIcon name="i-lucide-chevron-right" class="size-3.5 ml-auto" />
            </NuxtLink>

            <!-- Special: link to identite for charte -->
            <NuxtLink
              v-if="doc.id === 'charte'"
              to="/wiki/identite"
              class="flex items-center gap-2 px-4 py-2 bg-[rgba(175,143,60,0.03)] border-t border-[rgba(175,143,60,0.06)] text-xs text-[#AF8F3C] hover:bg-[rgba(175,143,60,0.06)] transition-colors"
            >
              <UIcon name="i-lucide-palette" class="size-3.5" />
              <span class="font-medium">Voir la charte interactive (couleurs, logo, typo)</span>
              <UIcon name="i-lucide-chevron-right" class="size-3.5 ml-auto" />
            </NuxtLink>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-12">
          <UIcon name="i-lucide-file-search" class="size-10 text-stone-300 mx-auto mb-3" />
          <p class="text-stone-500">Aucun document ne correspond</p>
          <UButton v-if="search || activeTag !== 'all'" label="Effacer les filtres" variant="subtle" size="sm" class="mt-3" @click="search = ''; activeTag = 'all'" />
        </div>

      </div>
    </div>
  </div>
</template>
