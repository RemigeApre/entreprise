// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055'
    }
  },

  routeRules: {
    '/': { prerender: true },
    '/recrutement': { prerender: false },
    '/dashboard/**': { ssr: false },
    '/planning/**': { ssr: false },
    '/prospection/**': { ssr: false },
    '/projets/**': { ssr: false },
    '/equipe/**': { ssr: false },
    '/offres/**': { ssr: false },
    '/profil/**': { ssr: false }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
