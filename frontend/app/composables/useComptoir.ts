import { readItems, createItem, updateItem, deleteItem } from '@directus/sdk'
import type { Produit, ProduitEdition, LieuStockage, StockLieu, Vendeur } from '~/utils/types'

const STORAGE_KEY = '_comptoir'
const QUEUE_KEY = '_comptoir_queue'

interface ComptoirState {
  token: string
  lieuActuel: number | null
  vendeurActuel: number | null
  authenticatedAt: number
}

interface QueuedAction {
  id: string
  type: 'vente' | 'stock_set' | 'mouvement'
  data: any
  createdAt: number
}

export function useComptoir() {
  const { $directus } = useNuxtApp()

  const authenticated = useState<boolean>('comptoir-auth', () => false)
  const token = useState<string | null>('comptoir-token', () => null)
  const lieuActuel = useState<number | null>('comptoir-lieu', () => null)
  const vendeurActuel = useState<number | null>('comptoir-vendeur', () => null)
  const online = useState<boolean>('comptoir-online', () => true)
  const queue = useState<QueuedAction[]>('comptoir-queue', () => [])

  // Products cache
  const produits = useState<Produit[]>('comptoir-produits', () => [])
  const editions = useState<ProduitEdition[]>('comptoir-editions', () => [])
  const lieux = useState<LieuStockage[]>('comptoir-lieux', () => [])
  const stocks = useState<StockLieu[]>('comptoir-stocks', () => [])
  const vendeurs = useState<Vendeur[]>('comptoir-vendeurs', () => [])
  const loading = useState<boolean>('comptoir-loading', () => false)

  // --- Auth ---
  function loadSession() {
    if (!import.meta.client) return false
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      const state: ComptoirState = JSON.parse(stored)
      // Expire after 12h
      if (Date.now() - state.authenticatedAt > 12 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }
      token.value = state.token
      lieuActuel.value = state.lieuActuel
      vendeurActuel.value = state.vendeurActuel ?? null
      authenticated.value = true
      loadQueue()
      return true
    } catch { return false }
  }

  async function authenticate(pin: string): Promise<boolean> {
    try {
      const res = await $fetch<{ token: string; lieu_defaut: number | null }>('/_comptoir/auth', {
        method: 'POST',
        body: { pin }
      })
      token.value = res.token
      // Nouvelle connexion : on force le choix vendeur puis lieu.
      vendeurActuel.value = null
      lieuActuel.value = null
      authenticated.value = true
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          token: res.token,
          lieuActuel: null,
          vendeurActuel: null,
          authenticatedAt: Date.now()
        } as ComptoirState))
      }
      return true
    } catch { return false }
  }

  function logout() {
    authenticated.value = false
    token.value = null
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  function persistSession(patch: Record<string, unknown>) {
    if (!import.meta.client) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      const state = JSON.parse(stored)
      Object.assign(state, patch)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch { /* ignore */ }
  }

  function setLieu(id: number) {
    lieuActuel.value = id
    persistSession({ lieuActuel: id })
  }

  function setVendeur(id: number | null) {
    vendeurActuel.value = id
    persistSession({ vendeurActuel: id })
  }

  // --- Droits ---
  const vendeurActuelObj = computed(() => vendeurs.value.find(v => v.id === vendeurActuel.value) || null)
  const isDirecteur = computed(() => vendeurActuelObj.value?.role === 'directeur')

  // --- CRUD vendeurs ---
  async function createVendeur(nom: string, role: string = 'employe') {
    return await $directus.request(createItem('vendeurs', { nom, actif: true, role }))
  }
  async function updateVendeur(id: number, data: { nom?: string; actif?: boolean; role?: string }) {
    return await $directus.request(updateItem('vendeurs', id as any, data))
  }
  async function removeVendeur(id: number) {
    await $directus.request(deleteItem('vendeurs', id as any))
  }

  // --- Data loading ---
  async function loadData() {
    loading.value = true
    try {
      const [p, e, l, s, v] = await Promise.all([
        $directus.request(readItems('produits', { fields: ['*'], sort: ['type_produit', 'nom'], limit: -1 })),
        $directus.request(readItems('produit_editions', { fields: ['*'], sort: ['produit', 'numero'], limit: -1 })),
        $directus.request(readItems('lieux_stockage', { fields: ['*'], sort: ['nom'], limit: -1 })),
        $directus.request(readItems('stocks_lieux', { fields: ['*', 'lieu.id', 'lieu.nom'], sort: ['produit'], limit: -1 })),
        $directus.request(readItems('vendeurs', { fields: ['*'], sort: ['nom'], limit: -1 }))
      ])
      produits.value = p as Produit[]
      editions.value = e as ProduitEdition[]
      lieux.value = l as LieuStockage[]
      stocks.value = s as StockLieu[]
      vendeurs.value = v as Vendeur[]

      // Cache for offline
      if (import.meta.client) {
        localStorage.setItem('_comptoir_cache', JSON.stringify({
          produits: produits.value,
          editions: editions.value,
          lieux: lieux.value,
          stocks: stocks.value,
          vendeurs: vendeurs.value,
          cachedAt: Date.now()
        }))
      }
      online.value = true
    } catch {
      // Try loading from cache
      loadFromCache()
      online.value = false
    } finally {
      loading.value = false
    }
  }

  function loadFromCache() {
    if (!import.meta.client) return
    try {
      const cached = localStorage.getItem('_comptoir_cache')
      if (cached) {
        const data = JSON.parse(cached)
        produits.value = data.produits || []
        editions.value = data.editions || []
        lieux.value = data.lieux || []
        stocks.value = data.stocks || []
        vendeurs.value = data.vendeurs || []
      }
    } catch {}
  }

  // --- Merged produits (with editions) ---
  function getProduitsWithEditions(): (Produit & { editions: ProduitEdition[] })[] {
    return produits.value.map(p => ({
      ...p,
      editions: editions.value
        .filter(e => {
          const pid = typeof e.produit === 'object' ? (e.produit as any).id : e.produit
          return pid === Number(p.id)
        })
        .sort((a, b) => a.numero - b.numero)
    }))
  }

  function getStockForLieu(produitId: number, lieuId: number, editionId?: number): number {
    const s = stocks.value.find(s => {
      const pid = typeof s.produit === 'object' ? (s.produit as any).id : s.produit
      const lid = typeof s.lieu === 'object' ? (s.lieu as any).id : s.lieu
      return pid === produitId && lid === lieuId && (editionId ? s.edition === editionId : !s.edition)
    })
    return s?.quantite || 0
  }

  // --- Queue (offline) ---
  function loadQueue() {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(QUEUE_KEY)
      queue.value = stored ? JSON.parse(stored) : []
    } catch { queue.value = [] }
  }

  function saveQueue() {
    if (import.meta.client) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.value))
    }
  }

  function enqueue(action: Omit<QueuedAction, 'id' | 'createdAt'>) {
    queue.value.push({
      ...action,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    })
    saveQueue()
  }

  async function syncQueue(): Promise<number> {
    let synced = 0
    const remaining: QueuedAction[] = []

    for (const action of queue.value) {
      try {
        if (action.type === 'vente') {
          const vente = await $directus.request(createItem('ventes', action.data.vente))
          for (const ligne of action.data.lignes) {
            await $directus.request(createItem('vente_lignes', { ...ligne, vente: (vente as any).id }))
          }
          // Decrement stocks
          for (const dec of action.data.decrements || []) {
            await adjustStockRemote(dec.produit, dec.lieu, -dec.quantite, dec.edition)
          }
        } else if (action.type === 'stock_set') {
          await setStockRemote(action.data.produit, action.data.lieu, action.data.quantite, action.data.edition)
        } else if (action.type === 'mouvement') {
          await $directus.request(createItem('mouvements_stock', action.data))
          if (action.data.type === 'transfert' && action.data.lieu_destination) {
            await adjustStockRemote(action.data.produit, action.data.lieu_source, -action.data.quantite, action.data.edition)
            await adjustStockRemote(action.data.produit, action.data.lieu_destination, action.data.quantite, action.data.edition)
          } else {
            // perte/cadeau: just decrement
            await adjustStockRemote(action.data.produit, action.data.lieu_source, -action.data.quantite, action.data.edition)
          }
        }
        synced++
      } catch {
        remaining.push(action)
      }
    }

    queue.value = remaining
    saveQueue()
    if (synced > 0) await loadData()
    return synced
  }

  async function adjustStockRemote(produit: number, lieu: number, delta: number, edition?: number | null) {
    const filter: any = { produit: { _eq: produit }, lieu: { _eq: lieu } }
    if (edition) filter.edition = { _eq: edition }
    else filter.edition = { _null: true }

    const existing = await $directus.request(readItems('stocks_lieux', { filter, fields: ['id', 'quantite'], limit: 1 })) as any[]
    if (existing.length) {
      await $directus.request(updateItem('stocks_lieux', existing[0].id, { quantite: Math.max(0, (existing[0].quantite || 0) + delta) }))
    } else if (delta > 0) {
      await $directus.request(createItem('stocks_lieux', { produit, lieu, edition: edition || null, quantite: delta }))
    }
  }

  async function setStockRemote(produit: number, lieu: number, quantite: number, edition?: number | null) {
    const filter: any = { produit: { _eq: produit }, lieu: { _eq: lieu } }
    if (edition) filter.edition = { _eq: edition }
    else filter.edition = { _null: true }

    const existing = await $directus.request(readItems('stocks_lieux', { filter, fields: ['id'], limit: 1 })) as any[]
    if (existing.length) {
      await $directus.request(updateItem('stocks_lieux', existing[0].id, { quantite }))
    } else {
      await $directus.request(createItem('stocks_lieux', { produit, lieu, edition: edition || null, quantite }))
    }
  }

  // --- Check connectivity ---
  function startConnectivityCheck() {
    if (!import.meta.client) return
    setInterval(async () => {
      try {
        const r = await fetch('/_comptoir/auth', { method: 'HEAD' }).catch(() => null)
        online.value = !!r
      } catch { online.value = false }
    }, 15000)
  }

  return {
    authenticated, token, lieuActuel, vendeurActuel, online, queue, loading,
    produits, editions, lieux, stocks, vendeurs,
    vendeurActuelObj, isDirecteur,
    loadSession, authenticate, logout, setLieu, setVendeur,
    createVendeur, updateVendeur, removeVendeur,
    loadData, getProduitsWithEditions, getStockForLieu,
    enqueue, syncQueue, startConnectivityCheck
  }
}
