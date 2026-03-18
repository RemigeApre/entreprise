/**
 * Ajoute le champ retour_attendu_de a la collection candidats.
 * Indique qui doit agir en suite : 'nous' (on doit les rappeler) ou 'candidat' (on attend leur retour).
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/candidats', {
    field: 'retour_attendu_de',
    type: 'string',
    schema: { is_nullable: true, default_value: null },
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 9,
      width: 'half',
      options: {
        choices: [
          { text: 'Nous (on doit les rappeler)', value: 'nous' },
          { text: 'Candidat (on attend leur retour)', value: 'candidat' }
        ]
      },
      note: 'Qui doit agir en prochain : nous ou le candidat'
    }
  }, 'Champ candidats.retour_attendu_de')
}
