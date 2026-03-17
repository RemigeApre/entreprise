<script setup lang="ts">
import { readItems } from '@directus/sdk'
import type { PlanningEntry, Prospect, ContactHistory } from '~/utils/types'
import { PLANNING_TYPES, PLANNING_STATUTS, PROSPECT_STATUTS, CONTACT_CANAUX, CONTACT_RESULTATS } from '~/utils/constants'
import { downloadCsv } from '~/utils/csv'

definePageMeta({ middleware: 'directeur' })

const { $directus } = useNuxtApp()
const { getActiveUsers, getAllUsers } = useUsers()
const { getEntries } = usePlanning()
const toast = useToast()

// ─── Users list ─────────────────────────────────────
const { data: allUsers } = useAsyncData('extract-users', getAllUsers)

const userOptions = computed(() => {
  if (!allUsers.value) return []
  return allUsers.value
    .filter(u => u.actif)
    .map(u => ({
      label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
      value: u.id
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

// ─── Presence extraction ─────────────────────────────────────
const presenceUser = ref<string>('')
const presenceDateDebut = ref('')
const presenceDateFin = ref('')
const presenceExporting = ref(false)

const presenceUserOptions = computed(() => [
  { label: 'Tous les utilisateurs', value: '' },
  ...userOptions.value
])

function initPresenceDates() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  presenceDateDebut.value = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  presenceDateFin.value = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
}

function getTypeLabelFr(entry: PlanningEntry): string {
  if (entry.type === 'travail' && entry.motif === 'Teletravail') return 'Teletravail'
  return (PLANNING_TYPES as any)[entry.type]?.label || entry.type
}

function getStatutLabelFr(statut: string): string {
  return (PLANNING_STATUTS as any)[statut]?.label || statut
}

function getUserName(entry: PlanningEntry): string {
  if (!entry.utilisateur || typeof entry.utilisateur === 'string') return ''
  return [entry.utilisateur.first_name, entry.utilisateur.last_name].filter(Boolean).join(' ')
}

function getPeriodeLabelFr(p: string): string {
  return p === 'matin' ? 'Matin' : p === 'apres_midi' ? 'Apres-midi' : p
}

async function exportPresence() {
  if (!presenceDateDebut.value || !presenceDateFin.value) {
    toast.add({ title: 'Selectionnez une periode', color: 'warning' })
    return
  }
  presenceExporting.value = true
  try {
    let entries: PlanningEntry[]

    if (presenceUser.value) {
      entries = await getEntries(presenceUser.value, presenceDateDebut.value, presenceDateFin.value)
    } else {
      // All users
      entries = await $directus.request(readItems('planning_entries', {
        filter: {
          date: { _gte: presenceDateDebut.value, _lte: presenceDateFin.value }
        },
        fields: [
          'id', 'date', 'periode', 'type', 'statut', 'motif', 'heures', 'commentaire',
          'utilisateur.id', 'utilisateur.first_name', 'utilisateur.last_name'
        ],
        sort: ['utilisateur', 'date', 'periode'],
        limit: -1
      })) as PlanningEntry[]
    }

    if (!entries.length) {
      toast.add({ title: 'Aucune donnee pour cette periode', color: 'warning' })
      return
    }

    const rows = entries.map(e => ({
      'Utilisateur': getUserName(e),
      'Date': e.date,
      'Periode': getPeriodeLabelFr(e.periode),
      'Type': getTypeLabelFr(e),
      'Statut': getStatutLabelFr(e.statut),
      'Heures': e.heures ?? 3.5,
      'Motif': e.motif || '',
      'Commentaire': e.commentaire || ''
    }))

    const who = presenceUser.value
      ? userOptions.value.find(u => u.value === presenceUser.value)?.label || 'utilisateur'
      : 'tous'
    const filename = `presence_${who}_${presenceDateDebut.value}_${presenceDateFin.value}.csv`.replace(/\s/g, '_')
    downloadCsv(rows, filename)
    toast.add({ title: `${entries.length} lignes exportees`, color: 'success' })
  } catch {
    toast.add({ title: 'Erreur lors de l\'export', color: 'error' })
  } finally {
    presenceExporting.value = false
  }
}

// ─── Prospection extraction ─────────────────────────────────────
const prospectionExporting = ref(false)
const prospectionWithContacts = ref(true)

async function exportProspection() {
  prospectionExporting.value = true
  try {
    const prospects = await $directus.request(readItems('prospects', {
      fields: [
        'id', 'nom_entreprise', 'ville', 'secteur', 'adresse', 'telephone', 'email',
        'emails_secondaires', 'site_web', 'contact_nom', 'notes', 'statut', 'nb_contacts',
        'prospecteur.id', 'prospecteur.first_name', 'prospecteur.last_name',
        'date_created', 'date_updated'
      ],
      sort: ['-date_created'],
      limit: -1
    })) as Prospect[]

    if (!prospects.length) {
      toast.add({ title: 'Aucun prospect', color: 'warning' })
      return
    }

    if (prospectionWithContacts.value) {
      // Export with contact history: one row per contact
      const allContacts = await $directus.request(readItems('contacts_history', {
        fields: [
          'id', 'prospect', 'canal', 'resultat', 'date_contact', 'notes',
          'contacte_par.id', 'contacte_par.first_name', 'contacte_par.last_name',
          'date_created'
        ],
        sort: ['prospect', '-date_contact'],
        limit: -1
      })) as ContactHistory[]

      const contactsByProspect = new Map<string, ContactHistory[]>()
      for (const c of allContacts) {
        const pid = typeof c.prospect === 'string' ? c.prospect : c.prospect?.id || ''
        if (!contactsByProspect.has(pid)) contactsByProspect.set(pid, [])
        contactsByProspect.get(pid)!.push(c)
      }

      const rows: Record<string, string | number | null>[] = []

      for (const p of prospects) {
        const prospecteurName = getProspecteurName(p)
        const statutLabel = (PROSPECT_STATUTS as any)[p.statut]?.label || p.statut
        const contacts = contactsByProspect.get(p.id) || []

        if (contacts.length === 0) {
          rows.push({
            'Entreprise': p.nom_entreprise,
            'Ville': p.ville,
            'Secteur': p.secteur || '',
            'Contact': p.contact_nom || '',
            'Telephone': p.telephone || '',
            'Email': p.email || '',
            'Site web': p.site_web || '',
            'Statut': statutLabel,
            'Nb contacts': p.nb_contacts || 0,
            'Prospecteur': prospecteurName,
            'Date creation': formatDateExport(p.date_created),
            'Date contact': '',
            'Canal': '',
            'Resultat': '',
            'Contacte par': '',
            'Notes contact': ''
          })
        } else {
          for (const c of contacts) {
            const contacteur = !c.contacte_par || typeof c.contacte_par === 'string'
              ? ''
              : [c.contacte_par.first_name, c.contacte_par.last_name].filter(Boolean).join(' ')
            rows.push({
              'Entreprise': p.nom_entreprise,
              'Ville': p.ville,
              'Secteur': p.secteur || '',
              'Contact': p.contact_nom || '',
              'Telephone': p.telephone || '',
              'Email': p.email || '',
              'Site web': p.site_web || '',
              'Statut': statutLabel,
              'Nb contacts': p.nb_contacts || 0,
              'Prospecteur': prospecteurName,
              'Date creation': formatDateExport(p.date_created),
              'Date contact': formatDateExport(c.date_contact),
              'Canal': (CONTACT_CANAUX as any)[c.canal]?.label || c.canal,
              'Resultat': (CONTACT_RESULTATS as any)[c.resultat]?.label || c.resultat,
              'Contacte par': contacteur,
              'Notes contact': c.notes || ''
            })
          }
        }
      }

      downloadCsv(rows, `prospection_detaillee_${today()}.csv`)
      toast.add({ title: `${rows.length} lignes exportees (${prospects.length} prospects)`, color: 'success' })
    } else {
      // Simple export: one row per prospect
      const rows = prospects.map(p => ({
        'Entreprise': p.nom_entreprise,
        'Ville': p.ville,
        'Secteur': p.secteur || '',
        'Adresse': p.adresse || '',
        'Contact': p.contact_nom || '',
        'Telephone': p.telephone || '',
        'Email': p.email || '',
        'Emails secondaires': p.emails_secondaires || '',
        'Site web': p.site_web || '',
        'Statut': (PROSPECT_STATUTS as any)[p.statut]?.label || p.statut,
        'Nb contacts': p.nb_contacts || 0,
        'Prospecteur': getProspecteurName(p),
        'Notes': p.notes || '',
        'Date creation': formatDateExport(p.date_created),
        'Derniere MAJ': formatDateExport(p.date_updated)
      }))

      downloadCsv(rows, `prospection_${today()}.csv`)
      toast.add({ title: `${rows.length} prospects exportes`, color: 'success' })
    }
  } catch {
    toast.add({ title: 'Erreur lors de l\'export', color: 'error' })
  } finally {
    prospectionExporting.value = false
  }
}

function getProspecteurName(p: Prospect): string {
  if (!p.prospecteur || typeof p.prospecteur === 'string') return ''
  return [p.prospecteur.first_name, p.prospecteur.last_name].filter(Boolean).join(' ')
}

function formatDateExport(d: string | null): string {
  if (!d) return ''
  return d.split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

onMounted(initPresenceDates)
</script>

<template>
  <div class="flex flex-col h-full">
    <PageHeader title="Extractions">
      <template #left>
        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" size="sm" to="/admin" />
      </template>
    </PageHeader>

    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="max-w-2xl mx-auto space-y-6">

        <!-- Extraction presence -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-calendar-check" class="size-5 text-emerald-600" />
              <h3 class="text-sm font-semibold text-stone-900">Presence</h3>
            </div>
            <p class="text-xs text-stone-400 mt-0.5">
              Exporter les jours de presence sur une periode (CSV)
            </p>
          </template>

          <div class="space-y-4">
            <UFormField label="Utilisateur">
              <USelect v-model="presenceUser" :items="presenceUserOptions" value-key="value" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Du">
                <UInput v-model="presenceDateDebut" type="date" />
              </UFormField>
              <UFormField label="Au">
                <UInput v-model="presenceDateFin" type="date" />
              </UFormField>
            </div>

            <div class="flex justify-end">
              <UButton
                label="Exporter CSV"
                icon="i-lucide-download"
                :loading="presenceExporting"
                @click="exportPresence"
              />
            </div>
          </div>
        </UCard>

        <!-- Extraction prospection -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-target" class="size-5 text-amber-600" />
              <h3 class="text-sm font-semibold text-stone-900">Prospection</h3>
            </div>
            <p class="text-xs text-stone-400 mt-0.5">
              Exporter tous les prospects et leur historique de contacts (CSV)
            </p>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <USwitch v-model="prospectionWithContacts" />
              <span class="text-sm text-stone-700">
                {{ prospectionWithContacts ? 'Export detaille (avec historique contacts)' : 'Export simple (1 ligne par prospect)' }}
              </span>
            </div>

            <div class="flex justify-end">
              <UButton
                label="Exporter CSV"
                icon="i-lucide-download"
                :loading="prospectionExporting"
                @click="exportProspection"
              />
            </div>
          </div>
        </UCard>

      </div>
    </div>
  </div>
</template>
