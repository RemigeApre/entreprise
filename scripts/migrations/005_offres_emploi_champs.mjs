/**
 * Ajoute les champs duree, missions, conditions a la collection offres_emploi
 */
export default async function ({ safeApi }) {

  // duree — durée du contrat (CDD, Stage, Alternance)
  await safeApi('POST', '/fields/offres_emploi', {
    field: 'duree',
    type: 'string',
    schema: { is_nullable: true },
    meta: {
      interface: 'input',
      sort: 3,
      width: 'half',
      note: 'Durée du contrat (ex: 6 mois, 1 an). Laisser vide pour CDI.'
    }
  }, 'Champ offres_emploi.duree')

  // missions — description des missions du poste
  await safeApi('POST', '/fields/offres_emploi', {
    field: 'missions',
    type: 'text',
    schema: { is_nullable: true },
    meta: {
      interface: 'input-multiline',
      sort: 6,
      width: 'full',
      note: 'Missions confiées au poste'
    }
  }, 'Champ offres_emploi.missions')

  // conditions — conditions particulières, prise de poste, modalités
  await safeApi('POST', '/fields/offres_emploi', {
    field: 'conditions',
    type: 'text',
    schema: { is_nullable: true },
    meta: {
      interface: 'input-multiline',
      sort: 11,
      width: 'full',
      note: 'Conditions particulières, prise de poste, modalités'
    }
  }, 'Champ offres_emploi.conditions')
}
