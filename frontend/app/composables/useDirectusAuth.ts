// Module-level refresh dedup — safe since intranet routes are all ssr:false (CSR only)
let _refreshing: Promise<string | null> | null = null

const STORAGE_KEY = '_da'

function readStorage(): { at: string; rt: string; exp: number } | null {
  if (!import.meta.client) return null
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

function writeStorage(data: { at: string; rt: string; exp: number } | null) {
  if (!import.meta.client) return
  try {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function useDirectusAuth() {
  const config = useRuntimeConfig()

  // useState is definitively cached by key — same ref everywhere in the app
  const at = useState<string | null>('_da_at', () => readStorage()?.at ?? null)
  const rt = useState<string | null>('_da_rt', () => readStorage()?.rt ?? null)
  const exp = useState<number | null>('_da_exp', () => readStorage()?.exp ?? null)

  function _apiUrl(): string {
    if (import.meta.server) return config.directusUrl as string
    const pub = config.public.directusUrl as string
    return pub.startsWith('http') ? pub : `${window.location.origin}${pub}`
  }

  function _setTokens(data: { access_token: string; refresh_token: string; expires: number }) {
    at.value = data.access_token
    rt.value = data.refresh_token
    exp.value = Date.now() + data.expires
    writeStorage({ at: at.value, rt: rt.value!, exp: exp.value! })
  }

  function clearTokens() {
    at.value = null
    rt.value = null
    exp.value = null
    writeStorage(null)
  }

  async function _doRefresh(): Promise<string | null> {
    if (_refreshing) return _refreshing
    if (!rt.value) { clearTokens(); return null }

    _refreshing = (async () => {
      try {
        const res = await globalThis.fetch(`${_apiUrl()}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt.value, mode: 'json' })
        })
        if (!res.ok) { clearTokens(); return null }
        const { data } = await res.json()
        _setTokens(data)
        return at.value
      } catch {
        clearTokens()
        return null
      } finally {
        _refreshing = null
      }
    })()

    return _refreshing
  }

  async function getValidToken(): Promise<string | null> {
    if (!at.value) return null
    const expired = !exp.value || Date.now() >= exp.value - 30_000
    if (expired) return _doRefresh()
    return at.value
  }

  async function login(email: string, password: string): Promise<void> {
    const res = await globalThis.fetch(`${_apiUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mode: 'json' })
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.errors?.[0]?.message || 'Identifiants incorrects')
    }
    const { data } = await res.json()
    _setTokens(data)
  }

  async function logout(): Promise<void> {
    const token = at.value
    const refresh = rt.value
    clearTokens()
    await globalThis.fetch(`${_apiUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ refresh_token: refresh, mode: 'json' })
    }).catch(() => {})
  }

  // Called once on client by auth.client.ts to bootstrap state from localStorage
  // when SSR hydration has set the state to null (e.g. landing page first load)
  function init() {
    if (!import.meta.client || at.value) return
    const stored = readStorage()
    if (stored) {
      at.value = stored.at
      rt.value = stored.rt
      exp.value = stored.exp
    }
  }

  return {
    getValidToken,
    login,
    logout,
    clearTokens,
    init,
    hasToken: computed(() => !!at.value)
  }
}
