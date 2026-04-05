/**
 * Ajoute le champ projet (M2O vers projects) et la categorie financement_fondateur
 * a la collection transactions.
 */
export default async function ({ safeApi }) {
  // ── Champ projet (relation M2O vers projects) ──
  await safeApi('POST', '/fields/transactions', {
    field: 'projet',
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      display: 'related-values',
      display_options: { template: '{{nom}}' },
      sort: 8,
      note: 'Projet associe a cette transaction (optionnel)'
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.projet')

  await safeApi('POST', '/relations', {
    collection: 'transactions',
    field: 'projet',
    related_collection: 'projects'
  }, 'Relation transactions.projet -> projects')

  // ── Mise a jour du champ categorie pour inclure financement_fondateur ──
  await safeApi('PATCH', '/fields/transactions/categorie', {
    meta: {
      options: {
        choices: [
          { text: 'Vente', value: 'vente' },
          { text: 'Prestation', value: 'prestation' },
          { text: 'Abonnement', value: 'abonnement' },
          { text: 'Salaire', value: 'salaire' },
          { text: 'Freelance', value: 'freelance' },
          { text: 'Achat materiel', value: 'achat_materiel' },
          { text: 'Logiciel / SaaS', value: 'logiciel' },
          { text: 'Hebergement', value: 'hebergement' },
          { text: 'Marketing', value: 'marketing' },
          { text: 'Deplacement', value: 'deplacement' },
          { text: 'Administratif', value: 'administratif' },
          { text: 'Financement fondateur', value: 'financement_fondateur' },
          { text: 'Autre', value: 'autre' }
        ]
      }
    }
  }, 'Ajout choix financement_fondateur dans transactions.categorie')
}
