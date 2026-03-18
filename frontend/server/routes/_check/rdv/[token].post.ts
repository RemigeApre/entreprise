interface BookingBody {
  datetime: string    // "2026-03-20T09:00:00"
  canal: string       // "visio" | "telephone" | "physique"
  discord_id?: string
  telephone?: string
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') as string
  if (!token) throw createError({ statusCode: 400 })

  const body = await readBody<BookingBody>(event)
  if (!body?.datetime || !body?.canal) throw createError({ statusCode: 400, message: 'Données manquantes' })

  const config = useRuntimeConfig()

  // Auth admin
  let adminToken: string
  try {
    const auth = await $fetch<any>(`${config.directusUrl}/auth/login`, {
      method: 'POST',
      body: { email: config.directusAdminEmail, password: config.directusAdminPassword }
    })
    adminToken = auth.data.access_token
  } catch {
    throw createError({ statusCode: 500, message: 'Erreur de configuration serveur' })
  }

  const h = { Authorization: `Bearer ${adminToken}` }

  // Validate token
  const tokenRes = await $fetch<any>(
    `${config.directusUrl}/items/candidat_booking_tokens?filter[token][_eq]=${encodeURIComponent(token)}&filter[utilise][_eq]=false&fields=id,expires_at,candidat&limit=1`,
    { headers: h }
  ).catch(() => null)

  const tokenData = tokenRes?.data?.[0]
  if (!tokenData) throw createError({ statusCode: 404, message: 'Lien invalide ou déjà utilisé' })
  if (new Date(tokenData.expires_at) < new Date()) throw createError({ statusCode: 410, message: 'Ce lien a expiré' })

  // Check slot still available
  const slotMs = new Date(body.datetime).getTime()
  const bookedRes = await $fetch<any>(
    `${config.directusUrl}/items/candidats?filter[date_entretien][_gte]=${new Date().toISOString()}&fields=date_entretien&limit=-1`,
    { headers: h }
  )
  const conflict = (bookedRes?.data || []).some((c: any) => {
    const bt = c.date_entretien ? new Date(c.date_entretien).getTime() : 0
    return Math.abs(bt - slotMs) < 60 * 60 * 1000
  })
  if (conflict) throw createError({ statusCode: 409, message: 'Ce créneau n\'est plus disponible' })

  // Update candidat
  const updateData: Record<string, any> = {
    date_entretien: body.datetime,
    canal_entretien: body.canal === 'visio' ? 'visio' : body.canal === 'physique' ? 'presentiel' : 'telephone',
    statut: 'entretien_prevu'
  }
  if (body.canal === 'visio' && body.discord_id) updateData.discord_id = body.discord_id
  if (body.canal === 'telephone' && body.telephone) updateData.telephone = body.telephone

  await $fetch<any>(
    `${config.directusUrl}/items/candidats/${tokenData.candidat}`,
    { method: 'PATCH', headers: h, body: updateData }
  )

  // Invalidate token
  await $fetch<any>(
    `${config.directusUrl}/items/candidat_booking_tokens/${tokenData.id}`,
    { method: 'PATCH', headers: h, body: { utilise: true } }
  )

  return { success: true }
})
