<script setup lang="ts">
definePageMeta({ layout: 'informatique' })

const SITE = 'https://legeai-editions.com'

useHead({
  htmlAttrs: { lang: 'fr' },
  link: [{ rel: 'canonical', href: `${SITE}/informatique/contact` }],
})
useSeoMeta({
  title: 'Contact · Le Geai Informatique',
  description: 'Échangeons sur votre projet. Email, téléphone ou formulaire détaillé. Réponse sous 48 h ouvrées. Premier rendez-vous offert.',
  ogTitle: 'Contact · Le Geai Informatique',
  ogDescription: 'Parlons de votre projet. Réponse sous 48 h ouvrées.',
})

const services = [
  { value: 'creation-vitrine', label: 'Création web · Vitrine' },
  { value: 'creation-gestion', label: 'Création web · Gestion' },
  { value: 'creation-e-commerce', label: 'Création web · E-commerce' },
  { value: 'creation-logiciel', label: 'Création web · Logiciel sur mesure' },
  { value: 'maintenance-essentiel', label: 'Maintenance · Essentiel' },
  { value: 'maintenance-pro', label: 'Maintenance · Pro' },
  { value: 'maintenance-premium', label: 'Maintenance · Premium' },
  { value: 'maintenance-legendaire', label: 'Maintenance · Légendaire' },
  { value: 'hesite', label: "J'hésite encore" },
]

const form = reactive({
  last_name: '',
  first_name: '',
  contact_email: '',
  contact_phone: '',
  contact_postal: '',
  subject: '' as '' | 'service' | 'divers',
  service_interest: '',
  message: '',
  website: '', // honeypot
})

const ts = ref(0)
onMounted(() => { ts.value = Date.now() })

const errorMsg = ref('')
const submitting = ref(false)
const sent = ref(false)

const messageRequired = computed(() => form.subject === 'divers')
const messageHint = computed(() =>
  form.subject === 'service' ? 'facultatif'
    : form.subject === 'divers' ? 'requis'
      : 'facultatif si demande de service',
)

function clientValidate(): string | null {
  if (!form.last_name.trim()) return 'Votre nom est requis.'
  if (!form.contact_email.trim() && !form.contact_phone.trim() && !form.contact_postal.trim()) {
    return 'Renseignez au moins un moyen de contact (email, téléphone ou adresse).'
  }
  if (!form.subject) return 'Choisissez un sujet.'
  if (form.subject === 'service' && !form.service_interest.trim()) {
    return 'Choisissez un service ou cochez « j\'hésite encore ».'
  }
  if (form.subject === 'divers' && !form.message.trim()) return 'Décrivez votre demande.'
  return null
}

async function submit() {
  errorMsg.value = ''
  const err = clientValidate()
  if (err) { errorMsg.value = err; return }

  submitting.value = true
  try {
    const payload = { ...form, _ts: ts.value }
    const res = await $fetch<{ ok: boolean; error?: string; errors?: Record<string, string> }>('/_contact', {
      method: 'POST',
      body: payload,
    }).catch((e: { data?: { ok: boolean; error?: string; errors?: Record<string, string> } }) => e?.data ?? null)

    if (res && res.ok) {
      sent.value = true
    } else {
      const firstErr = res?.errors ? Object.values(res.errors)[0] : res?.error
      errorMsg.value = String(firstErr ?? 'Une erreur est survenue. Réessayez dans un instant.')
    }
  } catch {
    errorMsg.value = 'Connexion au serveur impossible. Réessayez dans un instant.'
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  sent.value = false
  errorMsg.value = ''
  Object.assign(form, {
    last_name: '', first_name: '', contact_email: '', contact_phone: '',
    contact_postal: '', subject: '', service_interest: '', message: '', website: '',
  })
  ts.value = Date.now()
}
</script>

<template>
  <div class="gi-contact">
    <header class="gi-contact-head">
      <div class="gi-container-narrow">
        <p class="gi-kicker">Contact</p>
        <h1>Parlons de votre projet</h1>
        <p class="gi-lead">
          Trois portes pour entrer : un email direct, un appel, ou un formulaire
          si vous préférez poser le besoin par écrit. Réponse sous 48 h ouvrées.
        </p>
      </div>
    </header>

    <section class="gi-container gi-contact-grid">
      <!-- Aside : contact direct -->
      <aside class="gi-aside">
        <div class="gi-block">
          <p class="gi-block-kicker">Direct</p>
          <p class="gi-meta">Réponse sous 48 h ouvrées</p>
          <a href="mailto:administration@legeai-editions.com" class="gi-big-link">administration@legeai-editions.com</a>
          <a href="tel:+33482532564" class="gi-big-link">04 82 53 25 64</a>
        </div>
        <div class="gi-rule" aria-hidden="true" />
        <div class="gi-block">
          <p class="gi-block-kicker">Engagements</p>
          <ul class="gi-commit">
            <li>Premier rendez-vous offert.</li>
            <li>Aucun envoi commercial après l'échange.</li>
            <li>Données conservées pour le suivi du dossier uniquement.</li>
          </ul>
          <p class="gi-meta">
            Voir la <NuxtLink to="/informatique/confidentialite">politique de confidentialité</NuxtLink>.
          </p>
        </div>
      </aside>

      <!-- Formulaire -->
      <div class="gi-main-col">
        <template v-if="!sent">
          <h2>Décrire votre besoin</h2>
          <p class="gi-form-lead">Quelques minutes suffisent. Tout est enregistré en interne.</p>

          <form class="gi-form" novalidate @submit.prevent="submit">
            <!-- Honeypot -->
            <div class="gi-hp" aria-hidden="true">
              <label for="gi-hp-website">Site web (laissez vide)</label>
              <input id="gi-hp-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
            </div>

            <fieldset class="gi-fs">
              <legend>Vous</legend>
              <div class="gi-row">
                <label class="gi-field">
                  <span>Nom <em>· requis</em></span>
                  <input v-model="form.last_name" type="text" required autocomplete="family-name" maxlength="200" />
                </label>
                <label class="gi-field">
                  <span>Prénom</span>
                  <input v-model="form.first_name" type="text" autocomplete="given-name" maxlength="200" />
                </label>
              </div>
            </fieldset>

            <fieldset class="gi-fs">
              <legend>Comment vous joindre <em class="gi-hint">au moins un</em></legend>
              <div class="gi-row">
                <label class="gi-field">
                  <span>Email</span>
                  <input v-model="form.contact_email" type="email" autocomplete="email" />
                </label>
                <label class="gi-field">
                  <span>Téléphone</span>
                  <input v-model="form.contact_phone" type="tel" autocomplete="tel" />
                </label>
              </div>
              <label class="gi-field">
                <span>Adresse postale</span>
                <textarea v-model="form.contact_postal" rows="2" autocomplete="street-address" />
              </label>
            </fieldset>

            <fieldset class="gi-fs">
              <legend>Sujet de la demande <em>· requis</em></legend>
              <div class="gi-radio-group">
                <label class="gi-radio">
                  <input v-model="form.subject" type="radio" value="service" name="subject" />
                  <span class="gi-radio-mark" />
                  <span>Demande sur un service</span>
                </label>
                <label class="gi-radio">
                  <input v-model="form.subject" type="radio" value="divers" name="subject" />
                  <span class="gi-radio-mark" />
                  <span>Sujet divers</span>
                </label>
              </div>
            </fieldset>

            <fieldset v-if="form.subject === 'service'" class="gi-fs">
              <legend>Quel service vous intéresse</legend>
              <label class="gi-field">
                <span>Choisissez dans la liste</span>
                <select v-model="form.service_interest">
                  <option value="">— sélectionner —</option>
                  <option v-for="s in services" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </label>
            </fieldset>

            <fieldset class="gi-fs">
              <legend>Votre message <em class="gi-hint">{{ messageHint }}</em></legend>
              <label class="gi-field">
                <span class="gi-sr-only">Message</span>
                <textarea
                  v-model="form.message"
                  rows="6"
                  maxlength="5000"
                  :required="messageRequired"
                  placeholder="Décrivez votre activité, ce que vous cherchez à construire, vos contraintes…"
                />
              </label>
            </fieldset>

            <p v-if="errorMsg" class="gi-form-error" role="alert">{{ errorMsg }}</p>

            <div class="gi-form-actions">
              <button type="submit" class="gi-btn-primary" :disabled="submitting">
                {{ submitting ? 'Envoi…' : 'Envoyer la demande' }}
              </button>
            </div>
          </form>
        </template>

        <div v-else class="gi-form-success">
          <p class="gi-success-icon" aria-hidden="true">✓</p>
          <h3>Demande bien reçue</h3>
          <p>Merci. Nous revenons vers vous sous 48 h ouvrées sur le moyen de contact que vous avez indiqué.</p>
          <button type="button" class="gi-btn-ghost" @click="resetForm">Envoyer une autre demande</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.gi-contact-head { padding: 6rem 0 2.5rem; text-align: center; }
.gi-kicker { font-size: 0.78rem; letter-spacing: 0.28em; text-transform: uppercase; color: var(--gi-dore); margin-bottom: 1.2rem; }
.gi-lead { max-width: 600px; margin: 1.4rem auto 0; font-style: italic; color: var(--gi-text-muted); }

.gi-contact-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 4rem;
  align-items: start;
  padding-bottom: 5rem;
}

.gi-aside { position: sticky; top: 6rem; }
.gi-block + .gi-block { margin-top: 1.6rem; }
.gi-block-kicker { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gi-dore); margin-bottom: 0.4rem; }
.gi-meta { font-size: 0.85rem; font-style: italic; color: var(--gi-text-dim); margin-bottom: 1.2rem; }
.gi-meta a { color: var(--gi-dore); border-bottom: 1px solid var(--gi-border); }
.gi-big-link { display: block; font-size: 1.15rem; font-style: italic; color: var(--gi-dore); margin-bottom: 0.6rem; word-break: break-word; transition: opacity 0.3s ease; }
.gi-big-link:hover { opacity: 0.75; }
.gi-rule { width: 32px; height: 1px; background: var(--gi-border); margin: 1.8rem 0; }
.gi-commit { list-style: none; margin: 0 0 1rem; padding: 0; }
.gi-commit li { position: relative; padding: 0.4rem 0 0.4rem 1.2rem; color: var(--gi-text-muted); font-size: 0.95rem; }
.gi-commit li::before { content: ''; position: absolute; left: 0; top: 0.95rem; width: 8px; height: 1px; background: var(--gi-dore); opacity: 0.6; }

.gi-main-col h2 { font-size: clamp(1.4rem, 2.4vw, 1.7rem); margin-bottom: 0.6rem; }
.gi-form-lead { color: var(--gi-text-muted); font-style: italic; margin-bottom: 2rem; }
.gi-form { display: flex; flex-direction: column; gap: 1.8rem; }

.gi-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

.gi-fs { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.9rem; }
.gi-fs legend { font-size: 0.74rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gi-dore); margin-bottom: 0.4rem; }
.gi-fs legend em { font-style: italic; font-weight: 400; color: var(--gi-text-dim); letter-spacing: 0.05em; text-transform: none; }
.gi-fs legend em.gi-hint { margin-left: 0.5rem; color: var(--gi-text-muted); }

.gi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.gi-field { display: flex; flex-direction: column; gap: 0.4rem; }
.gi-field > span { font-size: 0.85rem; color: var(--gi-text-muted); }
.gi-field > span em { font-style: italic; color: var(--gi-dore); font-weight: 700; }
.gi-sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.gi-contact :deep(input[type="text"]),
.gi-contact input[type="email"],
.gi-contact input[type="tel"],
.gi-contact textarea,
.gi-contact select {
  padding: 0.85rem 1rem;
  background: var(--gi-surface-card);
  border: 1px solid var(--gi-border);
  color: var(--gi-text);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  width: 100%;
  transition: border-color 0.3s ease;
}
.gi-contact textarea { resize: vertical; min-height: 80px; }
.gi-contact input:focus, .gi-contact textarea:focus, .gi-contact select:focus { outline: none; border-color: var(--gi-dore); }
.gi-contact select { appearance: none; cursor: pointer; }
.gi-contact select option { background: var(--gi-surface-card); color: var(--gi-text); }

.gi-radio-group { display: flex; gap: 1.5rem; flex-wrap: wrap; }
.gi-radio { display: flex; align-items: center; gap: 0.7rem; cursor: pointer; padding: 0.5rem 0; }
.gi-radio input { position: absolute; opacity: 0; pointer-events: none; }
.gi-radio-mark { width: 18px; height: 18px; border: 1.5px solid var(--gi-border-hover); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: border-color 0.3s ease; }
.gi-radio-mark::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--gi-dore); transform: scale(0); transition: transform 0.2s ease; }
.gi-radio input:checked + .gi-radio-mark { border-color: var(--gi-dore); }
.gi-radio input:checked + .gi-radio-mark::after { transform: scale(1); }

.gi-form-error { padding: 1rem 1.2rem; border: 1px solid #c66; background: rgba(170, 60, 60, 0.12); color: #f0c4c4; font-style: italic; }
.gi-form-actions { margin-top: 0.5rem; }

.gi-form-success { text-align: center; padding: 3rem 1rem; border: 1px solid var(--gi-dore); background: rgba(201, 169, 97, 0.06); }
.gi-success-icon { font-size: 3rem; color: var(--gi-dore); line-height: 1; margin-bottom: 0.5rem; }
.gi-form-success h3 { font-size: 1.5rem; margin-bottom: 0.8rem; }
.gi-form-success p { color: var(--gi-text-muted); max-width: 460px; margin: 0 auto 1.8rem; }

@media (max-width: 900px) {
  .gi-contact-grid { grid-template-columns: 1fr; gap: 3rem; }
  .gi-aside { position: static; }
}
@media (max-width: 600px) {
  .gi-row { grid-template-columns: 1fr; }
}
</style>
