<script setup lang="ts">
import { creationFormules } from '~/utils/formules'

definePageMeta({ layout: 'informatique' })

const SITE = 'https://legeai-editions.com'

const offerCatalog = {
  '@context': 'https://schema.org',
  '@type': 'OfferCatalog',
  name: 'Formules de création web Le Geai Informatique',
  url: `${SITE}/informatique/creation-web`,
  inLanguage: 'fr-FR',
  provider: { '@type': 'Organization', name: 'Le Geai Informatique', url: `${SITE}/informatique` },
  itemListElement: creationFormules.map((f) => {
    const priceNum = f.tarif.match(/\d[\d ]*/)?.[0]?.replace(/\s/g, '')
    return {
      '@type': 'Offer',
      name: f.name,
      description: f.resume,
      ...(priceNum
        ? { price: priceNum, priceCurrency: 'EUR', availability: 'https://schema.org/InStock' }
        : { priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'EUR' } }),
    }
  }),
}

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: `${SITE}/informatique/creation-web` }],
  script: [{ type: 'application/ld+json', children: JSON.stringify(offerCatalog) }],
})
useSeoMeta({
  title: 'Création de sites web sur mesure · Le Geai Informatique',
  description: 'Quatre formules : Vitrine 900 €, Gestion dès 2 800 €, E-commerce dès 6 500 €, Logiciel sur mesure. Clairs, durables, pensés pour vos clients.',
  ogTitle: 'Création web · Le Geai Informatique',
  ogDescription: 'Vitrine, Gestion, E-commerce, sur mesure. Lyon.',
})
</script>

<template>
  <div class="gi-offres">
    <header class="gi-offres-head">
      <div class="gi-container-narrow">
        <p class="gi-kicker">Création web</p>
        <h1>Des sites et outils sur mesure</h1>
        <p class="gi-lead">
          Clairs, durables, pensés pour vos clients. Trois formules cadrent les
          besoins les plus courants ; au-delà, le sur mesure prend le relais.
        </p>
      </div>
    </header>

    <section class="gi-container gi-offres-grid">
      <article v-for="f in creationFormules" :key="f.slug" class="gi-offre-card">
        <header class="gi-offre-card-head">
          <h2>{{ f.name }}</h2>
          <p class="gi-offre-tarif">{{ f.tarif }}</p>
          <p class="gi-offre-delai">{{ f.delai }}</p>
        </header>
        <ul class="gi-offre-list">
          <li v-for="(c, i) in f.composition" :key="i">{{ c }}</li>
        </ul>
        <NuxtLink to="/informatique/contact" class="gi-btn-ghost gi-offre-cta">Demander un devis</NuxtLink>
      </article>
    </section>

    <section class="gi-container-narrow gi-conditions">
      <p>
        Acompte 30 % à la signature, paiement par paliers. Tarifs nets, TVA non
        applicable, art. 293 B du CGI. Premier rendez-vous offert.
      </p>
    </section>

    <section class="gi-cta-band">
      <div class="gi-container-narrow">
        <h2>Une question, un projet à cadrer ?</h2>
        <p>Décrivez votre activité et ce que vous cherchez à construire. Nous reviendrons avec une proposition juste.</p>
        <div class="gi-cta-row">
          <NuxtLink to="/informatique/contact" class="gi-btn-primary">Demander un cadrage</NuxtLink>
          <NuxtLink to="/informatique/maintenance-web" class="gi-btn-ghost">Voir la maintenance</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.gi-offres-head { padding: 6rem 0 2.5rem; text-align: center; }
.gi-kicker { font-size: 0.78rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gi-dore); margin-bottom: 1.2rem; }
.gi-lead { max-width: 600px; margin: 1.4rem auto 0; font-style: italic; color: var(--gi-text-muted); }

.gi-offres-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 1.4rem;
  padding-bottom: 3rem;
}
.gi-offre-card {
  display: flex;
  flex-direction: column;
  background: var(--gi-surface-card);
  border: 1px solid var(--gi-border);
  padding: 2rem 1.8rem;
  transition: border-color 0.3s ease, transform 0.3s ease;
}
.gi-offre-card:hover { border-color: var(--gi-border-hover); transform: translateY(-3px); }
.gi-offre-card-head { margin-bottom: 1.4rem; }
.gi-offre-card-head h2 { font-size: 1.5rem; text-align: left; }
.gi-offre-tarif { font-style: italic; font-size: 1.5rem; color: var(--gi-dore); line-height: 1.2; margin-top: 0.4rem; }
.gi-offre-delai { font-size: 0.85rem; color: var(--gi-text-muted); margin-top: 0.3rem; }
.gi-offre-list { list-style: none; padding: 0; margin: 0 0 1.6rem; flex: 1; }
.gi-offre-list li { position: relative; padding: 0.45rem 0 0.45rem 1.3rem; color: var(--gi-text-muted); font-size: 0.95rem; line-height: 1.5; }
.gi-offre-list li::before { content: ''; position: absolute; left: 0; top: 0.95rem; width: 8px; height: 1px; background: var(--gi-dore); opacity: 0.7; }
.gi-offre-cta { align-self: flex-start; }

.gi-conditions { text-align: center; padding: 2rem 1.5rem 4rem; }
.gi-conditions p { font-style: italic; color: var(--gi-text-muted); line-height: 1.8; }

.gi-cta-band { padding: 5rem 1.5rem; text-align: center; background: var(--gi-surface-raised); border-top: 1px solid var(--gi-border); }
.gi-cta-band h2 { margin-bottom: 1rem; }
.gi-cta-band p { color: var(--gi-text-muted); font-style: italic; max-width: 560px; margin: 0 auto 2rem; }
.gi-cta-row { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
</style>
