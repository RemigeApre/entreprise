/**
 * Gestion hierarchique des lieux : un lieu peut etre rattache a un lieu principal
 * (relation auto-referencee `parent`). Ex : Boutique (principal) -> Reserve, Cave (locaux).
 * Le stock reste suivi par lieu, donc differencie par local. Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/lieux_stockage', {
    field: 'parent',
    type: 'integer',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      sort: 4,
      note: 'Lieu principal auquel ce local est rattache (vide = lieu principal)'
    },
    schema: { is_nullable: true }
  }, 'Field lieux_stockage.parent')

  await safeApi('POST', '/relations', {
    collection: 'lieux_stockage',
    field: 'parent',
    related_collection: 'lieux_stockage'
  }, 'Relation lieux_stockage.parent -> lieux_stockage')
}
