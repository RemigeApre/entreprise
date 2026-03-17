<script setup lang="ts">
import type { ArticleStatut } from '~/utils/types'

definePageMeta({
  middleware: ['directeur']
})

const { create } = useArticles()
const toast = useToast()

const submitting = ref(false)

const form = reactive({
  titre: '',
  contenu: '',
  statut: 'brouillon' as ArticleStatut,
  date_publication: ''
})

const statutOptions = [
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Publier maintenant', value: 'publie' },
  { label: 'Programmer', value: 'programme' }
]

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

    if (form.statut === 'publie') {
      payload.date_publication = new Date().toISOString()
    } else if (form.statut === 'programme') {
      payload.date_publication = new Date(form.date_publication).toISOString()
    }

    const result = await create(payload)
    toast.add({ title: 'Article cree avec succes', color: 'success' })
    navigateTo(`/admin/articles/${result.id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouvel article">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/admin/articles" />
      </template>
      <template #right>
        <UButton
          label="Creer"
          icon="i-lucide-check"
          size="sm"
          :loading="submitting"
          @click="handleSubmit"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">
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
                placeholder="Ecrivez votre article... (HTML supporte : <strong>, <u>, <em>)"
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
    </div>
  </div>
</template>
