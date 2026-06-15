/**
 * Profils "vendeur" du Comptoir : on choisit un vendeur a la connexion, et la
 * vente lui est rattachee. Collection `vendeurs` + champ `ventes.vendeur`.
 * Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/collections', {
    collection: 'vendeurs',
    meta: { icon: 'badge', note: 'Profils vendeurs du Comptoir', sort: 74 },
    schema: {}
  }, 'Collection vendeurs')

  await safeApi('POST', '/fields/vendeurs', {
    field: 'nom', type: 'string',
    meta: { interface: 'input', required: true, sort: 1 },
    schema: { is_nullable: false }
  }, 'Field vendeurs.nom')

  await safeApi('POST', '/fields/vendeurs', {
    field: 'actif', type: 'boolean',
    meta: { interface: 'boolean', display: 'boolean', sort: 2 },
    schema: { is_nullable: false, default_value: true }
  }, 'Field vendeurs.actif')

  // Rattachement de la vente au vendeur
  await safeApi('POST', '/fields/ventes', {
    field: 'vendeur', type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], sort: 10 },
    schema: { is_nullable: true }
  }, 'Field ventes.vendeur')

  await safeApi('POST', '/relations', {
    collection: 'ventes', field: 'vendeur', related_collection: 'vendeurs'
  }, 'Relation ventes.vendeur -> vendeurs')
}
