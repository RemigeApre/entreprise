/**
 * Ajoute un statut aux lieux (lieux_stockage) pour la sous-page "Lieux" du Comptoir :
 * lieu de stockage, lieu de vente, ou futur lieu. Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/lieux_stockage', {
    field: 'statut',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 3,
      note: 'Type de lieu',
      options: {
        choices: [
          { text: 'Lieu de stockage', value: 'stockage' },
          { text: 'Lieu de vente', value: 'vente' },
          { text: 'Futur lieu', value: 'futur' }
        ]
      }
    },
    schema: { is_nullable: false, default_value: 'stockage' }
  }, 'Field lieux_stockage.statut')
}
