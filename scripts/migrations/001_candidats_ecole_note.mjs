/**
 * Ajoute les champs ecole et note_evaluation a la collection candidats.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/candidats', {
    field: 'ecole',
    type: 'string',
    schema: { is_nullable: true },
    meta: { interface: 'input', sort: 8, note: 'Ecole / Universite du candidat' }
  }, 'Champ candidats.ecole')

  await safeApi('POST', '/fields/candidats', {
    field: 'note_evaluation',
    type: 'integer',
    schema: { is_nullable: true },
    meta: { interface: 'input', sort: 9, width: 'half', note: 'Note de 1 a 10' }
  }, 'Champ candidats.note_evaluation')
}
