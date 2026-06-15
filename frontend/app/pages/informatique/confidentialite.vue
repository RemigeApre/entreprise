<script setup lang="ts">
definePageMeta({ layout: 'informatique' })

useSeoMeta({
  title: 'Politique de confidentialité · Le Geai Informatique',
  description: 'Traitement des données du formulaire de contact, logs techniques, empreinte anti-spam, cookies, droits RGPD.',
  robots: 'noindex, follow',
})
</script>

<template>
  <article class="gi-legal">
    <div class="gi-container-narrow">
      <header class="gi-legal-head">
        <p class="gi-kicker">RGPD</p>
        <h1>Politique de confidentialité</h1>
        <p class="gi-legal-lead">
          Cette page décrit ce que nous faisons, ou ne faisons pas, des données qui
          transitent par ce site. Le principe est simple : nous en collectons le moins
          possible, et nous vous disons précisément ce qui est conservé.
        </p>
      </header>

      <section>
        <h2>Responsable du traitement</h2>
        <p>
          Le responsable du traitement est Le Geai Informatique, micro-entreprise
          (TVA non applicable, art. 293 B du CGI). Contact :
          <a href="mailto:administration@legeai-editions.com">administration@legeai-editions.com</a>,
          04 82 53 25 64.
        </p>
      </section>

      <section>
        <h2>Ce que nous ne faisons pas</h2>
        <p>
          Le site n'utilise <strong>aucune régie publicitaire</strong>, ne dépose
          <strong>aucun cookie de tracking tiers</strong> (pas de Google Analytics,
          pas de pixel publicitaire). Aucune donnée n'est revendue, partagée à des
          tiers commerciaux ou utilisée à des fins de profilage.
        </p>
      </section>

      <section>
        <h2>Ce que nous collectons</h2>

        <h3>Logs serveur techniques</h3>
        <p>
          Comme tout serveur web, le nôtre conserve des journaux techniques : adresse
          IP, navigateur, page consultée, code de réponse, horaire. Ces logs sont
          conservés au maximum <strong>30 jours</strong> à des fins de sécurité, de
          diagnostic et de lutte contre les abus.
        </p>

        <h3>Formulaire de contact</h3>
        <p>
          Lorsque vous nous écrivez via le
          <NuxtLink to="/informatique/contact">formulaire de contact</NuxtLink>, nous
          conservons ce que vous avez saisi : nom, éventuellement prénom, moyens de
          contact que vous nous indiquez (email, téléphone ou adresse postale), sujet
          et message. Ces données sont stockées dans notre interface d'administration
          et conservées le temps utile à la réponse puis au suivi de votre dossier
          (généralement 3 ans, durée légale minimale pour les pièces commerciales).
        </p>

        <h3>Empreinte anti-spam minimale</h3>
        <p>
          Pour empêcher les soumissions automatisées du formulaire, nous calculons une
          empreinte technique à partir de votre adresse IP, de votre navigateur et d'un
          sel secret propre à notre site. Cette empreinte est :
        </p>
        <ul>
          <li><strong>hachée</strong> de façon irréversible (SHA-256), elle ne permet pas de remonter à votre identité ;</li>
          <li>conservée le temps de détecter les soumissions répétées suspectes ;</li>
          <li>utilisée <strong>uniquement</strong> à des fins de modération et de limitation de débit, jamais croisée avec d'autres données.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Le site n'utilise <strong>aucun cookie de mesure d'audience ni de
          publicité</strong>. Il peut déposer des cookies strictement techniques
          nécessaires au bon fonctionnement (préférences d'affichage, session). Ces
          cookies ne nécessitent pas votre consentement, conformément à l'article 82
          de la loi Informatique et Libertés.
        </p>
      </section>

      <section>
        <h2>Destinataires et hébergement</h2>
        <p>
          Les données ne sont transmises à aucun tiers, ni vendues, ni louées. Elles
          sont accessibles uniquement à Le Geai, dans son interface d'administration
          interne. Elles sont hébergées en France, sur un serveur privé virtuel opéré
          par OVH SAS. Aucun transfert hors de l'Union européenne n'est effectué.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des
          droits d'accès, de rectification, d'effacement, de limitation, de portabilité
          et d'opposition sur vos données personnelles. Pour les exercer, écrivez à
          <a href="mailto:administration@legeai-editions.com">administration@legeai-editions.com</a> ;
          nous répondons dans un délai d'un mois.
        </p>
        <p>
          Pour les données entièrement anonymes (empreintes anti-spam hachées), il
          n'est techniquement pas possible de retrouver les vôtres, donc les droits
          d'accès et d'effacement ne peuvent pas s'y appliquer individuellement.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la
          CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>.
        </p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.gi-legal { padding: 7rem 0 5rem; }
.gi-legal-head { text-align: center; margin-bottom: 3rem; }
.gi-kicker { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gi-dore); }
.gi-legal h1 { margin-top: 1rem; font-size: clamp(2rem, 4vw, 2.8rem); }
.gi-legal-lead { max-width: 620px; margin: 1.5rem auto 0; font-style: italic; color: var(--gi-text-muted); }
.gi-legal section { margin-bottom: 3rem; }
.gi-legal h2 { font-size: 1.4rem; color: var(--gi-text); margin-bottom: 1rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--gi-border); }
.gi-legal h3 { margin-top: 2rem; margin-bottom: 0.6rem; font-size: 1.1rem; color: var(--gi-dore); font-style: italic; font-weight: 500; }
.gi-legal h3:first-of-type { margin-top: 0.5rem; }
.gi-legal p { color: var(--gi-text-muted); line-height: 1.8; margin-bottom: 1rem; }
.gi-legal ul { list-style: none; color: var(--gi-text-muted); margin-bottom: 1rem; padding: 0; }
.gi-legal li { padding: 0.4rem 0 0.4rem 1.4rem; position: relative; line-height: 1.7; }
.gi-legal li::before { content: ''; position: absolute; left: 0; top: 1.05rem; width: 8px; height: 1px; background: var(--gi-dore); }
.gi-legal a { color: var(--gi-dore); border-bottom: 1px solid var(--gi-border); transition: border-color 0.3s ease; }
.gi-legal a:hover { border-bottom-color: var(--gi-dore); }
.gi-legal strong { color: var(--gi-text); font-weight: 700; }
</style>
