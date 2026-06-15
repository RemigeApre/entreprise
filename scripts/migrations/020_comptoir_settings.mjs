/**
 * Renomme le module "commerce" en "Comptoir".
 * Seule la collection `commerce_settings` portait le nom : on la recree en
 * `comptoir_settings`, on reprend le PIN + le lieu par defaut, puis on supprime
 * l'ancienne collection. Les autres collections (ventes, vente_lignes,
 * mouvements_stock, lieux_stockage, produits...) ont des noms neutres, inchanges.
 *
 * Idempotent : relançable sans danger.
 */
export default async function ({ api, safeApi }) {
  // 1. Recuperer les valeurs de l'ancienne collection si elle existe
  let pin = '316191'
  let lieu = null
  try {
    const old = await api('GET', '/items/commerce_settings?limit=1')
    const row = Array.isArray(old) ? old[0] : old
    if (row?.pin_code) pin = row.pin_code
    if (row?.lieu_defaut) lieu = row.lieu_defaut
    console.log(`  ℹ PIN repris depuis commerce_settings`)
  } catch {
    console.log('  ℹ Pas de commerce_settings existante, valeurs par defaut')
  }

  // 2. Creer comptoir_settings (singleton)
  await safeApi('POST', '/collections', {
    collection: 'comptoir_settings',
    meta: { icon: 'store', note: 'Parametres du Comptoir (caisse mobile)', sort: 70, singleton: true },
    schema: {}
  }, 'Collection comptoir_settings')

  await safeApi('POST', '/fields/comptoir_settings', {
    field: 'pin_code', type: 'string',
    meta: { interface: 'input', sort: 1, required: true, note: 'Code PIN 6 chiffres' },
    schema: { is_nullable: false, default_value: '316191' }
  }, 'Field comptoir_settings.pin_code')

  await safeApi('POST', '/fields/comptoir_settings', {
    field: 'lieu_defaut', type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 2 },
    schema: { is_nullable: true, default_value: null }
  }, 'Field comptoir_settings.lieu_defaut')

  await safeApi('POST', '/relations', {
    collection: 'comptoir_settings', field: 'lieu_defaut', related_collection: 'lieux_stockage'
  }, 'Relation comptoir_settings.lieu_defaut -> lieux_stockage')

  // 3. Seed avec le PIN repris (singleton : un seul item)
  await safeApi('POST', '/items/comptoir_settings', {
    pin_code: pin,
    ...(lieu ? { lieu_defaut: lieu } : {})
  }, 'Seed comptoir_settings')

  // 4. Supprimer l'ancienne collection commerce_settings
  try {
    await api('DELETE', '/collections/commerce_settings')
    console.log('  ✓ Ancienne collection commerce_settings supprimee')
  } catch {
    console.log('  ⊘ commerce_settings deja absente')
  }
}
