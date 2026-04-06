export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const pin = body?.pin

  if (!pin || typeof pin !== 'string') {
    throw createError({ statusCode: 400, message: 'PIN requis' })
  }

  const config = useRuntimeConfig()
  const directusUrl = config.directusUrl as string
  const adminEmail = config.directusAdminEmail as string
  const adminPassword = config.directusAdminPassword as string

  // Fetch the stored PIN from commerce_settings
  // First, authenticate as admin
  const loginRes = await $fetch<{ data: { access_token: string } }>(`${directusUrl}/auth/login`, {
    method: 'POST',
    body: { email: adminEmail, password: adminPassword }
  }).catch(() => null)

  if (!loginRes) {
    throw createError({ statusCode: 500, message: 'Erreur serveur' })
  }

  const adminToken = loginRes.data.access_token

  // Get PIN from commerce_settings
  const settings = await $fetch<{ data: any[] }>(`${directusUrl}/items/commerce_settings?limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  }).catch(() => null)

  const storedPin = settings?.data?.[0]?.pin_code
  if (!storedPin) {
    throw createError({ statusCode: 500, message: 'PIN non configure' })
  }

  if (pin !== storedPin) {
    throw createError({ statusCode: 401, message: 'PIN incorrect' })
  }

  // Return the admin token (scoped to 8h by Directus config)
  // The commerce interface will use this token for all API calls
  return {
    token: adminToken,
    lieu_defaut: settings?.data?.[0]?.lieu_defaut || null
  }
})
