/**
 * Enrichit la collection produits : sous-titre, edition, fait_main, a_stock.
 * Ajoute le type 'artisanat'.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/produits', {
    field: 'sous_titre',
    type: 'string',
    meta: { interface: 'input', sort: 2, note: 'Sous-titre ou description courte (livres)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Field produits.sous_titre')

  await safeApi('POST', '/fields/produits', {
    field: 'edition',
    type: 'string',
    meta: { interface: 'input', sort: 5, note: 'Edition du livre (1ere, collector, poche...)' },
    schema: { is_nullable: true, default_value: null }
  }, 'Field produits.edition')

  await safeApi('POST', '/fields/produits', {
    field: 'fait_main',
    type: 'boolean',
    meta: { interface: 'boolean', sort: 6, note: 'Produit artisanal / fait main' },
    schema: { is_nullable: false, default_value: false }
  }, 'Field produits.fait_main')

  await safeApi('POST', '/fields/produits', {
    field: 'a_stock',
    type: 'boolean',
    meta: { interface: 'boolean', sort: 7, note: 'Ce produit a une gestion de stock' },
    schema: { is_nullable: false, default_value: true }
  }, 'Field produits.a_stock')

  // Update type_produit choices to include artisanat
  await safeApi('PATCH', '/fields/produits/type_produit', {
    meta: {
      options: {
        choices: [
          { text: 'Livre', value: 'livre' },
          { text: 'Produit derive', value: 'derive' },
          { text: 'Artisanat', value: 'artisanat' },
          { text: 'Service web', value: 'service' },
          { text: 'Autre', value: 'autre' }
        ]
      }
    }
  }, 'Update type_produit choices')
}
