<script setup lang="ts">
import type { Article, ArticleStatut, UserProfile } from '~/utils/types'
import { ARTICLE_STATUTS } from '~/utils/constants'

definePageMeta({
  middleware: ['directeur']
})

const route = useRoute()
const { getById, update, remove } = useArticles()
const toast = useToast()

const articleId = route.params.id as string

const { data: article, status, refresh } = useAsyncData(`article-${articleId}`, () => getById(articleId))

// ---- Edition ----
const isEditing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const showDeleteModal = ref(false)

const form = reactive({
  titre: '',
  contenu: '',
  statut: 'brouillon' as ArticleStatut,
  date_publication: ''
})

const statutOptions = [
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Publie', value: 'publie' },
  { label: 'Programme', value: 'programme' }
]

function getAuteurNom(a: Article): string {
  if (typeof a.auteur === 'object' && a.auteur) {
    const u = a.auteur as UserProfile
    return [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Inconnu'
  }
  return 'Inconnu'
}

function startEditing() {
  if (!article.value) return
  const val = article.value
  form.titre = val.titre
  form.contenu = val.contenu
  form.statut = val.statut
  form.date_publication = val.date_publication ? val.date_publication.slice(0, 16) : ''
  isEditing.value = true
}

async function handleSubmit() {
  if (!form.titre || !form.contenu) {
    toast.add({ title: 'Veuillez remplir le titre et le contenu', color: 'warning' })
    return
  }

  if (form.statut === 'programme' && !form.date_publication) {
    toast.add({ title: 'Veuillez choisir une date de publication', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      titre: form.titre,
      contenu: form.contenu,
      statut: form.statut
    }

    if (form.statut === 'publie' && article.value?.statut !== 'publie') {
      payload.date_publication = new Date().toISOString()
    } else if (form.statut === 'programme') {
      payload.date_publication = new Date(form.date_publication).toISOString()
    } else if (form.statut === 'brouillon') {
      payload.date_publication = null
    }

    await update(articleId, payload as Partial<Article>)
    toast.add({ title: 'Article mis a jour', color: 'success' })
    isEditing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la mise a jour', color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await remove(articleId)
    toast.add({ title: 'Article supprime', color: 'success' })
    navigateTo('/admin/articles')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

function formatDateLong(date: string | null) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="article?.titre || 'Article'">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/admin/articles" />
      </template>
      <template #right>
        <template v-if="!isEditing && article">
          <UButton label="Modifier" icon="i-lucide-pencil" size="sm" variant="subtle" @click="startEditing" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="showDeleteModal = true" />
        </template>
        <template v-if="isEditing">
          <UButton label="Annuler" color="neutral" variant="ghost" size="sm" @click="isEditing = false" />
          <UButton label="Enregistrer" icon="i-lucide-check" size="sm" :loading="submitting" @click="handleSubmit" />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- ==================== MODE LECTURE ==================== -->
      <div v-else-if="article && !isEditing" class="max-w-2xl mx-auto space-y-6">
        <!-- En-tete -->
        <UCard>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-bold text-stone-900">{{ article.titre }}</h2>
              <UBadge :color="ARTICLE_STATUTS[article.statut]?.color || 'neutral'" variant="subtle">
                {{ ARTICLE_STATUTS[article.statut]?.label || article.statut }}
              </UBadge>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-sm text-stone-500">
              <span class="flex items-center gap-1.5">
                <UIcon name="i-lucide-user" class="size-3.5" />
                {{ getAuteurNom(article) }}
              </span>
              <span>Cree le {{ formatDateLong(article.date_created) }}</span>
              <span v-if="article.date_publication">
                {{ article.statut === 'programme' ? 'Programme pour le' : 'Publie le' }}
                {{ formatDateLong(article.date_publication) }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Contenu -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Contenu</h3>
          </template>
          <div class="prose prose-sm max-w-none text-stone-700" v-html="article.contenu" />
        </UCard>
      </div>

      <!-- ==================== MODE EDITION ==================== -->
      <div v-else-if="article && isEditing" class="max-w-2xl mx-auto space-y-6">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Contenu</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Titre *">
              <UInput v-model="form.titre" placeholder="Titre de l'article" class="w-full" />
            </UFormField>
            <UFormField label="Contenu *">
              <UTextarea
                v-model="form.contenu"
                placeholder="Ecrivez votre article..."
                :rows="12"
                class="w-full"
              />
              <p class="text-xs text-stone-400 mt-1">
                Mise en forme : &lt;strong&gt;gras&lt;/strong&gt;, &lt;u&gt;souligne&lt;/u&gt;, &lt;em&gt;italique&lt;/em&gt;. Les emojis sont supportes.
              </p>
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-stone-900">Publication</h3>
          </template>
          <div class="space-y-4">
            <UFormField label="Statut">
              <USelectMenu v-model="form.statut" :items="statutOptions" value-key="value" class="w-full" />
            </UFormField>
            <UFormField v-if="form.statut === 'programme'" label="Date de publication *">
              <UInput v-model="form.date_publication" type="datetime-local" class="w-full" />
            </UFormField>
          </div>
        </UCard>
      </div>

      <!-- Not found -->
      <div v-else class="text-center py-12">
        <UIcon name="i-lucide-file-x" class="size-10 text-stone-300 mx-auto mb-3" />
        <p class="text-stone-500">Article introuvable</p>
        <UButton label="Retour aux articles" icon="i-lucide-arrow-left" class="mt-4" variant="subtle" to="/admin/articles" />
      </div>
    </div>

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 p-2">
              <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-stone-900">Supprimer cet article</h3>
          </div>
          <p class="text-sm text-stone-500">
            Etes-vous sur de vouloir supprimer l'article <strong>{{ article?.titre }}</strong> ?
            Cette action est irreversible.
          </p>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="subtle" @click="showDeleteModal = false" />
            <UButton label="Supprimer" icon="i-lucide-trash-2" color="error" :loading="deleting" @click="handleDelete" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
