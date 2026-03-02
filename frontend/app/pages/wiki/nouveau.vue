<script setup lang="ts">
const router = useRouter()
const { createPage } = useWiki()
const { isDirecteur } = useAuth()
const toast = useToast()

// Rediriger si pas directeur
if (!isDirecteur.value) {
  navigateTo('/wiki')
}

const form = reactive({
  titre: '',
  icone: '',
  contenu: ''
})

const saving = ref(false)

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function handleCreate() {
  if (!form.titre.trim()) {
    toast.add({ title: 'Le titre est requis', color: 'error' })
    return
  }
  saving.value = true
  try {
    const slug = generateSlug(form.titre)
    await createPage({
      titre: form.titre.trim(),
      slug,
      contenu: form.contenu || '<p></p>',
      icone: form.icone.trim() || undefined
    })
    toast.add({ title: 'Page creee', color: 'success' })
    await router.push(`/wiki/${slug}`)
  } catch {
    toast.add({ title: 'Erreur lors de la creation', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Nouvelle page">
      <template #left>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          to="/wiki"
        />
      </template>
      <template #right>
        <UButton
          label="Creer"
          icon="i-lucide-check"
          size="sm"
          :loading="saving"
          :disabled="!form.titre.trim()"
          @click="handleCreate"
        />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div class="space-y-6">
          <!-- Titre & Icone -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Titre *</label>
              <UInput v-model="form.titre" placeholder="Titre de la page" />
              <p v-if="form.titre" class="text-xs text-stone-400 dark:text-stone-600">
                Slug : {{ generateSlug(form.titre) }}
              </p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Icone (optionnel)</label>
              <UInput v-model="form.icone" placeholder="i-lucide-file-text" />
              <p class="text-xs text-stone-400 dark:text-stone-600">
                Format : i-lucide-nom-icone
              </p>
            </div>
          </div>

          <!-- Contenu -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Contenu</label>
            <WikiEditor v-model="form.contenu" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
