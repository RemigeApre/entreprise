import { readItems, createItem } from '@directus/sdk'
import type { CategorieFinance, TransactionType } from '~/utils/types'

export function useFinanceCategories() {
  const { $directus } = useNuxtApp()

  const categories = useState<CategorieFinance[]>('finance-categories', () => [])
  const loaded = useState<boolean>('finance-categories-loaded', () => false)

  async function loadCategories() {
    try {
      categories.value = await $directus.request(readItems('categories_finance', {
        fields: ['id', 'label', 'type', 'icone', 'sous_categorie', 'date_created'],
        sort: ['type', 'label'],
        limit: -1
      })) as CategorieFinance[]
      loaded.value = true
    } catch {
      categories.value = []
    }
  }

  async function createCategory(data: { label: string; type: TransactionType; icone?: string; sous_categorie?: string }) {
    const cat = await $directus.request(createItem('categories_finance', {
      label: data.label,
      type: data.type,
      icone: data.icone || null,
      sous_categorie: data.sous_categorie || null
    })) as CategorieFinance
    categories.value.push(cat)
    return cat
  }

  function getCategoriesByType(type: TransactionType) {
    return categories.value.filter(c => c.type === type)
  }

  function getCategoryLabel(catOrId: CategorieFinance | string | null): string {
    if (!catOrId) return 'Autre'
    if (typeof catOrId === 'object') {
      const sub = catOrId.sous_categorie ? ` (${catOrId.sous_categorie})` : ''
      return catOrId.label + sub
    }
    const found = categories.value.find(c => c.id === catOrId)
    if (found) {
      const sub = found.sous_categorie ? ` (${found.sous_categorie})` : ''
      return found.label + sub
    }
    return 'Autre'
  }

  function getCategoryIcon(catOrId: CategorieFinance | string | null): string {
    if (!catOrId) return 'i-lucide-circle'
    if (typeof catOrId === 'object') return catOrId.icone || 'i-lucide-circle'
    const found = categories.value.find(c => c.id === catOrId)
    return found?.icone || 'i-lucide-circle'
  }

  return {
    categories,
    loaded,
    loadCategories,
    createCategory,
    getCategoriesByType,
    getCategoryLabel,
    getCategoryIcon
  }
}
