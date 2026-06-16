#!/usr/bin/env node
/**
 * Configure (ou repare) le compte "Comptoir" a permissions limitees + son token statique.
 * Idempotent : relançable autant de fois que necessaire.
 *
 * Variables d'environnement :
 *   DIRECTUS_URL      (defaut http://localhost:8055)
 *   ADMIN_EMAIL / ADMIN_PASSWORD   (admin Directus, pour creer role/policy/user)
 *   COMPTOIR_TOKEN    token statique a affecter au compte comptoir (obligatoire)
 *   COMPTOIR_RESET_PIN=1  (optionnel) reinitialise le PIN comptoir a 000000
 *
 * Lancement (VPS) :
 *   docker compose -f docker-compose.yml exec -e DIRECTUS_URL=http://localhost:8055 \
 *     directus node /scripts/setup-comptoir.mjs
 */
const BASE_URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '')
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@legeai-editions.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const TOKEN = process.env.COMPTOIR_TOKEN || ''

let auth = ''

async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) } }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 200)}`)
  try { return JSON.parse(text).data } catch { return null }
}
async function safeApi(method, path, body, label) {
  try { const r = await api(method, path, body); console.log(`  ✓ ${label}`); return r }
  catch (e) {
    if (/already exists|unique|DUPLICAT/i.test(e.message)) { console.log(`  ⊘ ${label} (existe deja)`); return null }
    console.log(`  ✗ ${label}: ${e.message.slice(0, 160)}`); return null
  }
}

async function run() {
  console.log('🔐 Configuration du compte Comptoir\n')
  if (!TOKEN) { console.error('✗ COMPTOIR_TOKEN manquant dans l\'environnement. Abandon.'); process.exit(1) }

  const a = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  auth = a.access_token
  console.log('✓ Authentifie (admin)\n')

  // Role + policy
  let role = (await api('GET', '/roles?filter[name][_eq]=Comptoir&limit=1'))?.[0]
  if (!role) role = await safeApi('POST', '/roles', { name: 'Comptoir', icon: 'point_of_sale', description: 'Acces limite au Comptoir (caisse)' }, 'Role "Comptoir"')
  let policy = (await api('GET', '/policies?filter[name][_eq]=Comptoir&limit=1'))?.[0]
  if (!policy) policy = await safeApi('POST', '/policies', { name: 'Comptoir', icon: 'point_of_sale', description: 'Permissions limitees au comptoir', admin_access: false, app_access: false }, 'Policy "Comptoir"')

  if (role && policy) {
    const acc = await api('GET', `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&limit=1`)
    if (!acc?.length) await safeApi('POST', '/access', { role: role.id, policy: policy.id }, 'Access role -> policy')
  }

  // Permissions : CRUD complet, uniquement sur les collections du comptoir
  const collections = ['produits', 'produit_editions', 'lieux_stockage', 'stocks_lieux', 'vendeurs', 'ventes', 'vente_lignes', 'mouvements_stock', 'comptoir_settings']
  if (policy) {
    const existing = (await api('GET', `/permissions?filter[policy][_eq]=${policy.id}&fields=collection,action&limit=-1`)) || []
    const have = new Set(existing.map(p => `${p.collection}|${p.action}`))
    for (const collection of collections) {
      for (const action of ['create', 'read', 'update', 'delete']) {
        if (have.has(`${collection}|${action}`)) continue
        await safeApi('POST', '/permissions', { policy: policy.id, collection, action, fields: ['*'], permissions: {} }, `Perm ${action} ${collection}`)
      }
    }
  }

  // Utilisateur comptoir avec token statique (cree ou mis a jour)
  if (role) {
    const existing = await api('GET', '/users?filter[email][_eq]=comptoir@legeai.local&limit=1')
    if (existing?.length) {
      await safeApi('PATCH', `/users/${existing[0].id}`, { role: role.id, token: TOKEN, status: 'active' }, 'Utilisateur comptoir (token mis a jour)')
    } else {
      await safeApi('POST', '/users', { email: 'comptoir@legeai.local', password: TOKEN, token: TOKEN, status: 'active', role: role.id, first_name: 'Comptoir' }, 'Utilisateur comptoir cree')
    }
  }

  // PIN : reset optionnel a 000000
  if (process.env.COMPTOIR_RESET_PIN === '1') {
    try { await api('PATCH', '/items/comptoir_settings', { pin_code: '000000' }); console.log('  ✓ PIN comptoir = 000000') }
    catch {
      try { const s = await api('GET', '/items/comptoir_settings?limit=1'); const row = Array.isArray(s) ? s[0] : s; if (row?.id) await api('PATCH', `/items/comptoir_settings/${row.id}`, { pin_code: '000000' }) } catch { /* ignore */ }
    }
  }

  console.log('\n✓ Compte Comptoir pret.')
}

run().catch(e => { console.error('Erreur fatale:', e.message); process.exit(1) })
