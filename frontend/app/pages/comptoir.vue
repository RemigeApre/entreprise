<script setup lang="ts">
import { createItem } from '@directus/sdk'
import type { Produit, ProduitEdition } from '~/utils/types'
import { PRODUIT_TYPES } from '~/utils/constants'

definePageMeta({ layout: false })

const {
  authenticated, lieuActuel, online, queue, loading,
  lieux, stocks,
  loadSession, authenticate, logout, setLieu,
  loadData, getProduitsWithEditions, getStockForLieu,
  enqueue, syncQueue, startConnectivityCheck
} = useComptoir()

// --- PIN Screen ---
const pinDigits = ref<string[]>(['', '', '', '', '', ''])
const pinError = ref(false)
const pinLoading = ref(false)
const pinRefs = ref<HTMLInputElement[]>([])

function onPinInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '')
  pinDigits.value[index] = val.slice(-1)
  if (val && index < 5) pinRefs.value[index + 1]?.focus()
  pinError.value = false
}

function onPinKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !pinDigits.value[index] && index > 0) pinRefs.value[index - 1]?.focus()
}

async function submitPin() {
  const pin = pinDigits.value.join('')
  if (pin.length !== 6) return
  pinLoading.value = true
  const ok = await authenticate(pin)
  pinLoading.value = false
  if (ok) { await loadData(); startConnectivityCheck() }
  else { pinError.value = true; pinDigits.value = ['', '', '', '', '', '']; pinRefs.value[0]?.focus() }
}

watch(() => pinDigits.value.join(''), v => { if (v.length === 6) submitPin() })

// --- Main interface ---
const navOpen = ref(false)
const view = ref<'vente' | 'inventaire' | 'historique'>('vente')
const showLieuSelect = ref(false)

const produitsAvecEditions = computed(() => getProduitsWithEditions())
const filterType = ref<string>('all')

const produitsFiltered = computed(() => {
  const all = produitsAvecEditions.value.filter(p => p.a_stock !== false)
  if (filterType.value === 'all') return all
  return all.filter(p => p.type_produit === filterType.value)
})

const produitsGrouped = computed(() => {
  if (filterType.value !== 'all') return null
  const groups: { key: string; label: string; icon: string; produits: typeof produitsFiltered.value }[] = []
  for (const [key, config] of Object.entries(PRODUIT_TYPES)) {
    const items = produitsFiltered.value.filter(p => p.type_produit === key)
    if (items.length) groups.push({ key, label: config.label, icon: config.icon, produits: items })
  }
  return groups
})

const lieuActuelNom = computed(() => {
  if (!lieuActuel.value) return 'Aucun lieu'
  return lieux.value.find(l => l.id === lieuActuel.value)?.nom || 'Lieu inconnu'
})

// --- Panier ---
type LigneType = 'vente' | 'perte' | 'cadeau'

interface PanierLigne {
  id: string
  produit: Produit
  edition: ProduitEdition | null
  quantite: number
  prixUnitaire: number
  remisePourcent: number
  remiseMontant: number
  ligneType: LigneType
}

const panier = ref<PanierLigne[]>([])
const clientLabel = ref('')
const remiseGlobalePourcent = ref(0)

function ajouterAuPanier(p: Produit, edition?: ProduitEdition, type: LigneType = 'vente') {
  const existing = panier.value.find(l =>
    l.produit.id === p.id && (edition ? l.edition?.id === edition.id : !l.edition) && l.ligneType === type
  )
  if (existing) { existing.quantite++; return }
  panier.value.push({
    id: crypto.randomUUID(),
    produit: p,
    edition: edition || null,
    quantite: 1,
    prixUnitaire: type === 'vente' ? (edition?.prix_vente || p.prix_vente) : 0,
    remisePourcent: 0,
    remiseMontant: 0,
    ligneType: type
  })
}

function retirerDuPanier(id: string) {
  panier.value = panier.value.filter(l => l.id !== id)
}

function ligneTotal(l: PanierLigne): number {
  if (l.ligneType !== 'vente') return 0
  let prix = l.prixUnitaire * l.quantite
  if (l.remisePourcent > 0) prix -= prix * l.remisePourcent / 100
  if (l.remiseMontant > 0) prix -= l.remiseMontant
  return Math.max(0, prix)
}

const sousTotal = computed(() => panier.value.reduce((s, l) => s + ligneTotal(l), 0))
const totalFinal = computed(() => {
  let t = sousTotal.value
  if (remiseGlobalePourcent.value > 0) t -= t * remiseGlobalePourcent.value / 100
  return Math.max(0, t)
})

// --- Edition picker ---
const showEditionPicker = ref(false)
const editionPickerProduit = ref<(Produit & { editions: ProduitEdition[] }) | null>(null)
const editionPickerType = ref<LigneType>('vente')

function handleProductTap(p: Produit & { editions: ProduitEdition[] }, type: LigneType = 'vente') {
  if (p.type_produit === 'livre' && p.editions.length > 0) {
    editionPickerProduit.value = p
    editionPickerType.value = type
    showEditionPicker.value = true
  } else {
    ajouterAuPanier(p, undefined, type)
  }
}

function handleEditionSelect(p: Produit, e: ProduitEdition) {
  ajouterAuPanier(p, e, editionPickerType.value)
  showEditionPicker.value = false
}

// --- Mode ajout (vente, cadeau) ---
const addMode = ref<LigneType>('vente')

// --- Perte independante ---
const showPerteModal = ref(false)
const perteSearch = ref('')
const perteProduit = ref<(Produit & { editions: ProduitEdition[] }) | null>(null)
const perteEdition = ref<ProduitEdition | null>(null)
const perteQuantite = ref(1)
const perteNote = ref('')
const perteLoading = ref(false)

const perteProduitsFiltres = computed(() => {
  const q = perteSearch.value.toLowerCase().trim()
  const all = produitsAvecEditions.value.filter(p => p.a_stock !== false)
  if (!q) return all
  return all.filter(p => p.nom.toLowerCase().includes(q))
})

function openPerteModal() {
  perteProduit.value = null
  perteEdition.value = null
  perteQuantite.value = 1
  perteNote.value = ''
  perteSearch.value = ''
  showPerteModal.value = true
  navOpen.value = false
}

function selectPerteProduit(p: Produit & { editions: ProduitEdition[] }) {
  perteProduit.value = p
  perteEdition.value = null
}

async function enregistrerPerte() {
  if (!perteProduit.value || !lieuActuel.value || perteQuantite.value < 1) return
  perteLoading.value = true

  const produitId = Number(perteProduit.value.id)
  const editionId = perteEdition.value ? Number(perteEdition.value.id) : null

  try {
    if (online.value) {
      const { $directus } = useNuxtApp()
      await $directus.request(createItem('mouvements_stock', {
        produit: produitId,
        edition: editionId,
        lieu_source: lieuActuel.value,
        lieu_destination: null,
        quantite: perteQuantite.value,
        type: 'perte',
        notes: perteNote.value.trim() || null,
        date: new Date().toISOString()
      }))

      const { adjustStockLieu } = useMateriel()
      await adjustStockLieu(produitId, lieuActuel.value, -perteQuantite.value, editionId)
      await loadData()
    } else {
      enqueue({
        type: 'mouvement', data: {
          produit: produitId,
          edition: editionId,
          lieu_source: lieuActuel.value,
          lieu_destination: null,
          quantite: perteQuantite.value,
          type: 'perte',
          notes: perteNote.value.trim() || null,
          date: new Date().toISOString()
        }
      })
      const idx = stocks.value.findIndex(s => {
        const pid = typeof s.produit === 'object' ? (s.produit as any).id : s.produit
        const lid = typeof s.lieu === 'object' ? (s.lieu as any).id : s.lieu
        return pid === produitId && lid === lieuActuel.value && (editionId ? s.edition === editionId : !s.edition)
      })
      if (idx >= 0) stocks.value[idx].quantite = Math.max(0, stocks.value[idx].quantite - perteQuantite.value)
    }

    // Ajouter a l'historique des pertes du jour
    pertesAujourdhui.value.unshift({
      id: crypto.randomUUID(),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      produit: perteEdition.value
        ? `${perteProduit.value.nom} (${perteEdition.value.nom_edition})`
        : perteProduit.value.nom,
      quantite: perteQuantite.value,
      note: perteNote.value.trim() || null
    })

    showPerteModal.value = false
  } catch {
    // silent
  } finally {
    perteLoading.value = false
  }
}

// --- Payment screen ---
const showPayment = ref(false)
const paymentMethod = ref<'especes' | 'carte' | 'mixte'>('especes')
const paymentEspeces = ref<number | null>(null)
const paymentCarte = ref<number | null>(null)
const encaissementLoading = ref(false)

function openPayment() {
  if (!panier.value.length || !lieuActuel.value) return
  paymentMethod.value = 'especes'
  paymentEspeces.value = totalFinal.value
  paymentCarte.value = 0
  showPayment.value = true
}

watch(paymentMethod, m => {
  if (m === 'especes') { paymentEspeces.value = totalFinal.value; paymentCarte.value = 0 }
  else if (m === 'carte') { paymentCarte.value = totalFinal.value; paymentEspeces.value = 0 }
  else { paymentEspeces.value = null; paymentCarte.value = null }
})

async function confirmerEncaissement() {
  if (!panier.value.length || !lieuActuel.value) return
  encaissementLoading.value = true

  const venteLignes = panier.value.filter(l => l.ligneType === 'vente')
  const cadeaux = panier.value.filter(l => l.ligneType === 'cadeau')

  try {
    const venteData = {
      vente: {
        date: new Date().toISOString(),
        client_label: clientLabel.value.trim() || null,
        lieu: lieuActuel.value,
        total: totalFinal.value,
        remise_globale_pourcent: remiseGlobalePourcent.value || null,
        paiement_especes: paymentEspeces.value || null,
        paiement_carte: paymentCarte.value || null,
        notes: null
      },
      lignes: venteLignes.map(l => ({
        produit: Number(l.produit.id),
        edition: l.edition ? Number(l.edition.id) : null,
        quantite: l.quantite,
        prix_unitaire: l.prixUnitaire,
        remise_pourcent: l.remisePourcent || null,
        remise_montant: l.remiseMontant || null
      })),
      decrements: panier.value.map(l => ({
        produit: Number(l.produit.id),
        lieu: lieuActuel.value!,
        quantite: l.quantite,
        edition: l.edition ? Number(l.edition.id) : null
      }))
    }

    if (online.value) {
      const { $directus } = useNuxtApp()

      // Create vente if there are sale lines
      if (venteLignes.length) {
        const vente = await $directus.request(createItem('ventes', venteData.vente))
        for (const ligne of venteData.lignes) {
          await $directus.request(createItem('vente_lignes', { ...ligne, vente: (vente as any).id }))
        }
      }

      // Create mouvements for cadeaux
      for (const pc of cadeaux) {
        await $directus.request(createItem('mouvements_stock', {
          produit: Number(pc.produit.id),
          edition: pc.edition ? Number(pc.edition.id) : null,
          lieu_source: lieuActuel.value,
          lieu_destination: null,
          quantite: pc.quantite,
          type: pc.ligneType,
          notes: null,
          date: new Date().toISOString()
        }))
      }

      // Decrement all stocks
      const { adjustStockLieu } = useMateriel()
      for (const dec of venteData.decrements) {
        await adjustStockLieu(dec.produit, dec.lieu, -dec.quantite, dec.edition)
      }

      await loadData()
    } else {
      enqueue({ type: 'vente', data: venteData })
      for (const dec of venteData.decrements) {
        const idx = stocks.value.findIndex(s => {
          const pid = typeof s.produit === 'object' ? (s.produit as any).id : s.produit
          const lid = typeof s.lieu === 'object' ? (s.lieu as any).id : s.lieu
          return pid === dec.produit && lid === dec.lieu && (dec.edition ? s.edition === dec.edition : !s.edition)
        })
        if (idx >= 0) stocks.value[idx].quantite = Math.max(0, stocks.value[idx].quantite - dec.quantite)
      }
    }

    ventesAujourdhui.value.unshift({
      id: crypto.randomUUID(),
      heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      client: clientLabel.value.trim() || null,
      lignes: panier.value.map(l => ({
        nom: l.edition ? `${l.produit.nom} (${l.edition.nom_edition})` : l.produit.nom,
        qty: l.quantite,
        type: l.ligneType
      })),
      total: totalFinal.value,
      paiement: paymentMethod.value
    })

    panier.value = []
    clientLabel.value = ''
    remiseGlobalePourcent.value = 0
    showPayment.value = false
    addMode.value = 'vente'
  } catch {
    // Fallback: enqueue
  } finally {
    encaissementLoading.value = false
  }
}

// --- Historique du jour ---
interface VenteJour {
  id: string; heure: string; client: string | null
  lignes: { nom: string; qty: number; type: LigneType }[]
  total: number; paiement: string
}
const ventesAujourdhui = ref<VenteJour[]>([])

interface PerteJour {
  id: string; heure: string; produit: string; quantite: number; note: string | null
}
const pertesAujourdhui = ref<PerteJour[]>([])

const STORAGE_KEY_VENTES = 'comptoir_ventes_jour'
const STORAGE_KEY_PERTES = 'comptoir_pertes_jour'
const STORAGE_KEY_DATE = 'comptoir_jour_date'

function saveJourData() {
  localStorage.setItem(STORAGE_KEY_VENTES, JSON.stringify(ventesAujourdhui.value))
  localStorage.setItem(STORAGE_KEY_PERTES, JSON.stringify(pertesAujourdhui.value))
  localStorage.setItem(STORAGE_KEY_DATE, new Date().toISOString().slice(0, 10))
}

function loadJourData() {
  try {
    const savedDate = localStorage.getItem(STORAGE_KEY_DATE)
    const today = new Date().toISOString().slice(0, 10)
    // Si la date sauvegardee n'est pas aujourd'hui, on repart a zero
    if (savedDate !== today) {
      localStorage.removeItem(STORAGE_KEY_VENTES)
      localStorage.removeItem(STORAGE_KEY_PERTES)
      localStorage.removeItem(STORAGE_KEY_DATE)
      return
    }
    const rawV = localStorage.getItem(STORAGE_KEY_VENTES)
    const rawP = localStorage.getItem(STORAGE_KEY_PERTES)
    if (rawV) ventesAujourdhui.value = JSON.parse(rawV)
    if (rawP) pertesAujourdhui.value = JSON.parse(rawP)
  } catch { /* ignore */ }
}

watch(ventesAujourdhui, saveJourData, { deep: true })
watch(pertesAujourdhui, saveJourData, { deep: true })

// --- Recap de fin de journee ---
const showRecap = ref(false)

function buildRecap(ventes: VenteJour[], pertes: PerteJour[]) {
  const nbVentes = ventes.filter(v => v.lignes.some(l => l.type === 'vente')).length
  const totalEspeces = ventes.reduce((s, v) => v.paiement === 'especes' ? s + v.total : s, 0)
  const totalCarte = ventes.reduce((s, v) => v.paiement === 'carte' ? s + v.total : s, 0)
  const totalMixte = ventes.reduce((s, v) => v.paiement === 'mixte' ? s + v.total : s, 0)
  const totalEncaisse = totalEspeces + totalCarte + totalMixte

  let nbCadeaux = 0
  for (const v of ventes) {
    for (const l of v.lignes) {
      if (l.type === 'cadeau') nbCadeaux += l.qty
    }
  }

  const nbPertes = pertes.reduce((s, p) => s + p.quantite, 0)

  return { nbVentes, totalEncaisse, totalEspeces, totalCarte, totalMixte, nbCadeaux, nbPertes }
}

const recapJournee = computed(() => buildRecap(ventesAujourdhui.value, pertesAujourdhui.value))

// --- Historique global (persiste en localStorage) ---
interface JourneeValidee {
  date: string // YYYY-MM-DD
  lieu: string
  recap: ReturnType<typeof buildRecap>
  ventes: VenteJour[]
  pertes: PerteJour[]
}

const historiqueGlobal = ref<JourneeValidee[]>([])

function loadHistoriqueGlobal() {
  try {
    const raw = localStorage.getItem('comptoir_historique_global')
    if (raw) historiqueGlobal.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function saveHistoriqueGlobal() {
  localStorage.setItem('comptoir_historique_global', JSON.stringify(historiqueGlobal.value))
}

function supprimerJournee(date: string, lieu: string) {
  historiqueGlobal.value = historiqueGlobal.value.filter(j => !(j.date === date && j.lieu === lieu))
  saveHistoriqueGlobal()
}

function viderHistoriqueGlobal() {
  historiqueGlobal.value = []
  saveHistoriqueGlobal()
}

function genererRecapPDF(journee: { date: string; lieu: string; recap: ReturnType<typeof buildRecap>; ventes: VenteJour[]; pertes: PerteJour[] }) {
  const r = journee.recap
  const dateStr = new Date(journee.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const ventesRows = journee.ventes.map(v => {
    const items = v.lignes.map(l => `${l.qty}x ${l.nom}${l.type !== 'vente' ? ' (Cadeau)' : ''}`).join(', ')
    return `<tr><td>${v.heure}</td><td>${v.client || '-'}</td><td>${items}</td><td>${v.paiement}</td><td style="text-align:right">${formatMoney(v.total)} &euro;</td></tr>`
  }).join('')

  const pertesRows = journee.pertes.map(p =>
    `<tr><td>${p.heure}</td><td>${p.quantite}x ${p.produit}</td><td>${p.note || '-'}</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recap ${journee.date}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #222; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .stat { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; }
  .stat .label { font-size: 12px; color: #888; }
  .stat .value { font-size: 20px; font-weight: 700; }
  .stat.gold .value { color: #AF8F3C; }
  .stat.green .value { color: #16a34a; }
  .stat.red .value { color: #dc2626; }
  .detail { font-size: 12px; color: #888; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #eee; }
  th { font-size: 11px; text-transform: uppercase; color: #888; background: #f9f9f9; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Le Geai - Recap de journee</h1>
<p class="sub">${dateStr} - ${journee.lieu}</p>

<div class="grid">
  <div class="stat"><div class="label">Ventes</div><div class="value">${r.nbVentes}</div></div>
  <div class="stat gold"><div class="label">Total encaisse</div><div class="value">${formatMoney(r.totalEncaisse)} &euro;</div>
    <div class="detail">Especes: ${formatMoney(r.totalEspeces)} &euro; | Carte: ${formatMoney(r.totalCarte)} &euro;${r.totalMixte > 0 ? ` | Mixte: ${formatMoney(r.totalMixte)} &euro;` : ''}</div>
  </div>
  <div class="stat green"><div class="label">Cadeaux offerts</div><div class="value">${r.nbCadeaux} article${r.nbCadeaux > 1 ? 's' : ''}</div></div>
  <div class="stat red"><div class="label">Pertes</div><div class="value">${r.nbPertes} article${r.nbPertes > 1 ? 's' : ''}</div></div>
</div>

${journee.ventes.length ? `<div class="section"><h2>Detail des ventes</h2>
<table><thead><tr><th>Heure</th><th>Client</th><th>Articles</th><th>Paiement</th><th style="text-align:right">Total</th></tr></thead>
<tbody>${ventesRows}</tbody></table></div>` : ''}

${journee.pertes.length ? `<div class="section"><h2>Detail des pertes</h2>
<table><thead><tr><th>Heure</th><th>Produit</th><th>Raison</th></tr></thead>
<tbody>${pertesRows}</tbody></table></div>` : ''}

<p style="text-align:center;color:#aaa;font-size:11px;margin-top:32px;">Document genere automatiquement - Le Geai</p>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }
}

function telechargerRecapPDF() {
  const today = new Date().toISOString().slice(0, 10)
  genererRecapPDF({
    date: today,
    lieu: lieuActuelNom.value,
    recap: recapJournee.value,
    ventes: ventesAujourdhui.value,
    pertes: pertesAujourdhui.value
  })
}

function validerJournee() {
  const today = new Date().toISOString().slice(0, 10)

  // Archiver dans l'historique global
  historiqueGlobal.value.unshift({
    date: today,
    lieu: lieuActuelNom.value,
    recap: { ...recapJournee.value },
    ventes: [...ventesAujourdhui.value],
    pertes: [...pertesAujourdhui.value]
  })
  saveHistoriqueGlobal()

  // Clear journee
  ventesAujourdhui.value = []
  pertesAujourdhui.value = []
  showRecap.value = false
}

// --- Modifier / supprimer ventes et pertes du jour ---
const showEditVente = ref(false)
const editVenteId = ref<string | null>(null)
const editClient = ref('')
const editPaiement = ref<'especes' | 'carte' | 'mixte'>('especes')

function ouvrirEditVente(v: VenteJour) {
  editVenteId.value = v.id
  editClient.value = v.client || ''
  editPaiement.value = v.paiement as 'especes' | 'carte' | 'mixte'
  showEditVente.value = true
}

function sauverEditVente() {
  const v = ventesAujourdhui.value.find(x => x.id === editVenteId.value)
  if (v) {
    v.client = editClient.value.trim() || null
    v.paiement = editPaiement.value
  }
  showEditVente.value = false
}

function supprimerVenteJour(id: string) {
  ventesAujourdhui.value = ventesAujourdhui.value.filter(v => v.id !== id)
}

function supprimerPerteJour(id: string) {
  pertesAujourdhui.value = pertesAujourdhui.value.filter(p => p.id !== id)
}

// --- Sync ---
const syncing = ref(false)
async function handleSync() {
  syncing.value = true
  await syncQueue()
  syncing.value = false
}

// --- Inventaire ---
function getStockLieuActuel(produitId: number, editionId?: number): number {
  if (!lieuActuel.value) return 0
  return getStockForLieu(produitId, lieuActuel.value, editionId)
}

async function handleSetInventaire(produitId: number, quantite: number, editionId?: number) {
  if (!lieuActuel.value) return
  if (online.value) {
    const { upsertStock } = useMateriel()
    await upsertStock(produitId, lieuActuel.value, Math.max(0, quantite), editionId || null)
    await loadData()
  } else {
    enqueue({ type: 'stock_set', data: { produit: produitId, lieu: lieuActuel.value, quantite: Math.max(0, quantite), edition: editionId || null } })
    const idx = stocks.value.findIndex(s => {
      const pid = typeof s.produit === 'object' ? (s.produit as any).id : s.produit
      const lid = typeof s.lieu === 'object' ? (s.lieu as any).id : s.lieu
      return pid === produitId && lid === lieuActuel.value && (editionId ? s.edition === editionId : !s.edition)
    })
    if (idx >= 0) stocks.value[idx].quantite = Math.max(0, quantite)
    else stocks.value.push({ id: 0, produit: produitId, edition: editionId || null, lieu: lieuActuel.value, quantite: Math.max(0, quantite) } as any)
  }
}

// --- Init ---
onMounted(() => {
  loadHistoriqueGlobal()
  loadJourData()
  if (loadSession()) { loadData(); startConnectivityCheck() }
})

function formatMoney(n: number) { return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const TYPE_COLORS: Record<LigneType, { bg: string; text: string; label: string }> = {
  vente: { bg: 'bg-[#AF8F3C]/10', text: 'text-[#AF8F3C]', label: 'Vente' },
  perte: { bg: 'bg-red-900/20', text: 'text-red-400', label: 'Perte' },
  cadeau: { bg: 'bg-emerald-900/20', text: 'text-emerald-400', label: 'Cadeau' }
}
</script>

<template>
  <div class="min-h-dvh bg-[#1a1a1a] text-stone-200" style="font-family: 'Crimson Pro', Georgia, serif;">

    <!-- ==================== PIN SCREEN ==================== -->
    <div v-if="!authenticated" class="flex items-center justify-center min-h-dvh px-4">
      <div class="text-center max-w-sm w-full">
        <p class="text-3xl font-bold text-[#AF8F3C] mb-2" style="font-family: 'UnifrakturCook', cursive;">G</p>
        <h1 class="text-xl font-semibold text-stone-300 mb-1">Comptoir</h1>
        <p class="text-sm text-stone-500 mb-8">Entrez le code PIN</p>
        <div class="flex justify-center gap-3 mb-6">
          <input
            v-for="i in 6" :key="i"
            :ref="el => { if (el) pinRefs[i-1] = el as HTMLInputElement }"
            type="tel" inputmode="numeric" maxlength="1" :value="pinDigits[i-1]"
            class="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-stone-900 outline-none transition-colors"
            :class="pinError ? 'border-red-500 text-red-400' : 'border-stone-700 text-stone-200 focus:border-[#AF8F3C]'"
            @input="onPinInput(i-1, $event)" @keydown="onPinKeydown(i-1, $event)"
          />
        </div>
        <p v-if="pinError" class="text-sm text-red-400 mb-4">Code incorrect</p>
        <div v-if="pinLoading" class="flex justify-center">
          <div class="size-6 border-2 border-[#AF8F3C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </div>

    <!-- ==================== MAIN INTERFACE ==================== -->
    <template v-else>
      <div class="flex flex-col h-dvh">
        <!-- ===== Header fixe ===== -->
        <header class="relative shrink-0 h-14 flex items-center px-3 bg-[#222] border-b border-stone-800">
          <!-- Gauche : toggle navbar -->
          <button class="size-10 rounded-lg flex items-center justify-center bg-stone-800 hover:bg-stone-700" :aria-expanded="navOpen" aria-label="Navigation" @click="navOpen = !navOpen">
            <UIcon :name="navOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'" class="size-5 text-stone-400" />
          </button>

          <!-- Centre : nom de la partie -->
          <div class="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center">
            <span class="text-sm font-semibold uppercase tracking-[0.3em] text-white select-none">Comptoir</span>
          </div>

          <div class="flex-1" />

          <!-- Droite : sync + statut + lieu -->
          <div class="flex items-center gap-2">
            <button v-if="queue.length" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-900/40 text-amber-400 text-xs font-medium" :disabled="!online || syncing" @click="handleSync">
              <UIcon :name="syncing ? 'i-lucide-loader-2' : 'i-lucide-upload'" :class="syncing ? 'animate-spin' : ''" class="size-3.5" />
              {{ queue.length }}
            </button>
            <!-- Selecteur de lieu (menu deroulant) - l'icone passe au vert quand connecte -->
            <div class="relative">
              <button class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700" @click="showLieuSelect = !showLieuSelect">
                <UIcon name="i-lucide-map-pin" class="size-4" :class="online ? 'text-emerald-500' : 'text-red-500'" :title="online ? 'En ligne' : 'Hors ligne'" />
                <span class="text-sm font-medium max-w-[35vw] truncate">{{ lieuActuelNom }}</span>
                <UIcon name="i-lucide-chevron-down" class="size-3.5 text-stone-500 transition-transform" :class="showLieuSelect ? 'rotate-180' : ''" />
              </button>
              <div v-if="showLieuSelect" class="fixed inset-0 z-40" @click="showLieuSelect = false" />
              <Transition enter-active-class="transition duration-150 ease-out" leave-active-class="transition duration-100 ease-in" enter-from-class="opacity-0 -translate-y-1" leave-to-class="opacity-0 -translate-y-1">
                <div v-if="showLieuSelect" class="absolute right-0 mt-2 w-56 z-50 bg-[#222] border border-stone-800 rounded-xl p-2 shadow-xl shadow-black/40 space-y-1">
                  <button v-for="l in lieux" :key="l.id"
                    class="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    :class="lieuActuel === l.id ? 'bg-[#AF8F3C]/20 text-[#AF8F3C]' : 'text-stone-300 hover:bg-stone-800'"
                    @click="setLieu(l.id); showLieuSelect = false"
                  >
                    <UIcon name="i-lucide-map-pin" class="size-4 shrink-0" /> {{ l.nom }}
                  </button>
                  <p v-if="!lieux.length" class="text-xs text-stone-600 px-3 py-2">Aucun lieu configure</p>
                </div>
              </Transition>
            </div>
          </div>
        </header>

        <!-- ===== Corps : la navbar pousse le contenu ===== -->
        <div class="flex flex-1 min-h-0">
          <!-- Navbar retractable -->
          <aside class="shrink-0 overflow-hidden border-r border-stone-800 bg-[#1e1e1e] transition-[width] duration-200 ease-out" :class="navOpen ? 'w-60' : 'w-0'">
            <div class="w-60 h-full flex flex-col p-3">
              <button v-for="item in [
                { key: 'vente', label: 'Vente', icon: 'i-lucide-shopping-cart' },
                { key: 'inventaire', label: 'Inventaire', icon: 'i-lucide-clipboard-list' },
                { key: 'historique', label: 'Historique du jour', icon: 'i-lucide-clock' }
              ]" :key="item.key"
                class="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors"
                :class="view === item.key ? 'bg-[#AF8F3C]/15 text-[#AF8F3C]' : 'text-stone-400 hover:bg-stone-800'"
                @click="view = item.key as any"
              >
                <UIcon :name="item.icon" class="size-5" /> {{ item.label }}
              </button>

              <div class="border-t border-stone-800 my-3" />
              <p class="text-[10px] text-stone-500 uppercase tracking-widest mb-2 px-3">Actions</p>
              <button class="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-stone-800 transition-colors" @click="openPerteModal">
                <UIcon name="i-lucide-alert-triangle" class="size-5" /> Enregistrer une perte
              </button>

              <div class="mt-auto pt-3 border-t border-stone-800">
                <button class="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-stone-800" @click="logout()">
                  <UIcon name="i-lucide-log-out" class="size-5" /> Deconnexion
                </button>
              </div>
            </div>
          </aside>

          <!-- Contenu (sous-pages) -->
          <main class="flex-1 min-h-0 overflow-y-auto">

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="size-8 border-2 border-[#AF8F3C] border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- ==================== VENTE ==================== -->
      <div v-else-if="view === 'vente'" class="flex flex-col lg:flex-row h-full">
        <!-- Produits grid -->
        <div class="flex-1 overflow-y-auto p-3">
          <!-- Mode selector + type filter -->
          <div class="flex items-center gap-2 mb-3">
            <div class="flex rounded-lg overflow-hidden border border-stone-700">
              <button v-for="m in (['vente', 'cadeau'] as LigneType[])" :key="m"
                class="px-3 py-1.5 text-xs font-semibold transition-colors"
                :class="addMode === m ? TYPE_COLORS[m].bg + ' ' + TYPE_COLORS[m].text : 'bg-stone-800 text-stone-500'"
                @click="addMode = m"
              >{{ TYPE_COLORS[m].label }}</button>
            </div>
            <div class="flex-1" />
            <div class="flex gap-1 overflow-x-auto scrollbar-none">
              <button class="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors" :class="filterType === 'all' ? 'bg-[#AF8F3C] text-white' : 'bg-stone-800 text-stone-400'" @click="filterType = 'all'">Tout</button>
              <button v-for="(config, key) in PRODUIT_TYPES" :key="key" class="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors" :class="filterType === key ? 'bg-[#AF8F3C] text-white' : 'bg-stone-800 text-stone-400'" @click="filterType = key">
                <UIcon :name="config.icon" class="size-3" /> {{ config.label }}
              </button>
            </div>
          </div>

          <!-- Product cards -->
          <template v-if="produitsGrouped">
            <div v-for="group in produitsGrouped" :key="group.key" class="mb-4">
              <div class="flex items-center gap-2 mb-2 px-1">
                <UIcon :name="group.icon" class="size-4 text-stone-500" />
                <h3 class="text-xs font-semibold text-stone-500 uppercase tracking-wider">{{ group.label }}</h3>
                <div class="flex-1 border-t border-stone-800" />
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <button
                  v-for="p in group.produits" :key="p.id"
                  class="flex flex-col items-start p-3 rounded-xl border active:scale-[0.97] transition-all text-left min-h-[80px]"
                  :class="addMode === 'vente' ? 'bg-stone-800/80 border-stone-700/50 hover:border-[#AF8F3C]/40' : 'bg-emerald-950/30 border-emerald-900/40 hover:border-emerald-700/60'"
                  @click="handleProductTap(p, addMode)"
                >
                  <div class="flex items-center gap-1.5 mb-1">
                    <UIcon :name="group.icon" class="size-3.5 text-stone-500 shrink-0" />
                    <p class="text-sm font-semibold text-stone-200 leading-tight">{{ p.nom }}</p>
                  </div>
                  <p v-if="p.sous_categorie" class="text-[10px] text-stone-500">{{ p.sous_categorie }}</p>
                  <div class="mt-auto flex items-center justify-between w-full pt-1">
                    <span v-if="addMode === 'vente'" class="text-sm font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(p.editions.length ? p.editions[0].prix_vente : p.prix_vente) }} &euro;</span>
                    <span v-else class="text-xs text-emerald-400">{{ TYPE_COLORS[addMode].label }}</span>
                    <span v-if="lieuActuel" class="text-[10px] text-stone-500 tabular-nums">
                      {{ p.editions.length ? p.editions.reduce((s: number, e: ProduitEdition) => s + getStockForLieu(Number(p.id), lieuActuel!, Number(e.id)), 0) : getStockForLieu(Number(p.id), lieuActuel!) }} dispo
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </template>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <button
              v-for="p in produitsFiltered" :key="p.id"
              class="flex flex-col items-start p-3 rounded-xl border active:scale-[0.97] transition-all text-left min-h-[80px]"
              :class="addMode === 'vente' ? 'bg-stone-800/80 border-stone-700/50 hover:border-[#AF8F3C]/40' : 'bg-emerald-950/30 border-emerald-900/40 hover:border-emerald-700/60'"
              @click="handleProductTap(p, addMode)"
            >
              <div class="flex items-center gap-1.5 mb-1">
                <UIcon :name="PRODUIT_TYPES[p.type_produit as keyof typeof PRODUIT_TYPES]?.icon || 'i-lucide-tag'" class="size-3.5 text-stone-500 shrink-0" />
                <p class="text-sm font-semibold text-stone-200 leading-tight">{{ p.nom }}</p>
              </div>
              <p v-if="p.sous_categorie" class="text-[10px] text-stone-500">{{ p.sous_categorie }}</p>
              <div class="mt-auto flex items-center justify-between w-full pt-1">
                <span v-if="addMode === 'vente'" class="text-sm font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(p.editions.length ? p.editions[0].prix_vente : p.prix_vente) }} &euro;</span>
                <span v-else class="text-xs text-emerald-400">{{ TYPE_COLORS[addMode].label }}</span>
                <span v-if="lieuActuel" class="text-[10px] text-stone-500 tabular-nums">
                  {{ p.editions.length ? p.editions.reduce((s: number, e: ProduitEdition) => s + getStockForLieu(Number(p.id), lieuActuel!, Number(e.id)), 0) : getStockForLieu(Number(p.id), lieuActuel!) }} dispo
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Panier -->
        <div class="w-full lg:w-96 shrink-0 bg-[#222] border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col max-h-[50vh] lg:max-h-none">
          <div class="px-4 py-3 border-b border-stone-800">
            <h2 class="text-sm font-semibold text-stone-400 uppercase tracking-wider">Panier</h2>
          </div>

          <div class="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            <p v-if="!panier.length" class="text-sm text-stone-600 text-center py-8">Vide</p>
            <div v-for="l in panier" :key="l.id" class="flex items-center gap-2 p-2 rounded-lg" :class="TYPE_COLORS[l.ligneType].bg">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="text-sm text-stone-200 truncate">{{ l.produit.nom }}</p>
                  <span v-if="l.ligneType !== 'vente'" class="text-[9px] font-bold px-1.5 py-0.5 rounded" :class="TYPE_COLORS[l.ligneType].text + ' ' + TYPE_COLORS[l.ligneType].bg">{{ TYPE_COLORS[l.ligneType].label }}</span>
                </div>
                <p v-if="l.edition" class="text-[10px] text-stone-500">{{ l.edition.nom_edition }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" class="size-7 rounded bg-stone-700 flex items-center justify-center text-stone-400" @click="l.quantite > 1 ? l.quantite-- : retirerDuPanier(l.id)">
                  <UIcon :name="l.quantite === 1 ? 'i-lucide-trash-2' : 'i-lucide-minus'" class="size-3" />
                </button>
                <span class="text-sm font-bold tabular-nums w-6 text-center">{{ l.quantite }}</span>
                <button type="button" class="size-7 rounded bg-stone-700 flex items-center justify-center text-stone-400" @click="l.quantite++">
                  <UIcon name="i-lucide-plus" class="size-3" />
                </button>
              </div>
              <span v-if="l.ligneType === 'vente'" class="text-sm font-bold text-[#AF8F3C] tabular-nums w-16 text-right">{{ formatMoney(ligneTotal(l)) }}</span>
              <span v-else class="text-xs w-16 text-right" :class="TYPE_COLORS[l.ligneType].text">0 &euro;</span>
            </div>
          </div>

          <!-- Bottom -->
          <div class="px-4 py-3 border-t border-stone-800 space-y-3">
            <input v-model="clientLabel" placeholder="Client (optionnel)" class="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C]" />

            <div v-if="panier.some(l => l.ligneType === 'vente')" class="flex items-center justify-between">
              <span class="text-xs text-stone-500">Remise globale</span>
              <div class="flex items-center gap-1">
                <input v-model.number="remiseGlobalePourcent" type="number" min="0" max="100" placeholder="0" class="w-14 px-2 py-1 rounded bg-stone-800 border border-stone-700 text-sm text-center text-stone-200 outline-none focus:border-[#AF8F3C]" />
                <span class="text-xs text-stone-500">%</span>
              </div>
            </div>

            <div class="flex items-center justify-between text-lg font-bold">
              <span class="text-stone-400">Total</span>
              <span class="text-[#AF8F3C] tabular-nums">{{ formatMoney(totalFinal) }} &euro;</span>
            </div>

            <button
              class="w-full py-3.5 rounded-xl text-base font-bold transition-all"
              :class="panier.length ? 'bg-[#AF8F3C] text-white active:scale-[0.98]' : 'bg-stone-800 text-stone-600 cursor-not-allowed'"
              :disabled="!panier.length"
              @click="openPayment"
            >Encaisser</button>
          </div>
        </div>
      </div>

      <!-- ==================== INVENTAIRE ==================== -->
      <div v-else-if="view === 'inventaire'" class="p-4 max-w-2xl mx-auto">
        <h2 class="text-lg font-semibold text-stone-300 mb-4">Inventaire - {{ lieuActuelNom }}</h2>
        <div class="space-y-2">
          <div v-for="p in produitsAvecEditions.filter(p => p.a_stock !== false)" :key="p.id">
            <template v-if="p.editions.length">
              <div v-for="e in p.editions" :key="e.id" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-800/60">
                <div class="flex-1">
                  <p class="text-sm font-medium text-stone-200">{{ p.nom }}</p>
                  <p class="text-[10px] text-stone-500">{{ e.nom_edition }}</p>
                </div>
                <input type="number" min="0" :value="getStockLieuActuel(Number(p.id), Number(e.id))" class="w-20 px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-center text-stone-200 font-bold tabular-nums outline-none focus:border-[#AF8F3C]" @change="handleSetInventaire(Number(p.id), Number(($event.target as HTMLInputElement).value), Number(e.id))" />
              </div>
            </template>
            <div v-else class="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-800/60">
              <div class="flex-1">
                <p class="text-sm font-medium text-stone-200">{{ p.nom }}</p>
                <p v-if="p.sous_categorie" class="text-[10px] text-stone-500">{{ p.sous_categorie }}</p>
              </div>
              <input type="number" min="0" :value="getStockLieuActuel(Number(p.id))" class="w-20 px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-sm text-center text-stone-200 font-bold tabular-nums outline-none focus:border-[#AF8F3C]" @change="handleSetInventaire(Number(p.id), Number(($event.target as HTMLInputElement).value))" />
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== HISTORIQUE ==================== -->
      <div v-else-if="view === 'historique'" class="p-4 max-w-2xl mx-auto">
        <!-- Bouton recap -->
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-stone-300">Historique du jour</h2>
          <button
            v-if="ventesAujourdhui.length || pertesAujourdhui.length"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#AF8F3C] text-white text-sm font-semibold active:scale-[0.97] transition-all"
            @click="showRecap = true"
          >
            <UIcon name="i-lucide-check-circle" class="size-4" /> Valider la journee
          </button>
        </div>

        <!-- Ventes -->
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-2">Ventes</h3>
        <div v-if="!ventesAujourdhui.length" class="text-center py-8 text-stone-600 text-sm">Aucune vente aujourd'hui</div>
        <div v-else class="space-y-2 mb-6">
          <div v-for="v in ventesAujourdhui" :key="v.id" class="px-4 py-3 rounded-xl bg-stone-800/60">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-500">{{ v.heure }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-400">{{ v.paiement }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(v.total) }} &euro;</span>
                <button class="size-6 rounded bg-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-200" @click="ouvrirEditVente(v)" title="Modifier">
                  <UIcon name="i-lucide-pencil" class="size-3" />
                </button>
                <button class="size-6 rounded bg-stone-700 flex items-center justify-center text-stone-500 hover:text-red-400" @click="supprimerVenteJour(v.id)" title="Supprimer">
                  <UIcon name="i-lucide-trash-2" class="size-3" />
                </button>
              </div>
            </div>
            <p v-if="v.client" class="text-xs text-stone-400 mb-1">{{ v.client }}</p>
            <div class="flex flex-wrap gap-1">
              <span v-for="(l, i) in v.lignes" :key="i" class="text-[10px] px-1.5 py-0.5 rounded" :class="l.type === 'vente' ? 'text-stone-500 bg-stone-800' : TYPE_COLORS[l.type].text + ' ' + TYPE_COLORS[l.type].bg">
                {{ l.qty }}x {{ l.nom }}{{ l.type !== 'vente' ? ' (' + TYPE_COLORS[l.type].label + ')' : '' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pertes -->
        <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-2">Pertes</h3>
        <div v-if="!pertesAujourdhui.length" class="text-center py-8 text-stone-600 text-sm">Aucune perte aujourd'hui</div>
        <div v-else class="space-y-2 mb-6">
          <div v-for="p in pertesAujourdhui" :key="p.id" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-950/20 border border-red-900/20">
            <UIcon name="i-lucide-alert-triangle" class="size-4 text-red-400 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-stone-200">{{ p.quantite }}x {{ p.produit }}</p>
              <p v-if="p.note" class="text-[10px] text-stone-500">{{ p.note }}</p>
            </div>
            <span class="text-xs text-stone-500 shrink-0">{{ p.heure }}</span>
            <button class="size-6 rounded bg-stone-700/50 flex items-center justify-center text-stone-500 hover:text-red-400 shrink-0" @click="supprimerPerteJour(p.id)" title="Supprimer">
              <UIcon name="i-lucide-trash-2" class="size-3" />
            </button>
          </div>
        </div>

        <!-- Historique global (journees validees) -->
        <div v-if="historiqueGlobal.length" class="mt-8 border-t border-stone-800 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-stone-400 uppercase tracking-wider">Journees precedentes</h3>
            <button class="text-[10px] text-red-500 hover:text-red-400" @click="viderHistoriqueGlobal">Tout effacer</button>
          </div>
          <div class="space-y-2">
            <div v-for="j in historiqueGlobal" :key="j.date + j.lieu" class="px-4 py-3 rounded-xl bg-stone-800/40 border border-stone-800">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-stone-300">{{ new Date(j.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) }}</span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-stone-700 text-stone-500">{{ j.lieu }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(j.recap.totalEncaisse) }} &euro;</span>
                  <button class="size-7 rounded-lg bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-200" @click="genererRecapPDF(j)" title="Telecharger le recap">
                    <UIcon name="i-lucide-download" class="size-3.5" />
                  </button>
                  <button class="size-7 rounded-lg bg-stone-700 flex items-center justify-center text-stone-400 hover:text-red-400" @click="supprimerJournee(j.date, j.lieu)" title="Supprimer">
                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-3 text-[10px] text-stone-500">
                <span>{{ j.recap.nbVentes }} vente{{ j.recap.nbVentes > 1 ? 's' : '' }}</span>
                <span v-if="j.recap.nbCadeaux">{{ j.recap.nbCadeaux }} cadeau{{ j.recap.nbCadeaux > 1 ? 'x' : '' }}</span>
                <span v-if="j.recap.nbPertes" class="text-red-500">{{ j.recap.nbPertes }} perte{{ j.recap.nbPertes > 1 ? 's' : '' }}</span>
                <span>Especes: {{ formatMoney(j.recap.totalEspeces) }} &euro;</span>
                <span>Carte: {{ formatMoney(j.recap.totalCarte) }} &euro;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
          </main>
        </div>
      </div>

      <!-- Edition picker modal -->
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="showEditionPicker && editionPickerProduit" class="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" @click="showEditionPicker = false">
            <div class="bg-[#222] rounded-2xl p-6 w-full max-w-sm space-y-2" @click.stop>
              <h3 class="text-base font-semibold text-stone-200 mb-3">{{ editionPickerProduit.nom }}</h3>
              <button v-for="e in editionPickerProduit.editions" :key="e.id"
                class="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-[0.97] transition-all"
                @click="handleEditionSelect(editionPickerProduit!, e)"
              >
                <span class="text-sm font-medium text-stone-200">{{ e.nom_edition }}</span>
                <span v-if="editionPickerType === 'vente'" class="text-sm font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(e.prix_vente) }} &euro;</span>
                <span v-else class="text-xs" :class="TYPE_COLORS[editionPickerType].text">{{ TYPE_COLORS[editionPickerType].label }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Perte modal -->
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="showPerteModal" class="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" @click="showPerteModal = false">
            <div class="bg-[#222] rounded-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col" @click.stop>
              <h3 class="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-alert-triangle" class="size-5" /> Enregistrer une perte
              </h3>

              <!-- Etape 1 : choix produit -->
              <template v-if="!perteProduit">
                <input
                  v-model="perteSearch" placeholder="Rechercher un produit..."
                  class="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-red-500 mb-3"
                />
                <div class="flex-1 overflow-y-auto space-y-1 min-h-0">
                  <button
                    v-for="p in perteProduitsFiltres" :key="p.id"
                    class="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-stone-800/60 hover:bg-stone-700 text-left transition-colors"
                    @click="selectPerteProduit(p)"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-stone-200 truncate">{{ p.nom }}</p>
                      <p v-if="p.sous_categorie" class="text-[10px] text-stone-500">{{ p.sous_categorie }}</p>
                    </div>
                    <span v-if="lieuActuel" class="text-[10px] text-stone-500 tabular-nums shrink-0">
                      {{ p.editions.length ? p.editions.reduce((s: number, e: ProduitEdition) => s + getStockForLieu(Number(p.id), lieuActuel!, Number(e.id)), 0) : getStockForLieu(Number(p.id), lieuActuel!) }} dispo
                    </span>
                  </button>
                </div>
              </template>

              <!-- Etape 2 : details perte -->
              <template v-else>
                <button class="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300 mb-3" @click="perteProduit = null">
                  <UIcon name="i-lucide-arrow-left" class="size-3" /> Changer de produit
                </button>

                <div class="px-3 py-2.5 rounded-lg bg-stone-800/60 mb-4">
                  <p class="text-sm font-medium text-stone-200">{{ perteProduit.nom }}</p>
                </div>

                <!-- Edition si livre -->
                <div v-if="perteProduit.type_produit === 'livre' && perteProduit.editions.length" class="mb-4">
                  <label class="text-xs text-stone-500 mb-1.5 block">Edition</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="e in perteProduit.editions" :key="e.id"
                      class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      :class="perteEdition?.id === e.id ? 'bg-red-900/40 text-red-400 border border-red-700/50' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'"
                      @click="perteEdition = e"
                    >{{ e.nom_edition }}</button>
                  </div>
                </div>

                <!-- Quantite -->
                <div class="mb-4">
                  <label class="text-xs text-stone-500 mb-1.5 block">Quantite</label>
                  <div class="flex items-center gap-2">
                    <button class="size-9 rounded-lg bg-stone-700 flex items-center justify-center text-stone-400" @click="perteQuantite = Math.max(1, perteQuantite - 1)">
                      <UIcon name="i-lucide-minus" class="size-4" />
                    </button>
                    <input v-model.number="perteQuantite" type="number" min="1" class="w-16 px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-center text-stone-200 font-bold tabular-nums outline-none focus:border-red-500" />
                    <button class="size-9 rounded-lg bg-stone-700 flex items-center justify-center text-stone-400" @click="perteQuantite++">
                      <UIcon name="i-lucide-plus" class="size-4" />
                    </button>
                  </div>
                </div>

                <!-- Note -->
                <div class="mb-4">
                  <label class="text-xs text-stone-500 mb-1.5 block">Raison</label>
                  <input
                    v-model="perteNote" placeholder="Ex: abime, casse, mouille..."
                    class="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-red-500"
                  />
                </div>

                <button
                  class="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  :class="perteProduit && perteQuantite > 0 && (perteProduit.type_produit !== 'livre' || !perteProduit.editions.length || perteEdition) ? 'bg-red-600 text-white active:scale-[0.98]' : 'bg-stone-800 text-stone-600 cursor-not-allowed'"
                  :disabled="!perteProduit || perteQuantite < 1 || (perteProduit.type_produit === 'livre' && perteProduit.editions.length > 0 && !perteEdition) || perteLoading"
                  @click="enregistrerPerte"
                >{{ perteLoading ? 'Enregistrement...' : 'Enregistrer la perte' }}</button>
              </template>

              <button class="w-full py-2 mt-2 text-sm text-stone-500 hover:text-stone-300" @click="showPerteModal = false">Annuler</button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Recap de fin de journee -->
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="showRecap" class="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" @click="showRecap = false">
            <div class="bg-[#222] rounded-2xl p-6 w-full max-w-sm space-y-4" @click.stop>
              <h3 class="text-lg font-semibold text-[#AF8F3C] text-center">Recap de la journee</h3>

              <div class="space-y-3">
                <!-- Nombre de ventes -->
                <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-stone-800/60">
                  <span class="text-sm text-stone-400">Nombre de ventes</span>
                  <span class="text-sm font-bold text-stone-200 tabular-nums">{{ recapJournee.nbVentes }}</span>
                </div>

                <!-- Total encaisse -->
                <div class="px-3 py-2.5 rounded-lg bg-[#AF8F3C]/10 border border-[#AF8F3C]/20">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-semibold text-[#AF8F3C]">Total encaisse</span>
                    <span class="text-lg font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(recapJournee.totalEncaisse) }} &euro;</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-stone-500">Especes</span>
                    <span class="text-stone-400 tabular-nums">{{ formatMoney(recapJournee.totalEspeces) }} &euro;</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-stone-500">Carte</span>
                    <span class="text-stone-400 tabular-nums">{{ formatMoney(recapJournee.totalCarte) }} &euro;</span>
                  </div>
                  <div v-if="recapJournee.totalMixte > 0" class="flex items-center justify-between text-xs">
                    <span class="text-stone-500">Mixte</span>
                    <span class="text-stone-400 tabular-nums">{{ formatMoney(recapJournee.totalMixte) }} &euro;</span>
                  </div>
                </div>

                <!-- Cadeaux -->
                <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/20">
                  <span class="text-sm text-emerald-400">Cadeaux offerts</span>
                  <span class="text-sm font-bold text-emerald-400 tabular-nums">{{ recapJournee.nbCadeaux }} article{{ recapJournee.nbCadeaux > 1 ? 's' : '' }}</span>
                </div>

                <!-- Pertes -->
                <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-950/20 border border-red-900/20">
                  <span class="text-sm text-red-400">Pertes</span>
                  <span class="text-sm font-bold text-red-400 tabular-nums">{{ recapJournee.nbPertes }} article{{ recapJournee.nbPertes > 1 ? 's' : '' }}</span>
                </div>
              </div>

              <p class="text-[10px] text-stone-600 text-center">Recap informatif. Aucune transaction creee dans le solde finance.</p>

              <div class="space-y-2">
                <button
                  class="w-full py-3 rounded-xl text-sm font-bold bg-stone-700 text-stone-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  @click="telechargerRecapPDF"
                >
                  <UIcon name="i-lucide-download" class="size-4" /> Telecharger le recap (PDF)
                </button>
                <button
                  class="w-full py-3 rounded-xl text-sm font-bold bg-[#AF8F3C] text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  @click="validerJournee"
                >
                  <UIcon name="i-lucide-check-circle" class="size-4" /> Valider et cloturer la journee
                </button>
              </div>

              <button class="w-full py-2 text-sm text-stone-500 hover:text-stone-300" @click="showRecap = false">Annuler</button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Edit vente modal -->
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="showEditVente" class="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" @click="showEditVente = false">
            <div class="bg-[#222] rounded-2xl p-6 w-full max-w-sm space-y-4" @click.stop>
              <h3 class="text-lg font-semibold text-stone-200">Modifier la vente</h3>

              <div>
                <label class="text-xs text-stone-500 mb-1.5 block">Client</label>
                <input v-model="editClient" placeholder="Client (optionnel)" class="w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-[#AF8F3C]" />
              </div>

              <div>
                <label class="text-xs text-stone-500 mb-1.5 block">Mode de paiement</label>
                <div class="flex gap-2">
                  <button v-for="m in (['especes', 'carte', 'mixte'] as const)" :key="m"
                    class="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    :class="editPaiement === m ? 'bg-[#AF8F3C] text-white' : 'bg-stone-800 text-stone-400'"
                    @click="editPaiement = m"
                  >{{ m === 'especes' ? 'Especes' : m === 'carte' ? 'Carte' : 'Mixte' }}</button>
                </div>
              </div>

              <button class="w-full py-3 rounded-xl text-sm font-bold bg-[#AF8F3C] text-white active:scale-[0.98] transition-all" @click="sauverEditVente">
                Enregistrer
              </button>
              <button class="w-full py-2 text-sm text-stone-500 hover:text-stone-300" @click="showEditVente = false">Annuler</button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Payment modal -->
      <Teleport to="body">
        <Transition enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-150" enter-from-class="opacity-0" leave-to-class="opacity-0">
          <div v-if="showPayment" class="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4" @click="showPayment = false">
            <div class="bg-[#222] rounded-2xl p-6 w-full max-w-sm space-y-5" @click.stop>
              <div class="text-center">
                <p class="text-xs text-stone-500 uppercase tracking-wider mb-1">Total a encaisser</p>
                <p class="text-3xl font-bold text-[#AF8F3C] tabular-nums">{{ formatMoney(totalFinal) }} &euro;</p>
              </div>

              <!-- Payment method -->
              <div class="flex gap-2">
                <button v-for="m in (['especes', 'carte', 'mixte'] as const)" :key="m"
                  class="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                  :class="paymentMethod === m ? 'bg-[#AF8F3C] text-white' : 'bg-stone-800 text-stone-400'"
                  @click="paymentMethod = m"
                >
                  <UIcon :name="m === 'especes' ? 'i-lucide-banknote' : m === 'carte' ? 'i-lucide-credit-card' : 'i-lucide-split'" class="size-5 mx-auto mb-1" />
                  {{ m === 'especes' ? 'Especes' : m === 'carte' ? 'Carte' : 'Mixte' }}
                </button>
              </div>

              <!-- Mixte details -->
              <div v-if="paymentMethod === 'mixte'" class="space-y-3">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-banknote" class="size-4 text-stone-400 shrink-0" />
                  <span class="text-sm text-stone-400 w-16">Especes</span>
                  <input v-model.number="paymentEspeces" type="number" min="0" step="0.01" class="flex-1 px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 text-right outline-none focus:border-[#AF8F3C] tabular-nums" />
                  <span class="text-xs text-stone-500">&euro;</span>
                </div>
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-credit-card" class="size-4 text-stone-400 shrink-0" />
                  <span class="text-sm text-stone-400 w-16">Carte</span>
                  <input v-model.number="paymentCarte" type="number" min="0" step="0.01" class="flex-1 px-3 py-2 rounded-lg bg-stone-800 border border-stone-700 text-sm text-stone-200 text-right outline-none focus:border-[#AF8F3C] tabular-nums" />
                  <span class="text-xs text-stone-500">&euro;</span>
                </div>
              </div>

              <button
                class="w-full py-3.5 rounded-xl text-base font-bold bg-emerald-600 text-white active:scale-[0.98] transition-all"
                :disabled="encaissementLoading"
                @click="confirmerEncaissement"
              >
                {{ encaissementLoading ? 'Enregistrement...' : 'Confirmer' }}
              </button>

              <button class="w-full py-2 text-sm text-stone-500 hover:text-stone-300" @click="showPayment = false">Annuler</button>
            </div>
          </div>
        </Transition>
      </Teleport>
    </template>
  </div>
</template>
