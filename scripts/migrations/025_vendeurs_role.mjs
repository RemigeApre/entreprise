/**
 * Droits du Comptoir : chaque vendeur a un role. Seul un "directeur" peut gerer
 * les lieux et les vendeurs. Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/vendeurs', {
    field: 'role',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 3,
      note: 'Droits : seul un directeur gere lieux et vendeurs',
      options: {
        choices: [
          { text: 'Directeur', value: 'directeur' },
          { text: 'Employe', value: 'employe' },
          { text: 'Stagiaire', value: 'stagiaire' },
          { text: 'Autre', value: 'autre' }
        ]
      }
    },
    schema: { is_nullable: false, default_value: 'employe' }
  }, 'Field vendeurs.role')
}
