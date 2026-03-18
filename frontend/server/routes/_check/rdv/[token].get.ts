export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token') as string
  if (!token) throw createError({ statusCode: 400, message: 'Token manquant' })

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

  // Validate booking token
  const tokenRes = await $fetch<any>(
    `${config.directusUrl}/items/candidat_booking_tokens?filter[token][_eq]=${encodeURIComponent(token)}&filter[utilise][_eq]=false&fields=id,expires_at,candidat.prenom,candidat.telephone&limit=1`,
    { headers: h }
  ).catch(() => null)

  const tokenData = tokenRes?.data?.[0]
  if (!tokenData) throw createError({ statusCode: 404, message: 'Lien invalide ou déjà utilisé' })
  if (new Date(tokenData.expires_at) < new Date()) throw createError({ statusCode: 410, message: 'Ce lien a expiré' })

  // Get disponibilites
  const dispRes = await $fetch<any>(
    `${config.directusUrl}/items/recruteur_disponibilites?filter[actif][_eq]=true&limit=-1`,
    { headers: h }
  )
  const disponibilites: any[] = dispRes?.data || []

  // Get existing bookings (future)
  const bookedRes = await $fetch<any>(
    `${config.directusUrl}/items/candidats?filter[date_entretien][_gte]=${new Date().toISOString()}&fields=date_entretien&limit=-1`,
    { headers: h }
  )
  const bookedMs: number[] = (bookedRes?.data || [])
    .map((c: any) => c.date_entretien ? new Date(c.date_entretien).getTime() : null)
    .filter(Boolean)

  const slots = generateSlots(disponibilites, bookedMs, 28)
  const physDispo = disponibilites.find((d: any) => Array.isArray(d.canaux) && d.canaux.includes('physique') && d.note)

  return {
    candidat: {
      prenom: tokenData.candidat?.prenom || '',
      telephone: tokenData.candidat?.telephone || ''
    },
    slots,
    adressePhysique: physDispo?.note || null
  }
})

function generateSlots(
  disponibilites: any[],
  bookedMs: number[],
  daysAhead: number
): Array<{ date: string; slots: Array<{ time: string; canaux: string[] }> }> {
  const DURATION_MS = 60 * 60 * 1000 // 60 min
  const INTERVAL = 30 // minutes
  const now = new Date()
  const minMs = now.getTime() + 2 * 60 * 60 * 1000 // 2h buffer

  const result: Array<{ date: string; slots: Array<{ time: string; canaux: string[] }> }> = []

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() + d)
    date.setHours(0, 0, 0, 0)

    const dow = date.getDay() // 0=Sun..6=Sat
    if (dow === 0 || dow === 6) continue

    const dispos = disponibilites.filter((dispo: any) => dispo.jour_semaine === dow)
    if (!dispos.length) continue

    const slotMap = new Map<string, Set<string>>()

    for (const dispo of dispos) {
      const [sh, sm] = (dispo.heure_debut || '09:00').split(':').map(Number)
      const [eh, em] = (dispo.heure_fin || '18:00').split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      const canaux: string[] = Array.isArray(dispo.canaux) ? dispo.canaux : []

      for (let min = startMin; min + 60 <= endMin; min += INTERVAL) {
        const h = Math.floor(min / 60)
        const m = min % 60
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        const slotDate = new Date(date)
        slotDate.setHours(h, m, 0, 0)
        const slotMs = slotDate.getTime()

        if (slotMs < minMs) continue

        const hasConflict = bookedMs.some(bt => Math.abs(bt - slotMs) < DURATION_MS)
        if (hasConflict) continue

        if (!slotMap.has(timeStr)) slotMap.set(timeStr, new Set())
        for (const canal of canaux) slotMap.get(timeStr)!.add(canal)
      }
    }

    if (!slotMap.size) continue

    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      slots: Array.from(slotMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, canauxSet]) => ({ time, canaux: Array.from(canauxSet) }))
    })
  }

  return result
}
