<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { getPage, updatePage, deletePage } = useWiki()
const { isDirecteur } = useAuth()
const toast = useToast()

const slug = route.params.slug as string

const { data: page, status, refresh } = useAsyncData(`wiki-${slug}`, () => getPage(slug))

// ---- Reading time ----
const readingTimeMin = computed(() => {
  if (!page.value?.contenu) return 0
  const text = page.value.contenu.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
})

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

// ---- Chapitres : decoupe le contenu par h2 ----
interface Chapter {
  id: string
  title: string
  html: string
  index: number
}

const chapters = computed<Chapter[]>(() => {
  if (!page.value?.contenu) return []

  const raw = page.value.contenu
  // Split on <h2...>...</h2> — keep the h2 tags as part of each chapter
  const parts = raw.split(/(?=<h2[\s>])/i)

  const result: Chapter[] = []
  let chapterIndex = 0

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    // Check if this part starts with an h2
    const h2Match = trimmed.match(/^<h2[^>]*>(.*?)<\/h2>/i)
    if (h2Match) {
      chapterIndex++
      const titleText = h2Match[1].replace(/<[^>]*>/g, '').trim()
      const id = titleText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      // Inject id into the h2 and also inject ids into h3s
      let html = trimmed.replace(
        /^<h2([^>]*)>(.*?)<\/h2>/i,
        `<h2$1 id="${id}">$2</h2>`
      )
      html = injectH3Ids(html)
      result.push({ id, title: titleText, html, index: chapterIndex })
    } else {
      // Content before first h2 (intro)
      const html = injectH3Ids(trimmed)
      result.push({ id: 'intro', title: '', html, index: 0 })
    }
  }

  return result
})

function injectH3Ids(html: string): string {
  return html.replace(
    /<h3([^>]*)>(.*?)<\/h3>/gi,
    (_match: string, attrs: string, text: string) => {
      const plainText = text.replace(/<[^>]*>/g, '').trim()
      const id = plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      return `<h3${attrs} id="${id}">${text}</h3>`
    }
  )
}

// Fallback: si pas de h2, on affiche tout le contenu brut avec ids injectes
const processedContent = computed(() => {
  if (!page.value?.contenu) return ''
  let html = page.value.contenu
  html = html.replace(
    /<(h[23])([^>]*)>(.*?)<\/\1>/gi,
    (_match: string, tag: string, attrs: string, text: string) => {
      const plainText = text.replace(/<[^>]*>/g, '').trim()
      const id = plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      return `<${tag}${attrs} id="${id}">${text}</${tag}>`
    }
  )
  return html
})

const hasChapters = computed(() => chapters.value.some(c => c.index > 0))

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// ---- Mobile TOC ----
const showMobileToc = ref(false)

// ---- Reading progress ----
const scrollContainer = ref<HTMLElement>()
const readProgress = ref(0)

function onScroll() {
  const el = scrollContainer.value
  if (!el) return
  const scrollTop = el.scrollTop
  const scrollHeight = el.scrollHeight - el.clientHeight
  readProgress.value = scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0
}

// ---- Keyboard shortcut for edit ----
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'e' && (e.ctrlKey || e.metaKey) && isDirecteur.value && !isEditing.value) {
    e.preventDefault()
    startEditing()
  }
  if (e.key === 'Escape' && isEditing.value) {
    cancelEditing()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
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
        <!-- Mobile TOC toggle -->
        <UButton
          v-if="page && !isEditing"
          icon="i-lucide-list"
          variant="ghost"
          color="neutral"
          size="sm"
          class="lg:hidden"
          title="Sommaire"
          @click="showMobileToc = true"
        />
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

    <!-- Reading progress bar -->
    <div v-if="page && !isEditing" class="wiki-progress-track">
      <div class="wiki-progress-bar" :style="{ width: (readProgress * 100) + '%' }" />
    </div>

    <div ref="scrollContainer" class="flex-1 overflow-y-auto" @scroll="onScroll">
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
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-600 mb-6">
            <NuxtLink to="/wiki" class="hover:text-[#AF8F3C] transition-colors">Wiki</NuxtLink>
            <UIcon name="i-lucide-chevron-right" class="size-3" />
            <span class="text-stone-600 dark:text-stone-400 truncate">{{ page.titre }}</span>
          </nav>

          <div class="flex gap-10">
            <!-- Contenu principal -->
            <div class="flex-1 min-w-0">
              <!-- En-tete -->
              <div class="wiki-article-header">
                <div
                  class="size-12 rounded-xl flex items-center justify-center shrink-0"
                  :style="{ background: (page.couleur || '#AF8F3C') + '12' }"
                >
                  <UIcon
                    :name="page.icone || 'i-lucide-file-text'"
                    class="size-6"
                    :style="{ color: page.couleur || '#AF8F3C' }"
                  />
                </div>
                <div class="min-w-0">
                  <h1 class="font-heading text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white leading-tight">
                    {{ page.titre }}
                  </h1>
                  <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-400 dark:text-stone-500">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-clock" class="size-3" />
                      {{ readingTimeMin }} min de lecture
                    </span>
                    <span v-if="hasChapters" class="flex items-center gap-1">
                      <UIcon name="i-lucide-layers" class="size-3" />
                      {{ chapters.filter(c => c.index > 0).length }} chapitres
                    </span>
                    <span v-if="page.date_updated" class="flex items-center gap-1">
                      <UIcon name="i-lucide-pencil" class="size-3" />
                      {{ formatDate(page.date_updated) }}
                    </span>
                    <span v-else-if="page.date_created" class="flex items-center gap-1">
                      <UIcon name="i-lucide-calendar" class="size-3" />
                      {{ formatDate(page.date_created) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Separateur -->
              <div class="wiki-article-divider" />

              <!-- ══ Contenu par chapitres ══ -->
              <template v-if="hasChapters">
                <div
                  v-for="chapter in chapters"
                  :key="chapter.id"
                  class="wiki-chapter"
                  :class="{ 'wiki-chapter--intro': chapter.index === 0 }"
                >
                  <!-- Numero de chapitre -->
                  <div v-if="chapter.index > 0" class="wiki-chapter-num">
                    <span class="wiki-chapter-num-text">{{ String(chapter.index).padStart(2, '0') }}</span>
                  </div>
                  <div
                    class="wiki-article-content prose prose-stone dark:prose-invert prose-sm sm:prose-base max-w-none"
                    v-html="chapter.html"
                  />
                </div>
              </template>

              <!-- ══ Contenu brut (pas de h2) ══ -->
              <div
                v-else
                class="wiki-article-content prose prose-stone dark:prose-invert prose-sm sm:prose-base max-w-none"
                v-html="processedContent"
              />

              <!-- Footer meta -->
              <div class="wiki-article-footer">
                <div class="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-600">
                  <UIcon name="i-lucide-info" class="size-3.5" />
                  <template v-if="page.date_updated">
                    Derniere mise a jour le {{ formatDate(page.date_updated) }}
                  </template>
                  <template v-else>
                    Cree le {{ formatDate(page.date_created) }}
                  </template>
                </div>
                <NuxtLink
                  to="/wiki"
                  class="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-600 hover:text-[#AF8F3C] transition-colors"
                >
                  <UIcon name="i-lucide-arrow-left" class="size-3" />
                  Retour au wiki
                </NuxtLink>
              </div>
            </div>

            <!-- Table des matieres (sidebar, desktop) -->
            <div class="w-56 shrink-0 sticky top-6 self-start hidden lg:block">
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

    <!-- Mobile TOC slideover -->
    <USlideover v-model:open="showMobileToc" side="right" class="lg:hidden">
      <template #content>
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-stone-900 dark:text-white">Sommaire</h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="xs"
              @click="showMobileToc = false"
            />
          </div>
          <WikiToc v-if="page" :html="page.contenu" :force-visible="true" @navigate="showMobileToc = false" />
        </div>
      </template>
    </USlideover>

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

<style scoped>
/* ═══ Progress bar ═══ */
.wiki-progress-track {
  height: 2px;
  background: rgba(175, 143, 60, 0.06);
  flex-shrink: 0;
}
.wiki-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #AF8F3C, #d4b85a);
  transition: width 0.1s linear;
}

/* ═══ Header ═══ */
.wiki-article-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.wiki-article-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(175, 143, 60, 0.15), rgba(175, 143, 60, 0.03), transparent);
  margin: 24px 0;
}

/* ═══ Chapitres ═══ */
.wiki-chapter {
  position: relative;
  padding: 28px 0;
  border-bottom: 1px solid rgba(175, 143, 60, 0.06);
}
.wiki-chapter:last-child {
  border-bottom: none;
}
.wiki-chapter--intro {
  padding-top: 0;
}

.wiki-chapter-num {
  position: absolute;
  top: 28px;
  left: -56px;
  width: 40px;
  text-align: right;
}
@media (max-width: 1200px) {
  .wiki-chapter-num {
    position: static;
    width: auto;
    text-align: left;
    margin-bottom: 4px;
  }
}

.wiki-chapter-num-text {
  font-family: 'IM Fell DW Pica', serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  color: rgba(175, 143, 60, 0.15);
  user-select: none;
}

/* ═══ Footer ═══ */
.wiki-article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid rgba(175, 143, 60, 0.08);
}

/* ═══ Prose enhancements ═══ */
.wiki-article-content :deep(h2) {
  font-family: 'Crimson Pro', serif;
  font-size: 1.5em;
  margin-top: 0;
  padding-bottom: 0;
  border-bottom: none;
  scroll-margin-top: 24px;
}
.wiki-chapter .wiki-article-content :deep(h2:first-child) {
  margin-top: 0;
}

.wiki-article-content :deep(h3) {
  font-family: 'Crimson Pro', serif;
  margin-top: 1.5em;
  scroll-margin-top: 24px;
}

.wiki-article-content :deep(h4) {
  scroll-margin-top: 24px;
}

.wiki-article-content :deep(blockquote) {
  border-left: 3px solid rgba(175, 143, 60, 0.3);
  background: rgba(175, 143, 60, 0.02);
  border-radius: 0 8px 8px 0;
  padding: 12px 16px;
  font-style: italic;
}

.wiki-article-content :deep(a) {
  color: #AF8F3C;
  text-decoration: underline;
  text-decoration-color: rgba(175, 143, 60, 0.3);
  text-underline-offset: 2px;
}
.wiki-article-content :deep(a:hover) {
  text-decoration-color: #AF8F3C;
}

.wiki-article-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
}
.wiki-article-content :deep(th),
.wiki-article-content :deep(td) {
  border: 1px solid rgba(175, 143, 60, 0.12);
  padding: 8px 12px;
}
.wiki-article-content :deep(th) {
  background: rgba(175, 143, 60, 0.04);
  font-weight: 600;
}

.wiki-article-content :deep(img) {
  border-radius: 10px;
  border: 1px solid rgba(175, 143, 60, 0.08);
}

.wiki-article-content :deep(mark) {
  background: rgba(175, 143, 60, 0.2);
  border-radius: 2px;
  padding: 0 2px;
}

.wiki-article-content :deep(code:not(pre code)) {
  background: rgba(175, 143, 60, 0.06);
  border: 1px solid rgba(175, 143, 60, 0.08);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.85em;
}

.wiki-article-content :deep(pre) {
  border: 1px solid rgba(175, 143, 60, 0.08);
  border-radius: 8px;
}

.wiki-article-content :deep(hr) {
  border-color: rgba(175, 143, 60, 0.1);
}

.wiki-article-content :deep(ul) {
  list-style-type: disc;
}
.wiki-article-content :deep(ul ul) {
  list-style-type: circle;
}

.wiki-article-content :deep(li::marker) {
  color: rgba(175, 143, 60, 0.4);
}
</style>
