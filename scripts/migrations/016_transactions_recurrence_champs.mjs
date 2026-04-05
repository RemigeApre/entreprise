/**
 * Ajoute les champs de recurrence avancee et transparence financiere
 * sur la collection transactions.
 */
export default async function ({ safeApi }) {
  // ── montant_reel : ce que paye le client avant commission plateforme ──
  await safeApi('POST', '/fields/transactions', {
    field: 'montant_reel',
    type: 'float',
    meta: { interface: 'input', sort: 3, note: 'Montant paye par le client (avant commission)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.montant_reel')

  // ── taux_taxe : taux d'imposition informatif ──
  await safeApi('POST', '/fields/transactions', {
    field: 'taux_taxe',
    type: 'float',
    meta: { interface: 'input', sort: 4, note: 'Taux de taxe en % (informatif)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.taux_taxe')

  // ── recurrence_certitude : stricte ou theorique ──
  await safeApi('POST', '/fields/transactions', {
    field: 'recurrence_certitude',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      sort: 10,
      note: 'Stricte = garanti, Theorique = incertain (50% dans previsions)',
      options: {
        choices: [
          { text: 'Stricte', value: 'stricte' },
          { text: 'Theorique', value: 'theorique' }
        ]
      }
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.recurrence_certitude')

  // ── recurrence_debut : date de debut de la recurrence ──
  await safeApi('POST', '/fields/transactions', {
    field: 'recurrence_debut',
    type: 'date',
    meta: { interface: 'datetime', sort: 11, note: 'Date de debut de la recurrence' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.recurrence_debut')

  // ── recurrence_fin : date de fin de la recurrence ──
  await safeApi('POST', '/fields/transactions', {
    field: 'recurrence_fin',
    type: 'date',
    meta: { interface: 'datetime', sort: 12, note: 'Date de fin de la recurrence' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.recurrence_fin')
}
