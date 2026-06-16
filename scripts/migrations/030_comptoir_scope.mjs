/**
 * Securite : le Comptoir n'utilise plus le token ADMIN cote client.
 * On cree un role/policy "Comptoir" limite AUX SEULES collections du comptoir,
 * et un utilisateur dedie avec un TOKEN STATIQUE (= process.env.COMPTOIR_TOKEN)
 * que la route /_comptoir/auth renvoie au navigateur apres verification du PIN.
 * On reinitialise aussi le PIN comptoir a "000000".
 *
 * Necessite COMPTOIR_TOKEN dans l'environnement du conteneur directus.
 * Idempotent.
 */
export default async function ({ api, safeApi }) {
  const TOKEN = process.env.COMPTOIR_TOKEN

  // 1. Role + policy "Comptoir"
  let role = (await api('GET', '/roles?filter[name][_eq]=Comptoir&limit=1'))?.[0]
  if (!role) role = await safeApi('POST', '/roles', { name: 'Comptoir', icon: 'point_of_sale', description: 'Acces limite au Comptoir (caisse)' }, 'Role "Comptoir"')

  let policy = (await api('GET', '/policies?filter[name][_eq]=Comptoir&limit=1'))?.[0]
  if (!policy) policy = await safeApi('POST', '/policies', { name: 'Comptoir', icon: 'point_of_sale', description: 'Permissions limitees au comptoir', admin_access: false, app_access: false }, 'Policy "Comptoir"')

  if (role && policy) {
    const acc = await api('GET', `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&limit=1`)
    if (!acc?.length) await safeApi('POST', '/access', { role: role.id, policy: policy.id }, 'Access Comptoir role -> policy')
  }

  // 2. Permissions : CRUD complet, UNIQUEMENT sur les collections du comptoir
  const collections = [
    'produits', 'produit_editions', 'lieux_stockage', 'stocks_lieux',
    'vendeurs', 'ventes', 'vente_lignes', 'mouvements_stock', 'comptoir_settings'
  ]
  if (policy) {
    const existingPerms = (await api('GET', `/permissions?filter[policy][_eq]=${policy.id}&fields=collection,action&limit=-1`)) || []
    const have = new Set(existingPerms.map(p => `${p.collection}|${p.action}`))
    for (const collection of collections) {
      for (const action of ['create', 'read', 'update', 'delete']) {
        if (have.has(`${collection}|${action}`)) continue
        await safeApi('POST', '/permissions', { policy: policy.id, collection, action, fields: ['*'], permissions: {} }, `Perm ${action} ${collection}`)
      }
    }
  }

  // 3. Utilisateur "Comptoir" avec token statique
  if (TOKEN && role) {
    const existing = await api('GET', '/users?filter[email][_eq]=comptoir@legeai-editions.com&limit=1')
    if (existing?.length) {
      await safeApi('PATCH', `/users/${existing[0].id}`, { role: role.id, token: TOKEN, status: 'active' }, 'Utilisateur comptoir (maj)')
    } else {
      await safeApi('POST', '/users', { email: 'comptoir@legeai-editions.com', password: TOKEN, token: TOKEN, status: 'active', role: role.id, first_name: 'Comptoir' }, 'Utilisateur comptoir')
    }
  } else {
    console.log('  ⚠ COMPTOIR_TOKEN absent de l\'environnement : utilisateur comptoir non configure (le comptoir ne pourra pas se connecter).')
  }

  // 4. Reset du PIN comptoir a 000000
  try {
    await api('PATCH', '/items/comptoir_settings', { pin_code: '000000' })
    console.log('  ✓ PIN comptoir reinitialise a 000000')
  } catch {
    try {
      const s = await api('GET', '/items/comptoir_settings?limit=1')
      const row = Array.isArray(s) ? s[0] : s
      if (row?.id) await api('PATCH', `/items/comptoir_settings/${row.id}`, { pin_code: '000000' })
    } catch { /* ignore */ }
  }
}
