/**
 * Met a jour les choix de role des vendeurs : directeur, responsable, employe,
 * profil general. Idempotent (PATCH des options du champ existant).
 */
export default async function ({ safeApi }) {
  await safeApi('PATCH', '/fields/vendeurs/role', {
    meta: {
      options: {
        choices: [
          { text: 'Directeur', value: 'directeur' },
          { text: 'Responsable', value: 'responsable' },
          { text: 'Employe', value: 'employe' },
          { text: 'Profil general', value: 'general' }
        ]
      }
    }
  }, 'Maj choix vendeurs.role')
}
