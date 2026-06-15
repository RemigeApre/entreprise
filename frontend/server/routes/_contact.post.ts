import {
  getClientFingerprint,
  rateLimiter,
  checkOrigin,
  DEFAULT_ALLOWED_HOSTS,
  looksLikeSpam,
  isValidEmail,
} from '../utils/contactSecurity'

// Endpoint du formulaire de contact Le Geai Informatique.
// Valide + filtre les bots, puis enregistre le message dans la collection
// `contact_messages` du Directus interne (ecriture via token admin, donc la
// collection n'est PAS ouverte en ecriture publique).

const ALLOWED_SERVICES = new Set([
  'creation-vitrine',
  'creation-gestion',
  'creation-e-commerce',
  'creation-logiciel',
  'maintenance-essentiel',
  'maintenance-pro',
  'maintenance-premium',
  'maintenance-legendaire',
  'hesite',
])

// Anti-bot : seuils de remplissage humain plausible
const MIN_FILL_TIME_MS = 2500
const MAX_FILL_TIME_MS = 30 * 60_000

// Rate limit : 3 envois par 10 minutes par fingerprint
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 10 * 60_000

interface Payload {
  last_name?: string
  first_name?: string
  contact_email?: string
  contact_phone?: string
  contact_postal?: string
  subject?: string
  service_interest?: string
  message?: string
  website?: string        // honeypot
  _ts?: string | number   // timestamp pose par le JS au chargement
}

const trim = (s: unknown): string => (typeof s === 'string' ? s.trim() : '')

// "Succes silencieux" : on retourne 200 meme quand on jette une soumission bot,
// pour ne pas leur donner de signal.
const fakeSuccess = () => ({ ok: true as const })

// ── Cache du token admin (evite un login Directus a chaque soumission) ──
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAdminToken(directusUrl: string, email: string, password: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }
  const res = await globalThis.fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).catch(() => null)
  if (!res || !res.ok) return null
  const data = await res.json().catch(() => null)
  const token = data?.data?.access_token
  const ttl = Number(data?.data?.expires ?? 0) // ms
  if (!token) return null
  cachedToken = { value: token, expiresAt: Date.now() + (ttl > 0 ? ttl : 10 * 60_000) }
  return token
}

export default defineEventHandler(async (event) => {
  const headers = event.node.req.headers

  // 1. Verification d'origine (anti-CSRF)
  if (!checkOrigin(headers, DEFAULT_ALLOWED_HOSTS)) {
    setResponseStatus(event, 403)
    return { ok: false, error: 'Origine non autorisee.' }
  }

  // 2. Limite de taille du body
  const lenHeader = getRequestHeader(event, 'content-length')
  if (lenHeader && Number(lenHeader) > 12_000) {
    setResponseStatus(event, 413)
    return { ok: false, error: 'Requete trop volumineuse.' }
  }

  let body: Payload
  try {
    body = await readBody(event)
  } catch {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Format de requete invalide.' }
  }
  if (!body || typeof body !== 'object') {
    setResponseStatus(event, 400)
    return { ok: false, error: 'Format de requete invalide.' }
  }

  // 3. Honeypot
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return fakeSuccess()
  }

  // 4. Time check
  const ts = Number(body._ts ?? 0)
  if (ts > 0) {
    const elapsed = Date.now() - ts
    if (elapsed < MIN_FILL_TIME_MS || elapsed > MAX_FILL_TIME_MS) {
      return fakeSuccess()
    }
  }

  // 5. Rate limiting par fingerprint
  const fp = getClientFingerprint(headers)
  if (rateLimiter.hit(`contact:${fp}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    setResponseStatus(event, 429)
    return { ok: false, error: 'Trop d\'envois successifs. Reessayez dans quelques minutes.' }
  }

  // 6. Extraction et validation
  const last_name = trim(body.last_name)
  const first_name = trim(body.first_name)
  const contact_email = trim(body.contact_email)
  const contact_phone = trim(body.contact_phone)
  const contact_postal = trim(body.contact_postal)
  const subject = trim(body.subject)
  const service_interest = trim(body.service_interest)
  const message = trim(body.message)

  const errors: Record<string, string> = {}

  if (!last_name) errors.last_name = 'Votre nom est requis.'
  if (last_name.length > 200) errors.last_name = 'Nom trop long.'
  if (first_name.length > 200) errors.first_name = 'Prenom trop long.'
  if (contact_phone.length > 50) errors.contact_phone = 'Telephone trop long.'
  if (contact_postal.length > 500) errors.contact_postal = 'Adresse trop longue.'

  if (!contact_email && !contact_phone && !contact_postal) {
    errors.contact_method = 'Renseignez au moins un moyen de contact (email, telephone ou adresse).'
  }
  if (contact_email && !isValidEmail(contact_email)) {
    errors.contact_email = 'Email invalide.'
  }

  if (subject !== 'service' && subject !== 'divers') {
    errors.subject = 'Choisissez un sujet.'
  }
  if (subject === 'service') {
    if (!service_interest || !ALLOWED_SERVICES.has(service_interest)) {
      errors.service_interest = 'Choisissez un service ou cochez « j\'hesite encore ».'
    }
  }
  if (subject === 'divers' && !message) {
    errors.message = 'Decrivez votre demande.'
  }
  if (message.length > 5000) errors.message = 'Message trop long.'

  if (Object.keys(errors).length > 0) {
    setResponseStatus(event, 422)
    return { ok: false, errors }
  }

  // 7. Heuristiques anti-spam sur les zones libres
  const freeText = `${message} ${last_name} ${first_name} ${contact_postal}`
  if (looksLikeSpam(freeText)) {
    return fakeSuccess()
  }

  // 8. Enregistrement dans Directus (via token admin)
  const config = useRuntimeConfig()
  const directusUrl = (config.directusUrl as string) || 'http://directus:8055'
  const adminEmail = (config.directusAdminEmail as string) || ''
  const adminPassword = (config.directusAdminPassword as string) || ''

  if (!adminEmail || !adminPassword) {
    setResponseStatus(event, 500)
    return { ok: false, error: 'Configuration serveur manquante.' }
  }

  const token = await getAdminToken(directusUrl, adminEmail, adminPassword)
  if (!token) {
    setResponseStatus(event, 502)
    return { ok: false, error: 'Service temporairement indisponible.' }
  }

  const item = {
    last_name,
    first_name: first_name || null,
    contact_email: contact_email || null,
    contact_phone: contact_phone || null,
    contact_postal: contact_postal || null,
    subject,
    service_interest: subject === 'service' ? service_interest : null,
    message: message || null,
    statut: 'nouveau',
  }

  try {
    const r = await globalThis.fetch(`${directusUrl}/items/contact_messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(item),
    })
    if (!r.ok) {
      // Token peut-etre expire : on invalide le cache pour le prochain essai
      cachedToken = null
      const text = await r.text()
      console.error('Directus contact_messages POST failed', r.status, text.slice(0, 300))
      setResponseStatus(event, 502)
      return { ok: false, error: 'Enregistrement impossible. Reessayez dans un instant.' }
    }
  } catch (e) {
    console.error('Directus unreachable', e)
    setResponseStatus(event, 502)
    return { ok: false, error: 'Service temporairement indisponible.' }
  }

  return { ok: true }
})
