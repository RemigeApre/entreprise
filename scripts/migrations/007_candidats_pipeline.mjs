/**
 * Ajoute les champs date_contact et contact_origin a la collection candidats
 * pour le nouveau pipeline de recrutement.
 */
export default async function ({ safeApi }) {

  // date_contact — date du premier contact avec le candidat
  await safeApi('POST', '/fields/candidats', {
    field: 'date_contact',
    type: 'date',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      display: 'datetime',
      sort: 7,
      width: 'half',
      note: 'Date du premier contact avec le candidat'
    }
  }, 'Champ candidats.date_contact')

  // contact_origin — qui a initié le contact (sortant = nous, entrant = le candidat)
  await safeApi('POST', '/fields/candidats', {
    field: 'contact_origin',
    type: 'string',
    schema: {
      is_nullable: true,
      default_value: 'sortant'
    },
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 8,
      width: 'half',
      options: {
        choices: [
          { text: 'Sortant (je l\'ai contacte)', value: 'sortant' },
          { text: 'Entrant (il m\'a contacte)', value: 'entrant' }
        ]
      },
      note: 'Origine du contact : sortant = nous avons contacte, entrant = le candidat nous a contacte'
    }
  }, 'Champ candidats.contact_origin')
}
