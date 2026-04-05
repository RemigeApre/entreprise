/**
 * Cree la collection categories_finance et transforme le champ
 * transactions.categorie d'un string en relation M2O.
 * Seed les categories initiales.
 */
export default async function ({ safeApi, api }) {
  // ── Collection categories_finance ──
  await safeApi('POST', '/collections', {
    collection: 'categories_finance',
    meta: { icon: 'category', note: 'Categories de transactions financieres', sort: 55 },
    schema: {}
  }, 'Collection categories_finance')

  await safeApi('POST', '/fields/categories_finance', {
    field: 'label',
    type: 'string',
    meta: { interface: 'input', sort: 1, required: true },
    schema: { is_nullable: false }
  }, 'Champ categories_finance.label')

  await safeApi('POST', '/fields/categories_finance', {
    field: 'type',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      sort: 2,
      required: true,
      options: {
        choices: [
          { text: 'Recette', value: 'recette' },
          { text: 'Depense', value: 'depense' },
          { text: 'Fondateur', value: 'fondateur' }
        ]
      }
    },
    schema: { is_nullable: false }
  }, 'Champ categories_finance.type')

  await safeApi('POST', '/fields/categories_finance', {
    field: 'icone',
    type: 'string',
    meta: { interface: 'input', sort: 3, note: 'Nom icone Lucide (ex: i-lucide-book)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ categories_finance.icone')

  await safeApi('POST', '/fields/categories_finance', {
    field: 'sous_categorie',
    type: 'string',
    meta: { interface: 'input', sort: 4, note: 'Sous-categorie optionnelle (ex: Bergfrid)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ categories_finance.sous_categorie')

  // ── Transformer transactions.categorie en M2O ──
  // D'abord supprimer l'ancien champ string
  await safeApi('DELETE', '/fields/transactions/categorie', null, 'Suppression ancien champ transactions.categorie (string)')

  // Creer le nouveau champ M2O
  await safeApi('POST', '/fields/transactions', {
    field: 'categorie',
    type: 'uuid',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      display: 'related-values',
      display_options: { template: '{{label}}' },
      sort: 5,
      note: 'Categorie de la transaction'
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ transactions.categorie (M2O)')

  await safeApi('POST', '/relations', {
    collection: 'transactions',
    field: 'categorie',
    related_collection: 'categories_finance'
  }, 'Relation transactions.categorie -> categories_finance')

  // ── Ajouter le type 'fondateur' aux choix du champ transactions.type ──
  await safeApi('PATCH', '/fields/transactions/type', {
    meta: {
      options: {
        choices: [
          { text: 'Recette', value: 'recette' },
          { text: 'Depense', value: 'depense' },
          { text: 'Fondateur', value: 'fondateur' }
        ]
      }
    }
  }, 'Ajout choix fondateur dans transactions.type')

  // ── Seed categories initiales ──
  const seeds = [
    // Recettes
    { label: 'Abonnement Tipeee', type: 'recette', icone: 'i-lucide-heart', sous_categorie: 'Bergfrid' },
    { label: 'Abonnement streaming', type: 'recette', icone: 'i-lucide-play-circle', sous_categorie: null },
    { label: 'Vente de livre', type: 'recette', icone: 'i-lucide-book-open', sous_categorie: null },
    { label: 'Vente produit derive', type: 'recette', icone: 'i-lucide-shopping-bag', sous_categorie: null },
    { label: 'Vente service informatique', type: 'recette', icone: 'i-lucide-code', sous_categorie: null },
    { label: 'Autre', type: 'recette', icone: 'i-lucide-circle', sous_categorie: null },
    // Depenses
    { label: 'Logiciels et outils', type: 'depense', icone: 'i-lucide-cpu', sous_categorie: null },
    { label: 'Materiel', type: 'depense', icone: 'i-lucide-monitor', sous_categorie: null },
    { label: 'Impots', type: 'depense', icone: 'i-lucide-landmark', sous_categorie: null },
    { label: 'Freelance', type: 'depense', icone: 'i-lucide-user', sous_categorie: null },
    { label: 'Autre', type: 'depense', icone: 'i-lucide-circle', sous_categorie: null },
    // Fondateur
    { label: 'Apport fondateur', type: 'fondateur', icone: 'i-lucide-heart-handshake', sous_categorie: null }
  ]

  for (const seed of seeds) {
    await safeApi('POST', '/items/categories_finance', seed, `Seed categorie: ${seed.label} (${seed.type})`)
  }
}
