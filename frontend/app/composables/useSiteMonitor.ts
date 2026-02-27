import { readItems, createItem, deleteItem } from '@directus/sdk'
import type { MonitoredSite, MonitoredSiteUser } from '~/utils/types'

export interface SiteStatus {
  up: boolean
  statusCode: number
  responseTime: number
  error?: 'timeout' | 'network'
}

export function useSiteMonitor() {
  const { $directus } = useNuxtApp()
  const { user, isDirecteur } = useAuth()

  const userSites = useState<MonitoredSite[]>('user-monitored-sites', () => [])
  const sitesLoaded = useState<boolean>('user-monitored-sites-loaded', () => false)

  const hasSites = computed(() => userSites.value.length > 0)

  async function loadUserSites() {
    if (!user.value) return
    try {
      if (isDirecteur.value) {
        // Admins see all active sites
        const allSites = await $directus.request(readItems('monitored_sites', {
          filter: { actif: { _eq: true } },
          fields: ['id', 'nom', 'url', 'actif'],
          sort: ['nom'],
          limit: -1
        }))
        // Deduplicate by URL (keep first occurrence)
        const seen = new Set<string>()
        const unique: MonitoredSite[] = []
        for (const site of allSites as MonitoredSite[]) {
          if (!seen.has(site.url)) {
            seen.add(site.url)
            unique.push(site)
          }
        }
        userSites.value = unique
      } else {
        // Non-admins: only see sites they're assigned to
        const junctionEntries = await $directus.request(readItems('monitored_sites_users', {
          filter: {
            utilisateur: { _eq: user.value.id }
          },
          fields: [
            'id',
            'monitored_site.id',
            'monitored_site.nom',
            'monitored_site.url',
            'monitored_site.actif'
          ],
          limit: -1
        }))

        const sites: MonitoredSite[] = []
        for (const entry of junctionEntries as any[]) {
          if (entry.monitored_site && typeof entry.monitored_site === 'object' && entry.monitored_site.actif) {
            sites.push(entry.monitored_site as MonitoredSite)
          }
        }
        userSites.value = sites
      }
      sitesLoaded.value = true
    } catch {
      userSites.value = []
      sitesLoaded.value = true
    }
  }

  async function checkSiteStatus(url: string): Promise<SiteStatus> {
    try {
      const data = await $fetch<SiteStatus>('/_check/site-status', {
        params: { url }
      })
      return data
    } catch {
      return { up: false, statusCode: 0, responseTime: 0, error: 'network' }
    }
  }

  // --- Admin: manage site-user assignments ---

  async function getSiteUsers(siteId: string): Promise<MonitoredSiteUser[]> {
    const entries = await $directus.request(readItems('monitored_sites_users', {
      filter: { monitored_site: { _eq: siteId } },
      fields: [
        'id',
        'monitored_site',
        'utilisateur.id',
        'utilisateur.first_name',
        'utilisateur.last_name',
        'utilisateur.email'
      ],
      limit: -1
    }))
    return entries as unknown as MonitoredSiteUser[]
  }

  async function addSiteUser(siteId: string, userId: string) {
    return await $directus.request(createItem('monitored_sites_users', {
      monitored_site: siteId,
      utilisateur: userId
    }))
  }

  async function removeSiteUser(junctionId: number) {
    await $directus.request(deleteItem('monitored_sites_users', String(junctionId)))
  }

  // Auto-load on first client-side call if not already loaded
  if (import.meta.client && !sitesLoaded.value && user.value) {
    loadUserSites()
  }

  return {
    userSites, hasSites, sitesLoaded, loadUserSites, checkSiteStatus,
    getSiteUsers, addSiteUser, removeSiteUser
  }
}
