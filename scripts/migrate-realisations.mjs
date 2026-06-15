#!/usr/bin/env node
/**
 * Migration des realisations depuis l'ancien Directus du portfolio (Le Geai
 * Informatique) vers le Directus de l'intranet entreprise.
 *
 * Pour chaque realisation source :
 *   - telecharge la cover depuis la source,
 *   - la re-uploade dans le dossier "realisations" du Directus destination,
 *   - cree l'item realisations (mapping FR), en sautant les doublons (par titre).
 *
 * Idempotent : relançable sans creer de doublons.
 *
 * Variables d'environnement :
 *   SRC_DIRECTUS_URL      URL de l'ancien Directus (ex: https://admin.legeai-informatique.fr)
 *   SRC_ADMIN_EMAIL       email admin source
 *   SRC_ADMIN_PASSWORD    mot de passe admin source
 *   SRC_TOKEN             (alternative au couple email/password) token statique source
 *   DIRECTUS_URL          Directus destination (defaut http://localhost:8055)
 *   ADMIN_EMAIL           email admin destination
 *   ADMIN_PASSWORD        mot de passe admin destination
 *
 * Lancement (depuis le VPS) :
 *   docker compose -f docker-compose.yml exec \
 *     -e DIRECTUS_URL=http://localhost:8055 \
 *     -e SRC_DIRECTUS_URL=https://admin.legeai-informatique.fr \
 *     -e SRC_ADMIN_EMAIL=... -e SRC_ADMIN_PASSWORD=... \
 *     directus node /scripts/migrate-realisations.mjs
 */

const SRC_URL = (process.env.SRC_DIRECTUS_URL || '').replace(/\/$/, '')
const SRC_EMAIL = process.env.SRC_ADMIN_EMAIL || ''
const SRC_PASSWORD = process.env.SRC_ADMIN_PASSWORD || ''
const SRC_TOKEN_STATIC = process.env.SRC_TOKEN || ''

const DEST_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '')
const DEST_EMAIL = process.env.ADMIN_EMAIL || ''
const DEST_PASSWORD = process.env.ADMIN_PASSWORD || ''

if (!SRC_URL || (!SRC_TOKEN_STATIC && (!SRC_EMAIL || !SRC_PASSWORD))) {
  console.error('✗ Source manquante : definir SRC_DIRECTUS_URL + (SRC_TOKEN ou SRC_ADMIN_EMAIL/SRC_ADMIN_PASSWORD)')
  process.exit(1)
}
if (!DEST_EMAIL || !DEST_PASSWORD) {
  console.error('✗ Destination manquante : definir ADMIN_EMAIL / ADMIN_PASSWORD')
  process.exit(1)
}

async function login(base, email, password) {
  const r = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!r.ok) throw new Error(`login ${base} -> ${r.status}: ${(await r.text()).slice(0, 150)}`)
  return (await r.json()).data.access_token
}

async function api(base, token, path) {
  const r = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}: ${(await r.text()).slice(0, 150)}`)
  return (await r.json()).data
}

const STATUT_MAP = { published: 'publie', publie: 'publie', draft: 'brouillon', brouillon: 'brouillon', archived: 'archive', archive: 'archive' }

async function run() {
  console.log('🔄 Migration des realisations\n')

  const srcToken = SRC_TOKEN_STATIC || await login(SRC_URL, SRC_EMAIL, SRC_PASSWORD)
  console.log(`✓ Source connectee : ${SRC_URL}`)
  const destToken = await login(DEST_URL, DEST_EMAIL, DEST_PASSWORD)
  console.log(`✓ Destination connectee : ${DEST_URL}\n`)

  // Dossier "realisations" cote destination (cree par setup-directus.mjs)
  const folders = await api(DEST_URL, destToken, '/folders?filter[name][_eq]=realisations&limit=1')
  const folderId = folders?.[0]?.id
  if (!folderId) {
    console.error('✗ Dossier "realisations" introuvable cote destination. Lance d\'abord setup-directus.mjs.')
    process.exit(1)
  }

  // Items deja presents (anti-doublon par titre)
  const existing = await api(DEST_URL, destToken, '/items/realisations?fields=titre&limit=-1')
  const existingTitres = new Set((existing || []).map(r => (r.titre || '').trim().toLowerCase()))

  // Source : toutes les realisations
  const source = await api(SRC_URL, srcToken, '/items/realisations?limit=-1')
  console.log(`${(source || []).length} realisation(s) source trouvee(s).\n`)

  let created = 0, skipped = 0, failed = 0

  for (const r of source || []) {
    const titre = (r.title || r.titre || '').trim()
    if (!titre) { console.log('  ⊘ item sans titre, ignore'); skipped++; continue }
    if (existingTitres.has(titre.toLowerCase())) { console.log(`  ⊘ "${titre}" (existe deja)`); skipped++; continue }

    try {
      let coverId = null
      const srcCover = r.cover
      if (srcCover) {
        // Telecharge la cover source
        const fileRes = await fetch(`${SRC_URL}/assets/${srcCover}`, { headers: { Authorization: `Bearer ${srcToken}` } })
        if (fileRes.ok) {
          const buf = Buffer.from(await fileRes.arrayBuffer())
          const ct = fileRes.headers.get('content-type') || 'application/octet-stream'
          const ext = ct.split('/')[1]?.split(';')[0] || 'bin'
          // Re-upload dans le dossier realisations (le champ "folder" doit preceder "file")
          const fd = new FormData()
          fd.append('folder', folderId)
          fd.append('title', titre)
          fd.append('file', new Blob([buf], { type: ct }), `${(r.slug || titre).toString().slice(0, 60).replace(/[^a-z0-9]+/gi, '-')}.${ext}`)
          const up = await fetch(`${DEST_URL}/files`, { method: 'POST', headers: { Authorization: `Bearer ${destToken}` }, body: fd })
          if (up.ok) coverId = (await up.json()).data.id
          else console.log(`    ⚠ upload cover echoue pour "${titre}": ${up.status}`)
        } else {
          console.log(`    ⚠ telechargement cover echoue pour "${titre}": ${fileRes.status}`)
        }
      }

      const item = {
        titre,
        client: r.client ?? null,
        lien: r.url ?? r.lien ?? null,
        description: r.description ?? null,
        tags: Array.isArray(r.tags) ? r.tags : null,
        ordre: r.sort ?? r.ordre ?? 0,
        statut: STATUT_MAP[r.status ?? r.statut] || 'brouillon',
        ...(coverId ? { cover: coverId } : {}),
      }

      const post = await fetch(`${DEST_URL}/items/realisations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${destToken}` },
        body: JSON.stringify(item),
      })
      if (!post.ok) throw new Error(`POST item -> ${post.status}: ${(await post.text()).slice(0, 150)}`)
      console.log(`  ✓ "${titre}"${coverId ? ' (avec cover)' : ''}`)
      created++
    } catch (e) {
      console.log(`  ✗ "${titre}": ${e.message}`)
      failed++
    }
  }

  console.log(`\n✓ Termine : ${created} creee(s), ${skipped} ignoree(s), ${failed} echec(s).`)
}

run().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1) })
