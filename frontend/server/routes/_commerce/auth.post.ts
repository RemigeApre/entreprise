export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const pin = body?.pin

  if (!pin || typeof pin !== 'string') {
    throw createError({ statusCode: 400, message: 'PIN requis' })
  }

  const directusUrl = process.env.NUXT_DIRECTUS_URL || 'http://directus:8055'
  const adminEmail = process.env.ADMIN_EMAIL || ''
  const adminPassword = process.env.ADMIN_PASSWORD || ''

  if (!adminEmail || !adminPassword) {
    throw createError({ statusCode: 500, message: 'Configuration admin manquante' })
  }

  // Authenticate as admin to Directus
  const loginRes = await globalThis.fetch(`${directusUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  }).catch(() => null)

  if (!loginRes || !loginRes.ok) {
    throw createError({ statusCode: 500, message: 'Erreur authentification serveur' })
  }

  const loginData = await loginRes.json()
  const adminToken = loginData?.data?.access_token
  if (!adminToken) {
    throw createError({ statusCode: 500, message: 'Token admin invalide' })
  }

  // Get PIN from commerce_settings
  const settingsRes = await globalThis.fetch(`${directusUrl}/items/commerce_settings?limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).catch(() => null)

  if (!settingsRes || !settingsRes.ok) {
    throw createError({ statusCode: 500, message: 'Impossible de lire les parametres commerce' })
  }

  const settingsData = await settingsRes.json()
  const settings = settingsData?.data
  // commerce_settings is a singleton, data can be an object or array
  const settingsObj = Array.isArray(settings) ? settings[0] : settings
  const storedPin = settingsObj?.pin_code

  if (!storedPin) {
    throw createError({ statusCode: 500, message: 'PIN non configure dans Directus' })
  }

  if (pin !== storedPin) {
    throw createError({ statusCode: 401, message: 'PIN incorrect' })
  }

  return {
    token: adminToken,
    lieu_defaut: settingsObj?.lieu_defaut || null
  }
})
