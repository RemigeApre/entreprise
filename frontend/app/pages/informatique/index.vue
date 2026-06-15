<script setup lang="ts">
definePageMeta({ layout: 'informatique' })

const SITE = 'https://legeai-editions.com'

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: `${SITE}/informatique` }],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: 'Le Geai Informatique',
      description: 'Création de sites web et logiciels sur mesure, maintenance web durable. Artisanat numérique pour indépendants, artisans et PME.',
      url: `${SITE}/informatique`,
      parentOrganization: { '@type': 'Organization', name: 'Groupe Le Geai', url: SITE },
      areaServed: 'FR',
      email: 'administration@legeai-editions.com',
      telephone: '+33482532564',
      address: { '@type': 'PostalAddress', addressLocality: 'Lyon', addressCountry: 'FR' },
    }),
  }],
})

useSeoMeta({
  title: 'Le Geai Informatique · Sites web et logiciels sur mesure',
  description: 'Artisanat numérique pour indépendants, artisans et PME. Sites web sur mesure et maintenance durable. Premier rendez-vous offert.',
  ogTitle: 'Le Geai Informatique',
  ogDescription: 'Sites web et logiciels sur mesure, maintenance durable. Lyon.',
  ogType: 'website',
})

const tarifs = [
  { label: 'Site vitrine', value: '900 €' },
  { label: 'Site avec espace de gestion', value: 'dès 2 800 €' },
  { label: 'Site e-commerce', value: 'dès 6 500 €' },
  { label: 'Logiciel sur mesure', value: 'sur devis' },
  { label: 'Maintenance web', value: 'dès 39 € / mois' },
]

const piliers = [
  { titre: 'Sur mesure pour votre activité', texte: "Des outils taillés pour votre réalité. Chaque solution s'accorde à vos usages, à vos équipes, à vos clients et à la trajectoire propre de votre activité." },
  { titre: 'Suivi durable', texte: 'Chaque intervention laisse une transmission claire, une disponibilité raisonnable, un accompagnement ponctuel. Ce socle se prolonge en partenariat dans le temps.' },
  { titre: "Simplicité d'usage réelle", texte: 'Nos compositions sont choisies pour leur précision et leur clarté. Les solutions gagnent en lisibilité, en fluidité ; la complexité reste à distance des usages quotidiens.' },
  { titre: "Une ligne d'échange claire", texte: 'Une chaîne courte affine la compréhension, resserre les décisions, soutient une continuité plus ferme.' },
]
</script>

<template>
  <div class="gi-landing">
    <!-- Hero -->
    <section class="gi-hero">
      <div class="gi-container-narrow">
        <p class="gi-kicker">Le Geai · Informatique</p>
        <h1 class="gi-hero-title">Tracer des sentiers,<br />pas seulement des sites.</h1>
        <p class="gi-hero-lead">
          Développement web, logiciels sur mesure et maintenance durable.
          Le meilleur site est celui où l'on ne remarque jamais qu'il a été conçu.
        </p>
        <div class="gi-hero-actions">
          <NuxtLink to="/informatique/contact" class="gi-btn-primary">Parler de votre projet</NuxtLink>
          <a href="#offres" class="gi-btn-ghost">Voir les offres</a>
        </div>
        <p class="gi-hero-note">Premier rendez-vous offert. Réponse sous 48 h ouvrées.</p>
      </div>
    </section>

    <!-- Piliers -->
    <section class="gi-section gi-container">
      <h2 class="gi-section-title">Servir votre activité dans la durée</h2>
      <p class="gi-section-lead">
        Notre travail suit quatre lignes simples : clarifier, alléger, relier, prolonger.
      </p>
      <div class="gi-grid">
        <article v-for="p in piliers" :key="p.titre" class="gi-card">
          <h3>{{ p.titre }}</h3>
          <p>{{ p.texte }}</p>
        </article>
      </div>
    </section>

    <!-- Offres / tarifs -->
    <section id="offres" class="gi-section gi-container">
      <h2 class="gi-section-title">Des repères clairs</h2>
      <p class="gi-section-lead">
        Les tarifs sont annoncés d'emblée. Les réductions santé, environnement,
        associations et ONG s'appliquent ensuite selon votre structure.
      </p>
      <ul class="gi-tarifs">
        <li v-for="t in tarifs" :key="t.label" class="gi-tarif">
          <span class="gi-tarif-label">{{ t.label }}</span>
          <span class="gi-tarif-dots" aria-hidden="true" />
          <span class="gi-tarif-value">{{ t.value }}</span>
        </li>
      </ul>
      <div class="gi-offres-links">
        <NuxtLink to="/informatique/creation-web" class="gi-btn-ghost">Détail création web</NuxtLink>
        <NuxtLink to="/informatique/maintenance-web" class="gi-btn-ghost">Détail maintenance</NuxtLink>
      </div>
    </section>

    <!-- CTA final -->
    <section class="gi-cta">
      <div class="gi-container-narrow">
        <h2>Un projet, une question, un doute ?</h2>
        <p>Décrivez votre besoin. Nous revenons vers vous sous 48 h ouvrées.</p>
        <NuxtLink to="/informatique/contact" class="gi-btn-primary">Nous écrire</NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.gi-hero {
  padding: 7rem 0 4rem;
  text-align: center;
  border-bottom: 1px solid var(--gi-border);
}
.gi-kicker {
  font-size: 0.78rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--gi-dore);
  margin-bottom: 1.5rem;
}
.gi-hero-title { margin-bottom: 1.6rem; }
.gi-hero-lead {
  font-size: 1.2rem;
  font-style: italic;
  color: var(--gi-text-muted);
  max-width: 620px;
  margin: 0 auto 2.4rem;
}
.gi-hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
.gi-hero-note { margin-top: 1.6rem; font-size: 0.9rem; color: var(--gi-text-dim); font-style: italic; }

.gi-section { padding: 4.5rem 1.5rem; }
.gi-section-title { text-align: center; margin-bottom: 1rem; }
.gi-section-lead {
  text-align: center;
  color: var(--gi-text-muted);
  font-style: italic;
  max-width: 640px;
  margin: 0 auto 3rem;
}
.gi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.4rem;
}
.gi-card {
  background: var(--gi-surface-card);
  border: 1px solid var(--gi-border);
  padding: 2rem 1.8rem;
  transition: border-color 0.3s ease;
}
.gi-card:hover { border-color: var(--gi-border-hover); }
.gi-card h3 { color: var(--gi-dore-light); margin-bottom: 0.8rem; }
.gi-card p { color: var(--gi-text-muted); font-size: 0.98rem; }

.gi-tarifs { list-style: none; max-width: 680px; margin: 0 auto; padding: 0; }
.gi-tarif {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--gi-border);
}
.gi-tarif-label { color: var(--gi-text); }
.gi-tarif-dots { flex: 1; border-bottom: 1px dotted var(--gi-border-hover); transform: translateY(-4px); }
.gi-tarif-value { color: var(--gi-dore); font-weight: 700; white-space: nowrap; }
.gi-offres-links { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2.5rem; }

.gi-cta { padding: 5rem 1.5rem; text-align: center; background: var(--gi-surface-raised); border-top: 1px solid var(--gi-border); }
.gi-cta h2 { margin-bottom: 1rem; }
.gi-cta p { color: var(--gi-text-muted); margin-bottom: 2rem; font-style: italic; }

@media (max-width: 640px) {
  .gi-hero { padding: 5rem 0 3rem; }
}
</style>
