/**
 * S'assure que la collection `lieux_stockage` possede un champ `adresse`,
 * utilise par la sous-page "Lieux" du Comptoir. Idempotent (saute si existant).
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/lieux_stockage', {
    field: 'adresse',
    type: 'text',
    meta: { interface: 'input-multiline', sort: 2, note: 'Adresse du lieu' },
    schema: { is_nullable: true }
  }, 'Field lieux_stockage.adresse')
}
