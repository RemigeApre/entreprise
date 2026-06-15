import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Materiel, Produit, AchatPrevu } from '~/utils/types'
import { MATERIEL_TYPES } from '~/utils/constants'

export function useMateriel() {
  const { $directus } = useNuxtApp()

  const materielFields = [
    'id', 'code', 'nom', 'type_materiel', 'categorie', 'description', 'quantite', 'etat',
    'affecte_a.id', 'affecte_a.first_name', 'affecte_a.last_name',
    'cout', 'notes', 'date_created'
  ]

  const produitFields = ['*']

  const achatFields = [
    'id', 'nom', 'categorie', 'prix_estime', 'quantite', 'type', 'statut',
    'prochaine_date', 'recurrence_mois', 'notes', 'date_created'
  ]

  // --- Generate code ---
  async function generateCode(typeMateriel: string): Promise<string> {
    const config = MATERIEL_TYPES[typeMateriel]
    const prefix = config?.prefix || 'XX'
    const existing = await $directus.request(readItems('materiels', {
      filter: { type_materiel: { _eq: typeMateriel } },
      fields: ['code'],
      sort: ['-code'],
      limit: 1
    })) as { code: string }[]
    let num = 1
    if (existing.length && existing[0].code) {
      const match = existing[0].code.match(/(\d+)$/)
      if (match) num = parseInt(match[1]) + 1
    }
    return `${prefix}-${String(num).padStart(4, '0')}`
  }

  async function generateProduitCode(typeProduit: string): Promise<string> {
    const prefixMap: Record<string, string> = { livre: 'LV', derive: 'PD', artisanat: 'AR', service: 'SV', autre: 'PR' }
    const prefix = prefixMap[typeProduit] || 'PR'
    const existing = await $directus.request(readItems('produits', {
      filter: { type_produit: { _eq: typeProduit } },
      fields: ['code'],
      sort: ['-code'],
      limit: 1
    })) as { code: string }[]
    let num = 1
    if (existing.length && existing[0].code) {
      const match = existing[0].code.match(/(\d+)$/)
      if (match) num = parseInt(match[1]) + 1
    }
    return `${prefix}-${String(num).padStart(4, '0')}`
  }

  // --- Materiels ---
  async function getAllMateriels() {
    return await $directus.request(readItems('materiels', {
      fields: materielFields, sort: ['categorie', 'type_materiel', 'code'], limit: -1
    })) as Materiel[]
  }

  async function createMateriel(data: Partial<Materiel>) {
    if (!data.code && data.type_materiel) {
      data.code = await generateCode(data.type_materiel)
    }
    return await $directus.request(createItem('materiels', data)) as Materiel
  }

  async function updateMateriel(id: string, data: Partial<Materiel>) {
    return await $directus.request(updateItem('materiels', id, data)) as Materiel
  }

  async function removeMateriel(id: string) {
    await $directus.request(deleteItem('materiels', id))
  }

  // --- Produits ---
  async function getAllProduits() {
    return await $directus.request(readItems('produits', {
      fields: produitFields, sort: ['type_produit', 'nom'], limit: -1
    })) as Produit[]
  }

  async function createProduit(data: Partial<Produit>) {
    if (!data.code && data.type_produit) {
      data.code = await generateProduitCode(data.type_produit)
    }
    return await $directus.request(createItem('produits', data)) as Produit
  }

  async function updateProduit(id: string, data: Partial<Produit>) {
    return await $directus.request(updateItem('produits', id, data)) as Produit
  }

  async function removeProduit(id: string) {
    await $directus.request(deleteItem('produits', id))
  }

  // --- Lieux de stockage ---
  async function getAllLieux() {
    return await $directus.request(readItems('lieux_stockage', {
      fields: ['*'], sort: ['nom'], limit: -1
    })) as any[]
  }

  async function createLieu(nom: string, adresse?: string | null) {
    return await $directus.request(createItem('lieux_stockage', { nom, adresse: adresse || null }))
  }

  async function updateLieu(id: number, data: { nom?: string; adresse?: string | null }) {
    return await $directus.request(updateItem('lieux_stockage', id as any, data))
  }

  async function removeLieu(id: number) {
    await $directus.request(deleteItem('lieux_stockage', id as any))
  }

  // --- Stocks par lieu ---
  async function getAllStocks() {
    return await $directus.request(readItems('stocks_lieux', {
      fields: ['*', 'lieu.id', 'lieu.nom'],
      sort: ['produit', 'lieu'],
      limit: -1
    })) as any[]
  }

  async function upsertStock(produit: number, lieu: number, quantite: number, edition?: number | null) {
    // Check if entry exists
    const filter: any = { produit: { _eq: produit }, lieu: { _eq: lieu } }
    if (edition) filter.edition = { _eq: edition }
    else filter.edition = { _null: true }

    const existing = await $directus.request(readItems('stocks_lieux', {
      filter, fields: ['id'], limit: 1
    })) as any[]

    if (existing.length) {
      return await $directus.request(updateItem('stocks_lieux', existing[0].id, { quantite }))
    } else {
      return await $directus.request(createItem('stocks_lieux', { produit, lieu, edition: edition || null, quantite }))
    }
  }

  async function adjustStockLieu(produit: number, lieu: number, delta: number, edition?: number | null) {
    const filter: any = { produit: { _eq: produit }, lieu: { _eq: lieu } }
    if (edition) filter.edition = { _eq: edition }
    else filter.edition = { _null: true }

    const existing = await $directus.request(readItems('stocks_lieux', {
      filter, fields: ['id', 'quantite'], limit: 1
    })) as any[]

    if (existing.length) {
      const newQty = Math.max(0, (existing[0].quantite || 0) + delta)
      return await $directus.request(updateItem('stocks_lieux', existing[0].id, { quantite: newQty }))
    } else if (delta > 0) {
      return await $directus.request(createItem('stocks_lieux', { produit, lieu, edition: edition || null, quantite: delta }))
    }
  }

  // --- Editions ---
  async function getAllEditions() {
    return await $directus.request(readItems('produit_editions', {
      fields: ['*'],
      sort: ['produit', 'numero'],
      limit: -1
    })) as any[]
  }

  async function createEdition(data: any) {
    return await $directus.request(createItem('produit_editions', data))
  }

  async function updateEdition(id: string, data: any) {
    return await $directus.request(updateItem('produit_editions', id, data))
  }

  async function removeEdition(id: string) {
    await $directus.request(deleteItem('produit_editions', id))
  }

  // --- Achats ---
  async function getAllAchats() {
    return await $directus.request(readItems('achats_prevus', {
      fields: achatFields, sort: ['statut', 'prochaine_date'], limit: -1
    })) as AchatPrevu[]
  }

  async function createAchat(data: Partial<AchatPrevu>) {
    return await $directus.request(createItem('achats_prevus', data)) as AchatPrevu
  }

  async function updateAchat(id: string, data: Partial<AchatPrevu>) {
    return await $directus.request(updateItem('achats_prevus', id, data)) as AchatPrevu
  }

  async function removeAchat(id: string) {
    await $directus.request(deleteItem('achats_prevus', id))
  }

  return {
    generateCode, generateProduitCode,
    getAllMateriels, createMateriel, updateMateriel, removeMateriel,
    getAllProduits, createProduit, updateProduit, removeProduit,
    getAllEditions, createEdition, updateEdition, removeEdition,
    getAllLieux, createLieu, updateLieu, removeLieu,
    getAllStocks, upsertStock, adjustStockLieu,
    getAllAchats, createAchat, updateAchat, removeAchat
  }
}
