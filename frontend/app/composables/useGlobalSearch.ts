import { readItems } from '@directus/sdk'
import type { Candidat, Prospect, Project, UserProfile } from '~/utils/types'

export interface SearchResult {
  type: 'membre' | 'projet' | 'prospect' | 'candidat' | 'wiki'
  id: string
  title: string
  subtitle?: string
  icon: string
  to: string
}

export function useGlobalSearch() {
  const { $directus } = useNuxtApp()
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const open = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function toggle() {
    open.value = !open.value
    if (!open.value) {
      query.value = ''
      results.value = []
    }
  }

  watch(query, (q) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!q || q.length < 2) {
      results.value = []
      return
    }
    debounceTimer = setTimeout(() => search(q), 250)
  })

  async function search(q: string) {
    loading.value = true
    const term = q.toLowerCase()

    try {
      const [membres, projets, prospects, candidats, wikis] = await Promise.allSettled([
        $directus.request(readItems('directus_users', {
          filter: {
            _or: [
              { first_name: { _icontains: term } },
              { last_name: { _icontains: term } },
              { email: { _icontains: term } }
            ]
          },
          fields: ['id', 'first_name', 'last_name', 'email'],
          limit: 5
        })),
        $directus.request(readItems('projects', {
          filter: { nom: { _icontains: term } },
          fields: ['id', 'nom', 'statut'],
          limit: 5
        })),
        $directus.request(readItems('prospects', {
          filter: {
            _or: [
              { nom_entreprise: { _icontains: term } },
              { contact_nom: { _icontains: term } },
              { ville: { _icontains: term } }
            ]
          },
          fields: ['id', 'nom_entreprise', 'ville'],
          limit: 5
        })),
        $directus.request(readItems('candidats', {
          filter: {
            _or: [
              { prenom: { _icontains: term } },
              { nom: { _icontains: term } },
              { email: { _icontains: term } }
            ]
          },
          fields: ['id', 'prenom', 'nom', 'statut'],
          limit: 5
        })),
        $directus.request(readItems('wiki_pages', {
          filter: { titre: { _icontains: term } },
          fields: ['id', 'titre', 'slug'],
          limit: 5
        }))
      ])

      const items: SearchResult[] = []

      if (membres.status === 'fulfilled') {
        for (const u of membres.value as UserProfile[]) {
          items.push({
            type: 'membre',
            id: u.id,
            title: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
            subtitle: u.email,
            icon: 'i-lucide-user',
            to: `/equipe/${u.id}`
          })
        }
      }

      if (projets.status === 'fulfilled') {
        for (const p of projets.value as Project[]) {
          items.push({
            type: 'projet',
            id: p.id,
            title: p.nom,
            subtitle: p.statut,
            icon: 'i-lucide-folder-kanban',
            to: `/projets/${p.id}`
          })
        }
      }

      if (prospects.status === 'fulfilled') {
        for (const p of prospects.value as Prospect[]) {
          items.push({
            type: 'prospect',
            id: p.id,
            title: p.nom_entreprise,
            subtitle: p.ville,
            icon: 'i-lucide-target',
            to: `/prospection/${p.id}`
          })
        }
      }

      if (candidats.status === 'fulfilled') {
        for (const c of candidats.value as Candidat[]) {
          items.push({
            type: 'candidat',
            id: c.id,
            title: `${c.prenom} ${c.nom}`,
            subtitle: c.statut,
            icon: 'i-lucide-user-search',
            to: `/candidats/${c.id}`
          })
        }
      }

      if (wikis.status === 'fulfilled') {
        for (const w of wikis.value as any[]) {
          items.push({
            type: 'wiki',
            id: w.id,
            title: w.titre,
            icon: 'i-lucide-book-open',
            to: `/wiki/${w.slug}`
          })
        }
      }

      results.value = items
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  return { query, results, loading, open, toggle }
}
