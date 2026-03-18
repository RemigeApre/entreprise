/**
 * Ajoute les champs d'entretien à la collection candidats :
 * - date_entretien : datetime
 * - canal_entretien : string (presentiel/visio/telephone/autre)
 * - second_entretien : boolean
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/candidats', {
    field: 'date_entretien',
    type: 'dateTime',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      display: 'datetime',
      sort: 10,
      width: 'half',
      note: 'Date et heure de l\'entretien'
    }
  }, 'Champ candidats.date_entretien')

  await safeApi('POST', '/fields/candidats', {
    field: 'canal_entretien',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 11,
      width: 'half',
      options: {
        choices: [
          { text: 'Présentiel', value: 'presentiel' },
          { text: 'Visio', value: 'visio' },
          { text: 'Téléphone', value: 'telephone' },
          { text: 'Autre', value: 'autre' }
        ]
      },
      note: 'Canal de l\'entretien'
    }
  }, 'Champ candidats.canal_entretien')

  await safeApi('POST', '/fields/candidats', {
    field: 'second_entretien',
    type: 'boolean',
    schema: { is_nullable: true, default_value: false },
    meta: {
      interface: 'boolean',
      display: 'boolean',
      sort: 12,
      width: 'half',
      note: 'Un second entretien est prévu'
    }
  }, 'Champ candidats.second_entretien')
}
