<script setup lang="ts">
import type { Realisation } from '~/utils/types'

definePageMeta({ middleware: ['directeur'] })

const { getAll, create, update, remove, publish, unpublish, uploadCover, coverUrl } = useRealisations()
const toast = useToast()

const { data: items, status, refresh } = useAsyncData('admin-realisations', getAll)

const statutOptions = [
  { label: 'Brouillon', value: 'brouillon' },
  { label: 'Publié', value: 'publie' },
  { label: 'Archivé', value: 'archive' },
]

// ─── Vue formulaire ───────────────────────────────
const view = ref<'list' | 'form'>('list')
const editingId = ref<string | null>(null)
const submitting = ref(false)
const togglingId = ref<string | null>(null)

const blank = () => ({
  titre: '', client: '', lien: '', description: '',
  tagsText: '', ordre: 0, statut: 'brouillon' as Realisation['statut'],
  cover: null as string | null,
})
const form = reactive(blank())
const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

function openCreate() {
  Object.assign(form, blank())
  editingId.value = null
  coverFile.value = null
  coverPreview.value = null
  view.value = 'form'
}

function openEdit(r: Realisation) {
  Object.assign(form, {
    titre: r.titre ?? '',
    client: r.client ?? '',
    lien: r.lien ?? '',
    description: r.description ?? '',
    tagsText: Array.isArray(r.tags) ? r.tags.join(', ') : '',
    ordre: r.ordre ?? 0,
    statut: r.statut ?? 'brouillon',
    cover: r.cover ?? null,
  })
  editingId.value = r.id
  coverFile.value = null
  coverPreview.value = coverUrl(r.cover)
  view.value = 'form'
}

function onCoverChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] ?? null
  coverFile.value = f
  coverPreview.value = f ? URL.createObjectURL(f) : coverUrl(form.cover)
}

async function handleSubmit() {
  if (!form.titre.trim()) {
    toast.add({ title: 'Le titre est requis', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    let coverId = form.cover
    if (coverFile.value) coverId = await uploadCover(coverFile.value)

    const payload: Partial<Realisation> = {
      titre: form.titre.trim(),
      client: form.client.trim() || null,
      lien: form.lien.trim() || null,
      description: form.description.trim() || null,
      tags: form.tagsText.split(',').map(t => t.trim()).filter(Boolean),
      ordre: Number(form.ordre) || 0,
      statut: form.statut,
      cover: coverId,
    }

    if (editingId.value) {
      await update(editingId.value, payload)
      toast.add({ title: 'Réalisation mise à jour', color: 'success' })
    } else {
      await create(payload)
      toast.add({ title: 'Réalisation créée', color: 'success' })
    }
    view.value = 'list'
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de l\'enregistrement', color: 'error' })
  } finally {
    submitting.value = false
  }
}

async function handleToggle(r: Realisation) {
  togglingId.value = r.id
  try {
    if (r.statut === 'publie') await unpublish(r.id)
    else await publish(r.id)
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', color: 'error' })
  } finally {
    togglingId.value = null
  }
}

async function handleDelete(r: Realisation) {
  if (!confirm(`Supprimer la réalisation « ${r.titre} » ?`)) return
  try {
    await remove(r.id)
    toast.add({ title: 'Réalisation supprimée', color: 'success' })
    await refresh()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  }
}

const statutColor = (s?: string) => s === 'publie' ? 'success' : s === 'archive' ? 'neutral' : 'warning'
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader :title="view === 'form' ? (editingId ? 'Éditer une réalisation' : 'Nouvelle réalisation') : 'Réalisations'">
      <template #left>
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="view === 'form' ? (view = 'list') : navigateTo('/admin')"
        />
      </template>
      <template #right>
        <UButton v-if="view === 'list'" label="Nouvelle" icon="i-lucide-plus" size="sm" @click="openCreate" />
        <UButton v-else label="Enregistrer" icon="i-lucide-check" size="sm" :loading="submitting" @click="handleSubmit" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-3xl mx-auto">

        <!-- ─── Liste ─── -->
        <template v-if="view === 'list'">
          <div v-if="status === 'pending'" class="flex items-center justify-center py-12 text-stone-500">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
          </div>
          <div v-else-if="!items?.length" class="text-center py-12">
            <p class="text-sm text-stone-500">Aucune réalisation pour l'instant.</p>
            <UButton class="mt-4" label="Ajouter la première" icon="i-lucide-plus" size="sm" @click="openCreate" />
          </div>
          <div v-else class="space-y-3">
            <UCard v-for="r in items" :key="r.id">
              <div class="flex items-center gap-4">
                <img
                  v-if="coverUrl(r.cover)"
                  :src="coverUrl(r.cover)!"
                  alt=""
                  class="size-16 rounded-lg object-cover bg-stone-100 shrink-0"
                >
                <div v-else class="size-16 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-image" class="size-6 text-stone-300" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-stone-900 truncate">{{ r.titre }}</p>
                    <UBadge :color="statutColor(r.statut)" variant="subtle" size="sm">{{ r.statut }}</UBadge>
                  </div>
                  <p v-if="r.client" class="text-xs text-stone-400 truncate">{{ r.client }}</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <UButton
                    :icon="r.statut === 'publie' ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    :title="r.statut === 'publie' ? 'Dépublier' : 'Publier'"
                    color="neutral" variant="ghost" size="sm"
                    :loading="togglingId === r.id"
                    @click="handleToggle(r)"
                  />
                  <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" @click="openEdit(r)" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" @click="handleDelete(r)" />
                </div>
              </div>
            </UCard>
          </div>
        </template>

        <!-- ─── Formulaire ─── -->
        <template v-else>
          <div class="space-y-6">
            <UCard>
              <div class="space-y-4">
                <UFormField label="Titre *">
                  <UInput v-model="form.titre" placeholder="Nom du projet" class="w-full" />
                </UFormField>
                <UFormField label="Client">
                  <UInput v-model="form.client" placeholder="Nom du client" class="w-full" />
                </UFormField>
                <UFormField label="Lien public">
                  <UInput v-model="form.lien" type="url" placeholder="https://…" class="w-full" />
                </UFormField>
                <UFormField label="Description">
                  <UTextarea v-model="form.description" :rows="4" class="w-full" />
                </UFormField>
                <UFormField label="Tags" hint="séparés par des virgules">
                  <UInput v-model="form.tagsText" placeholder="Vitrine, Réservation, SEO" class="w-full" />
                </UFormField>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold text-stone-900">Image & publication</h3>
              </template>
              <div class="space-y-4">
                <UFormField label="Image de couverture">
                  <div class="flex items-center gap-4">
                    <img v-if="coverPreview" :src="coverPreview" alt="" class="size-20 rounded-lg object-cover bg-stone-100">
                    <div v-else class="size-20 rounded-lg bg-stone-100 flex items-center justify-center">
                      <UIcon name="i-lucide-image" class="size-7 text-stone-300" />
                    </div>
                    <input type="file" accept="image/*" class="text-sm" @change="onCoverChange">
                  </div>
                </UFormField>
                <div class="grid grid-cols-2 gap-4">
                  <UFormField label="Statut">
                    <USelectMenu v-model="form.statut" :items="statutOptions" value-key="value" class="w-full" />
                  </UFormField>
                  <UFormField label="Ordre d'affichage">
                    <UInput v-model="form.ordre" type="number" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </UCard>

            <div class="flex justify-end gap-2">
              <UButton label="Annuler" color="neutral" variant="ghost" @click="view = 'list'" />
              <UButton label="Enregistrer" icon="i-lucide-check" :loading="submitting" @click="handleSubmit" />
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>
