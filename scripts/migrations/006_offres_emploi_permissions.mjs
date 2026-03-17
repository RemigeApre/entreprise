/**
 * Ajoute les permissions CRUD sur offres_emploi et offres_emploi_categories
 * pour les roles Directeur et Administrator.
 *
 * En Directus, les collections créées manuellement n'ont pas de permissions
 * par défaut pour les rôles non-admin.
 */
export default async function ({ api, safeApi }) {
  // Recuperer tous les roles
  const roles = await api('GET', '/roles?fields=id,name&limit=-1')
  if (!roles) {
    console.log('  ⚠ Impossible de lire les roles')
    return
  }

  const targetRoles = roles.filter(r =>
    r.name === 'Directeur' || r.name === 'Administrator'
  )

  if (!targetRoles.length) {
    console.log('  ⚠ Aucun role Directeur ou Administrator trouve')
    return
  }

  const collections = ['offres_emploi', 'offres_emploi_categories']
  const actions = ['create', 'read', 'update', 'delete']

  for (const role of targetRoles) {
    for (const collection of collections) {
      for (const action of actions) {
        await safeApi('POST', '/permissions', {
          role: role.id,
          collection,
          action,
          fields: ['*'],
          permissions: {},
          validation: {}
        }, `Permission ${role.name} → ${collection} → ${action}`)
      }
    }
  }
}
