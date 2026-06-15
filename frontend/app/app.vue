<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'color-scheme', content: 'light only' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', href: '/logo.svg' }
  ],
  htmlAttrs: {
    lang: 'fr',
    class: 'light'
  },
  script: [
    { innerHTML: "document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';", tagPosition: 'head' }
  ],
  // Fond crème par défaut pour éviter le flash blanc au démarrage SPA
  style: [
    { children: 'html, body { background-color: #E6E2DA; }' }
  ]
})

const title = 'LeGeai - Intranet'
const description = 'Plateforme intranet du groupe LeGeai'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="#AF8F3C" :height="2" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
