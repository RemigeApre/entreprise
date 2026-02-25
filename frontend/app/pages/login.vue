<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const { login, user } = useAuth()

// Redirect if already logged in
if (user.value) {
  await navigateTo('/dashboard')
}

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await login(email.value, password.value)
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = 'Email ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <UIcon name="i-lucide-building-2" class="size-12 text-primary mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          LeGeai Intranet
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Connectez-vous pour acceder a votre espace
        </p>
      </div>

      <UCard>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <UFormField label="Email">
            <UInput
              v-model="email"
              type="email"
              placeholder="votre@email.fr"
              icon="i-lucide-mail"
              required
              autofocus
              size="lg"
            />
          </UFormField>

          <UFormField label="Mot de passe">
            <UInput
              v-model="password"
              type="password"
              placeholder="Mot de passe"
              icon="i-lucide-lock"
              required
              size="lg"
            />
          </UFormField>

          <UAlert
            v-if="error"
            color="error"
            :title="error"
            icon="i-lucide-alert-circle"
          />

          <UButton
            type="submit"
            block
            size="lg"
            :loading="loading"
            label="Se connecter"
            icon="i-lucide-log-in"
          />
        </form>
      </UCard>

      <div class="text-center mt-6">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-primary transition-colors">
          Retour a l'accueil
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
