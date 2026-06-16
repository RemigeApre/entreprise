export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const pin = body?.pin

  if (!pin || typeof pin !== 'string') {
    throw createError({ statusCode: 400, message: 'PIN requis' })
  }

  const directusUrl = process.env.NUXT_DIRECTUS_URL || 'http://directus:8055'
  // Token statique du compte "Comptoir" (permissions limitees). Jamais le token admin.
  const comptoirToken = process.env.COMPTOIR_TOKEN || ''

  if (!comptoirToken) {
    throw createError({ statusCode: 500, message: 'Comptoir non configure (COMPTOIR_TOKEN manquant)' })
  }

  // Lecture du PIN via le token comptoir (lecture seule sur comptoir_settings).
  const settingsRes = await globalThis.fetch(`${directusUrl}/items/comptoir_settings?limit=1`, {
    headers: { Authorization: `Bearer ${comptoirToken}` }
  }).catch(() => null)

  if (!settingsRes || !settingsRes.ok) {
    throw createError({ statusCode: 500, message: 'Impossible de lire les parametres comptoir' })
  }

  const settingsData = await settingsRes.json()
  const settings = settingsData?.data
  // comptoir_settings est un singleton : data peut etre objet ou tableau
  const settingsObj = Array.isArray(settings) ? settings[0] : settings
  const storedPin = settingsObj?.pin_code

  if (!storedPin) {
    throw createError({ statusCode: 500, message: 'PIN non configure dans Directus' })
  }

  if (pin !== storedPin) {
    throw createError({ statusCode: 401, message: 'PIN incorrect' })
  }

  // On renvoie le token scope (et non admin) au client.
  return {
    token: comptoirToken,
    lieu_defaut: settingsObj?.lieu_defaut || null
  }
})
