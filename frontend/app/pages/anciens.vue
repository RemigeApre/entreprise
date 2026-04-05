<script setup lang="ts">
import { createItem, readItems } from '@directus/sdk'

definePageMeta({ layout: false })

const { user, logout } = useAuth()
const { $directus } = useNuxtApp()
const toast = useToast()

const userName = computed(() => {
  if (!user.value) return ''
  return [user.value.first_name, user.value.last_name].filter(Boolean).join(' ') || user.value.email
})

// --- Liens utiles ---
const links = [
  { icon: 'i-lucide-globe', label: 'Site du Geai', url: 'https://legeai-editions.com' },
  { icon: 'i-lucide-feather', label: 'Nos articles', url: '/articles' },
  { icon: 'i-lucide-heart', label: 'Nous soutenir', url: '/soutenir' }
]

// --- Soutien ---
const soutienEmail = ref('')
const soutienMessage = ref('')
const soutienSending = ref(false)
const soutienSent = ref(false)

async function submitSoutien() {
  if (!soutienEmail.value.trim() || !user.value) return
  soutienSending.value = true
  try {
    await $directus.request(createItem('soutiens_anciens', {
      depose_par: user.value.id,
      email_soutenu: soutienEmail.value.trim(),
      message: soutienMessage.value.trim() || null
    }))
    soutienSent.value = true
    toast.add({ title: 'Soutien envoye, merci !', color: 'success' })
    soutienEmail.value = ''
    soutienMessage.value = ''
  } catch {
    toast.add({ title: 'Erreur lors de l\'envoi', color: 'error' })
  } finally {
    soutienSending.value = false
  }
}

// --- RetEx ---
const retexNote = ref(0)
const retexCommentaire = ref('')
const retexSending = ref(false)
const retexSent = ref(false)
const hoverStar = ref(0)

async function submitRetex() {
  if (retexNote.value === 0 || !user.value) return
  retexSending.value = true
  try {
    await $directus.request(createItem('retex_anciens', {
      utilisateur: user.value.id,
      note: retexNote.value,
      commentaire: retexCommentaire.value.trim() || null
    }))
    retexSent.value = true
    toast.add({ title: 'Merci pour votre retour !', color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de l\'envoi', color: 'error' })
  } finally {
    retexSending.value = false
  }
}

// Check if already submitted
async function checkExisting() {
  if (!user.value) return
  try {
    const [retexItems, soutienItems] = await Promise.all([
      $directus.request(readItems('retex_anciens', {
        filter: { utilisateur: { _eq: user.value.id } },
        fields: ['id'],
        limit: 1
      })),
      $directus.request(readItems('soutiens_anciens', {
        filter: { depose_par: { _eq: user.value.id } },
        fields: ['id'],
        limit: 1
      }))
    ])
    if ((retexItems as any[]).length) retexSent.value = true
    if ((soutienItems as any[]).length) soutienSent.value = true
  } catch {
    // Silently fail — collections may not exist yet
  }
}

onMounted(checkExisting)
</script>

<template>
  <div class="min-h-dvh bg-[#E6E2DA] text-[#2c2419]" style="font-family: 'Crimson Pro', Georgia, serif;">
    <!-- Header -->
    <div class="max-w-2xl mx-auto px-4 pt-12 pb-6 text-center">
      <div class="flex items-center justify-center gap-3 mb-6 opacity-40">
        <div class="w-10 h-px bg-stone-400" />
        <div class="size-1.5 rotate-45 bg-stone-400" />
        <div class="w-10 h-px bg-stone-400" />
      </div>

      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight mb-2" style="font-family: 'IM Fell DW Pica', Georgia, serif;">
        Les Anciens
      </h1>
      <p class="text-sm text-stone-500 mb-1">
        Bienvenue, {{ userName }}.
      </p>
      <p class="text-xs text-stone-400 leading-relaxed max-w-md mx-auto">
        Votre contrat est arrive a terme, mais votre passage ici compte.
        Retrouvez nos liens, soutenez un collegue, ou partagez votre experience.
      </p>
    </div>

    <div class="max-w-2xl mx-auto px-4 pb-16 space-y-6">

      <!-- Liens utiles -->
      <section class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
        <h2 class="text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
          <UIcon name="i-lucide-bookmark" class="size-4 text-[#af8f3c]" />
          Liens utiles
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <a
            v-for="link in links"
            :key="link.url"
            :href="link.url"
            target="_blank"
            class="flex items-center gap-3 px-4 py-3 rounded-lg border border-stone-200/60 bg-white/40 hover:border-[rgba(175,143,60,0.3)] hover:bg-white/70 transition-all"
          >
            <UIcon :name="link.icon" class="size-4 text-[#af8f3c] opacity-60" />
            <span class="text-sm font-medium text-stone-700">{{ link.label }}</span>
          </a>
        </div>
      </section>

      <!-- Soutenir quelqu'un -->
      <section class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
        <h2 class="text-sm font-semibold text-stone-800 mb-1 flex items-center gap-2">
          <UIcon name="i-lucide-heart-handshake" class="size-4 text-[#af8f3c]" />
          Soutenir une personne
        </h2>
        <p class="text-xs text-stone-400 mb-4">
          Deposez l'email d'une personne que vous souhaitez recommander ou soutenir.
        </p>

        <div v-if="soutienSent" class="text-center py-4">
          <UIcon name="i-lucide-check-circle" class="size-8 text-emerald-500 mx-auto mb-2" />
          <p class="text-sm text-stone-600 font-medium">Soutien enregistre, merci !</p>
        </div>

        <form v-else class="space-y-3" @submit.prevent="submitSoutien">
          <UInput
            v-model="soutienEmail"
            type="email"
            placeholder="Email de la personne"
            icon="i-lucide-mail"
            required
            class="w-full"
          />
          <UTextarea
            v-model="soutienMessage"
            placeholder="Un mot (optionnel)"
            :rows="2"
            class="w-full"
          />
          <UButton
            type="submit"
            label="Envoyer"
            icon="i-lucide-send"
            size="sm"
            :loading="soutienSending"
            :disabled="!soutienEmail.trim()"
          />
        </form>
      </section>

      <!-- RetEx -->
      <section class="rounded-xl bg-white/50 border border-white/70 shadow-sm p-5">
        <h2 class="text-sm font-semibold text-stone-800 mb-1 flex items-center gap-2">
          <UIcon name="i-lucide-message-square-text" class="size-4 text-[#af8f3c]" />
          Retour d'experience
        </h2>
        <p class="text-xs text-stone-400 mb-4">
          Partagez votre avis sur votre experience au sein du groupe.
        </p>

        <div v-if="retexSent" class="text-center py-4">
          <UIcon name="i-lucide-check-circle" class="size-8 text-emerald-500 mx-auto mb-2" />
          <p class="text-sm text-stone-600 font-medium">Merci pour votre retour !</p>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submitRetex">
          <!-- Stars -->
          <div>
            <p class="text-xs text-stone-500 mb-2">Note</p>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="transition-transform hover:scale-110"
                @mouseenter="hoverStar = star"
                @mouseleave="hoverStar = 0"
                @click="retexNote = star"
              >
                <UIcon
                  :name="(hoverStar || retexNote) >= star ? 'i-lucide-star' : 'i-lucide-star'"
                  class="size-7 transition-colors"
                  :class="(hoverStar || retexNote) >= star ? 'text-amber-400' : 'text-stone-300'"
                />
              </button>
              <span v-if="retexNote > 0" class="ml-2 text-sm text-stone-500 tabular-nums">{{ retexNote }}/5</span>
            </div>
          </div>

          <!-- Comment -->
          <UTextarea
            v-model="retexCommentaire"
            placeholder="Votre avis (optionnel)"
            :rows="3"
            class="w-full"
          />

          <UButton
            type="submit"
            label="Envoyer mon retour"
            icon="i-lucide-check"
            size="sm"
            :loading="retexSending"
            :disabled="retexNote === 0"
          />
        </form>
      </section>

      <!-- Deconnexion -->
      <div class="text-center pt-4">
        <button
          class="text-xs text-stone-400 hover:text-stone-600 transition-colors underline underline-offset-2"
          @click="logout()"
        >
          Se deconnecter
        </button>
      </div>
    </div>
  </div>
</template>
