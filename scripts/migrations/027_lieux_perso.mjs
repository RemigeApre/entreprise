/**
 * Personnalisation des lieux : icone + couleur (par defaut herites du statut). Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/lieux_stockage', {
    field: 'icone', type: 'string',
    meta: { interface: 'input', sort: 5, note: 'Nom d\'icone (ex: i-lucide-store)' },
    schema: { is_nullable: true }
  }, 'Field lieux_stockage.icone')

  await safeApi('POST', '/fields/lieux_stockage', {
    field: 'couleur', type: 'string',
    meta: { interface: 'select-color', sort: 6, note: 'Couleur du lieu' },
    schema: { is_nullable: true }
  }, 'Field lieux_stockage.couleur')
}
