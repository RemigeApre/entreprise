// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/sitemap'
  ],

  site: {
    url: 'https://entreprise.legeai-editions.com',
    name: 'Groupe Le Geai'
  },

  sitemap: {
    sources: [
      '/api/sitemap/articles'
    ],
    urls: [
      { loc: '/', priority: 1.0, changefreq: 'weekly' },
      { loc: '/le-geai', priority: 0.8, changefreq: 'monthly' },
      { loc: '/le-geai/transparence', priority: 0.6, changefreq: 'monthly' },
      { loc: '/soutenir', priority: 0.7, changefreq: 'monthly' },
      { loc: '/recrutement', priority: 0.9, changefreq: 'weekly' },
      { loc: '/articles', priority: 0.8, changefreq: 'daily' }
    ],
    exclude: [
      '/admin/**', '/dashboard/**', '/planning/**', '/equipe/**',
      '/projets/**', '/offres/**', '/candidats/**', '/wiki/**',
      '/profil/**', '/clients/**', '/stages/**', '/prospection/**',
      '/emploi-du-temps/**'
    ]
  },

  devtools: {
    enabled: process.env.NODE_ENV !== 'production'
  },

  css: ['~/assets/css/main.css'],

  icon: {
    localApiEndpoint: '/_nuxt_icon',
    clientBundle: {
      scan: true,
      include: [
        'lucide:chevron-down',
        'lucide:chevron-up',
        'lucide:chevron-right',
        'lucide:chevron-left',
        'lucide:chevrons-up-down',
        'lucide:check',
        'lucide:x',
        'lucide:loader-circle',
        'lucide:search',
        'lucide:circle',
        'lucide:minus',
        'lucide:eye',
        'lucide:eye-off',
        'lucide:circle-alert',
        'lucide:circle-check',
        'lucide:info',
        'lucide:triangle-alert',
        'lucide:ellipsis',
        'lucide:arrow-up-down',
        'lucide:external-link',
        'lucide:heart',
        'lucide:mail',
        'lucide:share-2',
        'lucide:message-circle',
        'lucide:scroll-text',
        'lucide:cpu',
        'lucide:crown',
        'lucide:flame',
        'lucide:key-round',
        'lucide:sun',
        'lucide:moon',
        'lucide:book-open',
        'lucide:feather',
        'lucide:user',
        'lucide:arrow-left',
        'lucide:database'
      ],
      sizeLimitKb: 0
    }
  },

  runtimeConfig: {
    directusUrl: process.env.NUXT_DIRECTUS_URL || 'http://localhost:8055',
    directusAdminEmail: process.env.ADMIN_EMAIL || '',
    directusAdminPassword: process.env.ADMIN_PASSWORD || '',
    public: {
      directusUrl: process.env.NUXT_PUBLIC_DIRECTUS_URL || '/api',
      cmsUrl: process.env.NUXT_PUBLIC_CMS_URL || ''
    }
  },

  routeRules: {
    '/api/**': { proxy: 'http://directus:8055/**' },
    '/': { prerender: true },
    '/le-geai': { prerender: true },
    '/le-geai/**': { prerender: true },
    '/soutenir': { prerender: true },
    '/recrutement': { prerender: false, headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    '/articles': { prerender: false, headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    '/articles/**': { prerender: false, headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    '/rdv/**': { ssr: true },
    // Intranet routes — SPA only (no SSR, auth is client-side)
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/dashboard': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/planning': { ssr: false },
    '/planning/**': { ssr: false },
    '/emploi-du-temps': { ssr: false },
    '/emploi-du-temps/**': { ssr: false },
    '/prospection': { ssr: false },
    '/prospection/**': { ssr: false },
    '/projets': { ssr: false },
    '/projets/**': { ssr: false },
    '/equipe': { ssr: false },
    '/equipe/**': { ssr: false },
    '/offres': { ssr: false },
    '/offres/**': { ssr: false },
    '/profil': { ssr: false },
    '/profil/**': { ssr: false },
    '/clients': { ssr: false },
    '/clients/**': { ssr: false },
    '/candidats': { ssr: false },
    '/candidats/**': { ssr: false },
    '/wiki': { ssr: false },
    '/wiki/**': { ssr: false },
    '/stages': { ssr: false },
    '/stages/**': { ssr: false }
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
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
