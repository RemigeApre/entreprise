/**
 * Ajoute les champs date_debut_stage et date_fin_stage a la collection candidats.
 * Utilisés pour les promesses de période (affichées dans le Gantt stagiaires).
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/candidats', {
    field: 'date_debut_stage',
    type: 'date',
    schema: { is_nullable: true, default_value: null },
    meta: {
      interface: 'datetime',
      display: 'datetime',
      sort: 15,
      width: 'half',
      note: 'Date de début du stage (promesse de période)'
    }
  }, 'Champ candidats.date_debut_stage')

  await safeApi('POST', '/fields/candidats', {
    field: 'date_fin_stage',
    type: 'date',
    schema: { is_nullable: true, default_value: null },
    meta: {
      interface: 'datetime',
      display: 'datetime',
      sort: 16,
      width: 'half',
      note: 'Date de fin du stage (promesse de période)'
    }
  }, 'Champ candidats.date_fin_stage')
}
