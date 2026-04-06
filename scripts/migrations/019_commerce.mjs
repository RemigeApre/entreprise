/**
 * Collections pour le mode Commerce (vente sur marches/brocantes).
 * - commerce_settings : PIN, lieu par defaut
 * - ventes : en-tete de vente
 * - vente_lignes : lignes de vente
 * - mouvements_stock : transferts, pertes, cadeaux
 */
export default async function ({ safeApi }) {
  // === commerce_settings ===
  await safeApi('POST', '/collections', {
    collection: 'commerce_settings',
    meta: { icon: 'store', note: 'Parametres du mode commerce', sort: 70, singleton: true },
    schema: {}
  }, 'Collection commerce_settings')

  await safeApi('POST', '/fields/commerce_settings', {
    field: 'pin_code', type: 'string',
    meta: { interface: 'input', sort: 1, required: true, note: 'Code PIN 6 chiffres' },
    schema: { is_nullable: false, default_value: '316191' }
  }, 'Field pin_code')

  await safeApi('POST', '/fields/commerce_settings', {
    field: 'lieu_defaut', type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 2 },
    schema: { is_nullable: true, default_value: null }
  }, 'Field lieu_defaut')

  // Seed default settings
  await safeApi('POST', '/items/commerce_settings', {
    pin_code: '316191'
  }, 'Seed commerce_settings')

  // === ventes ===
  await safeApi('POST', '/collections', {
    collection: 'ventes',
    meta: { icon: 'receipt_long', sort: 71 },
    schema: {}
  }, 'Collection ventes')

  for (const f of [
    { field: 'date', type: 'timestamp', meta: { interface: 'datetime', sort: 1, required: true }, schema: { is_nullable: false } },
    { field: 'client_label', type: 'string', meta: { interface: 'input', sort: 2 }, schema: { is_nullable: true } },
    { field: 'lieu', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 3 }, schema: { is_nullable: true } },
    { field: 'total', type: 'float', meta: { interface: 'input', sort: 4 }, schema: { is_nullable: false, default_value: 0 } },
    { field: 'remise_globale_pourcent', type: 'float', meta: { interface: 'input', sort: 5 }, schema: { is_nullable: true } },
    { field: 'notes', type: 'text', meta: { interface: 'input-multiline', sort: 6 }, schema: { is_nullable: true } }
  ]) {
    await safeApi('POST', '/fields/ventes', f, `Field ventes.${f.field}`)
  }

  await safeApi('POST', '/relations', { collection: 'ventes', field: 'lieu', related_collection: 'lieux_stockage' }, 'Relation ventes.lieu')

  // === vente_lignes ===
  await safeApi('POST', '/collections', {
    collection: 'vente_lignes',
    meta: { icon: 'list', sort: 72 },
    schema: {}
  }, 'Collection vente_lignes')

  for (const f of [
    { field: 'vente', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 1 }, schema: { is_nullable: false } },
    { field: 'produit', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 2 }, schema: { is_nullable: false } },
    { field: 'edition', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 3 }, schema: { is_nullable: true } },
    { field: 'quantite', type: 'integer', meta: { interface: 'input', sort: 4 }, schema: { is_nullable: false, default_value: 1 } },
    { field: 'prix_unitaire', type: 'float', meta: { interface: 'input', sort: 5 }, schema: { is_nullable: false } },
    { field: 'remise_pourcent', type: 'float', meta: { interface: 'input', sort: 6 }, schema: { is_nullable: true } },
    { field: 'remise_montant', type: 'float', meta: { interface: 'input', sort: 7 }, schema: { is_nullable: true } }
  ]) {
    await safeApi('POST', '/fields/vente_lignes', f, `Field vente_lignes.${f.field}`)
  }

  await safeApi('POST', '/relations', { collection: 'vente_lignes', field: 'vente', related_collection: 'ventes' }, 'Relation vente_lignes.vente')
  await safeApi('POST', '/relations', { collection: 'vente_lignes', field: 'produit', related_collection: 'produits' }, 'Relation vente_lignes.produit')
  await safeApi('POST', '/relations', { collection: 'vente_lignes', field: 'edition', related_collection: 'produit_editions' }, 'Relation vente_lignes.edition')

  // === mouvements_stock ===
  await safeApi('POST', '/collections', {
    collection: 'mouvements_stock',
    meta: { icon: 'swap_horiz', sort: 73 },
    schema: {}
  }, 'Collection mouvements_stock')

  for (const f of [
    { field: 'produit', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 1 }, schema: { is_nullable: false } },
    { field: 'edition', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 2 }, schema: { is_nullable: true } },
    { field: 'lieu_source', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 3 }, schema: { is_nullable: false } },
    { field: 'lieu_destination', type: 'integer', meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 4 }, schema: { is_nullable: true } },
    { field: 'quantite', type: 'integer', meta: { interface: 'input', sort: 5 }, schema: { is_nullable: false } },
    { field: 'type', type: 'string', meta: { interface: 'select-dropdown', sort: 6, options: { choices: [{ text: 'Transfert', value: 'transfert' }, { text: 'Perte', value: 'perte' }, { text: 'Cadeau', value: 'cadeau' }] } }, schema: { is_nullable: false } },
    { field: 'notes', type: 'text', meta: { interface: 'input-multiline', sort: 7 }, schema: { is_nullable: true } },
    { field: 'date', type: 'timestamp', meta: { interface: 'datetime', sort: 8 }, schema: { is_nullable: false } }
  ]) {
    await safeApi('POST', '/fields/mouvements_stock', f, `Field mouvements_stock.${f.field}`)
  }

  await safeApi('POST', '/relations', { collection: 'mouvements_stock', field: 'produit', related_collection: 'produits' }, 'Relation mvt.produit')
  await safeApi('POST', '/relations', { collection: 'mouvements_stock', field: 'edition', related_collection: 'produit_editions' }, 'Relation mvt.edition')
  await safeApi('POST', '/relations', { collection: 'mouvements_stock', field: 'lieu_source', related_collection: 'lieux_stockage' }, 'Relation mvt.lieu_source')
  await safeApi('POST', '/relations', { collection: 'mouvements_stock', field: 'lieu_destination', related_collection: 'lieux_stockage' }, 'Relation mvt.lieu_destination')
}
