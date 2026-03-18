// Module-level dedup for refresh — safe since all intranet routes are ssr:false (CSR only)
let _refreshing: Promise<string | null> | null = null

export function useDirectusAuth() {
  const config = useRuntimeConfig()
  const at = useCookie<string | null>('da_at', { maxAge: 3600, sameSite: 'lax', path: '/' })
  const rt = useCookie<string | null>('da_rt', { maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', path: '/' })
  const exp = useCookie<number | null>('da_exp', { maxAge: 60 * 60 * 24 * 30, sameSite: 'lax', path: '/' })

  function _apiUrl(): string {
    if (import.meta.server) return config.directusUrl as string
    const pub = config.public.directusUrl as string
    return pub.startsWith('http') ? pub : `${window.location.origin}${pub}`
  }

  function _setTokens(data: { access_token: string; refresh_token: string; expires: number }) {
    at.value = data.access_token
    rt.value = data.refresh_token
    exp.value = Date.now() + data.expires
  }

  function clearTokens() {
    at.value = null
    rt.value = null
    exp.value = null
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

  return {
    getValidToken,
    login,
    logout,
    clearTokens,
    hasToken: computed(() => !!at.value)
  }
}
