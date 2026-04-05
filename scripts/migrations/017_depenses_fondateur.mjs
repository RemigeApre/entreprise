/**
 * Collection depenses_fondateur : ce que le fondateur paye de son compte perso.
 * Purement informatif, n'impacte pas le solde entreprise.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/collections', {
    collection: 'depenses_fondateur',
    meta: { icon: 'heart_broken', note: 'Depenses personnelles du fondateur pour l\'entreprise', sort: 56 },
    schema: {}
  }, 'Collection depenses_fondateur')

  await safeApi('POST', '/fields/depenses_fondateur', {
    field: 'libelle',
    type: 'string',
    meta: { interface: 'input', sort: 1, required: true },
    schema: { is_nullable: false }
  }, 'Field libelle')

  await safeApi('POST', '/fields/depenses_fondateur', {
    field: 'montant',
    type: 'float',
    meta: { interface: 'input', sort: 2, required: true },
    schema: { is_nullable: false }
  }, 'Field montant')

  await safeApi('POST', '/fields/depenses_fondateur', {
    field: 'recurrent',
    type: 'boolean',
    meta: { interface: 'boolean', sort: 3 },
    schema: { is_nullable: false, default_value: false }
  }, 'Field recurrent')

  await safeApi('POST', '/fields/depenses_fondateur', {
    field: 'frequence',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      sort: 4,
      options: {
        choices: [
          { text: 'Mensuel', value: 'mensuel' },
          { text: 'Trimestriel', value: 'trimestriel' },
          { text: 'Annuel', value: 'annuel' }
        ]
      }
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Field frequence')

  await safeApi('POST', '/fields/depenses_fondateur', {
    field: 'notes',
    type: 'text',
    meta: { interface: 'input-multiline', sort: 5 },
    schema: { is_nullable: true, default_value: null }
  }, 'Field notes')
}
