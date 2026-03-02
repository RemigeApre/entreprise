<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getPage, updatePage, deletePage } = useWiki()
const { isDirecteur } = useAuth()
const toast = useToast()

const slug = route.params.slug as string

const { data: page, status, refresh } = useAsyncData(`wiki-${slug}`, () => getPage(slug))

// ---- Edition ----
const isEditing = ref(false)
const editContent = ref('')
const editTitre = ref('')
const editIcone = ref('')
const saving = ref(false)

function startEditing() {
  if (!page.value) return
  editContent.value = page.value.contenu || ''
  editTitre.value = page.value.titre
  editIcone.value = page.value.icone || ''
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

async function save() {
  if (!page.value) return
  saving.value = true
  try {
    await updatePage(page.value.id, {
      titre: editTitre.value.trim(),
      contenu: editContent.value,
      icone: editIcone.value.trim() || null
    })
    toast.add({ title: 'Page mise a jour', color: 'success' })
    isEditing.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    saving.value = false
  }
}

// ---- Suppression ----
const showDeleteConfirm = ref(false)
const deleting = ref(false)

async function confirmDelete() {
  if (!page.value) return
  deleting.value = true
  try {
    await deletePage(page.value.id)
    toast.add({ title: 'Page supprimee', color: 'success' })
    await router.push('/wiki')
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    deleting.value = false
  }
}

// ---- Injection d'IDs dans les headings pour la table des matieres ----
const processedContent = computed(() => {
  if (!page.value?.contenu) return ''
  return page.value.contenu.replace(
    /<(h[23])([^>]*)>(.*?)<\/\1>/gi,
    (_match: string, tag: string, attrs: string, text: string) => {
      const plainText = text.replace(/<[^>]*>/g, '').trim()
      const id = plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      return `<${tag}${attrs} id="${id}">${text}</${tag}>`
    }
  )
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="page?.titre || 'Wiki'">
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
        <template v-if="isDirecteur && page && !isEditing">
          <UButton
            label="Modifier"
            icon="i-lucide-pencil"
            size="sm"
            variant="subtle"
            @click="startEditing"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="sm"
            variant="ghost"
            color="error"
            @click="showDeleteConfirm = true"
          />
        </template>
        <template v-if="isEditing">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="cancelEditing"
          />
          <UButton
            label="Sauvegarder"
            icon="i-lucide-check"
            size="sm"
            :loading="saving"
            @click="save"
          />
        </template>
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto">
      <!-- Loading -->
      <div v-if="status === 'pending' && !page" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      </div>

      <!-- Not found -->
      <div v-else-if="!page" class="text-center py-12">
        <UIcon name="i-lucide-file-x" class="size-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
        <p class="text-stone-500 dark:text-stone-400">Page introuvable</p>
        <UButton label="Retour au wiki" to="/wiki" variant="subtle" class="mt-4" />
      </div>

      <!-- Content -->
      <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <!-- Mode lecture -->
        <template v-if="!isEditing">
          <div class="flex gap-8">
            <!-- Contenu principal -->
            <div class="flex-1 min-w-0">
              <!-- En-tete -->
              <div class="flex items-center gap-3 mb-8">
                <div class="size-10 rounded-lg bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center">
                  <UIcon :name="page.icone || 'i-lucide-file-text'" class="size-5 text-stone-600 dark:text-stone-400" />
                </div>
                <h1 class="font-heading text-2xl font-bold text-stone-900 dark:text-white">{{ page.titre }}</h1>
              </div>

              <!-- Contenu HTML -->
              <div class="prose prose-stone dark:prose-invert prose-sm max-w-none" v-html="processedContent" />

              <!-- Meta -->
              <div v-if="page.date_updated || page.date_created" class="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800">
                <p class="text-xs text-stone-400 dark:text-stone-600">
                  <template v-if="page.date_updated">
                    Derniere mise a jour le {{ formatDate(page.date_updated) }}
                  </template>
                  <template v-else>
                    Cree le {{ formatDate(page.date_created) }}
                  </template>
                </p>
              </div>
            </div>

            <!-- Table des matieres (sidebar) -->
            <div class="w-56 shrink-0 sticky top-6 self-start">
              <WikiToc :html="page.contenu" />
            </div>
          </div>
        </template>

        <!-- Mode edition -->
        <template v-else>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Titre</label>
                <UInput v-model="editTitre" placeholder="Titre de la page" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Icone (Lucide)</label>
                <UInput v-model="editIcone" placeholder="i-lucide-file-text" />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-semibold text-stone-700 dark:text-stone-300">Contenu</label>
              <WikiEditor v-model="editContent" />
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal confirmation suppression -->
    <UModal v-model:open="showDeleteConfirm">
      <template #content>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-stone-900 dark:text-white mb-2">Supprimer cette page ?</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400 mb-6">
            La page "{{ page?.titre }}" sera definitivement supprimee. Cette action est irreversible.
          </p>
          <div class="flex justify-end gap-3">
            <UButton
              label="Annuler"
              color="neutral"
              variant="ghost"
              @click="showDeleteConfirm = false"
            />
            <UButton
              label="Supprimer"
              icon="i-lucide-trash-2"
              color="error"
              :loading="deleting"
              @click="confirmDelete"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
