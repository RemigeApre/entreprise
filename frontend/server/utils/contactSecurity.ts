// Helpers de securite pour le formulaire de contact (porte depuis le site Astro
// Le Geai Informatique). Rate limiting en memoire, fingerprint, heuristiques
// anti-spam, verification d'origine. Aucune dependance externe.
//
// Note : sur une infra multi-instances, remplacer le Map par un store partage (Redis).
// Pour notre VPS single-instance, c'est suffisant.

import { createHash, randomBytes } from 'node:crypto'

type HeaderBag = Record<string, string | string[] | undefined>

const SECRET_SALT = process.env.SECURITY_SALT ?? randomBytes(16).toString('hex')

function h(headers: HeaderBag, name: string): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(v) ? v[0] : v
}

// ── Fingerprint ───────────────────────────────────────────────
// Hache IP + User-Agent + sel. Irreversible (SHA-256).
export function getClientFingerprint(headers: HeaderBag): string {
  const ip =
    h(headers, 'cf-connecting-ip')
    ?? h(headers, 'x-real-ip')
    ?? h(headers, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? 'unknown'
  const ua = h(headers, 'user-agent') ?? 'none'
  return createHash('sha256').update(`${ip}|${ua}|${SECRET_SALT}`).digest('hex').slice(0, 32)
}

// ── Rate limiter en memoire ───────────────────────────────────
interface Bucket { count: number; firstAt: number }

class InMemoryRateLimiter {
  private store = new Map<string, Bucket>()
  private lastSweep = Date.now()
  private sweepInterval = 5 * 60 * 1000

  hit(key: string, maxHits: number, windowMs: number): boolean {
    this.maybeSweep(windowMs * 2)
    const now = Date.now()
    const w = this.store.get(key)
    if (!w || now - w.firstAt > windowMs) {
      this.store.set(key, { count: 1, firstAt: now })
      return false
    }
    w.count += 1
    return w.count > maxHits
  }

  private maybeSweep(maxAge: number): void {
    const now = Date.now()
    if (now - this.lastSweep < this.sweepInterval) return
    this.lastSweep = now
    for (const [k, w] of this.store) {
      if (now - w.firstAt > maxAge) this.store.delete(k)
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter()

// ── Origin check ──────────────────────────────────────────────
// Verifie que le POST vient bien de notre origine (anti-CSRF, defense en profondeur).
export function checkOrigin(headers: HeaderBag, allowedHosts: string[]): boolean {
  const sourceUrl = h(headers, 'origin') ?? h(headers, 'referer')
  if (!sourceUrl) return false
  try {
    const u = new URL(sourceUrl)
    return allowedHosts.some((host) => u.host === host || u.host.endsWith('.' + host))
  } catch {
    return false
  }
}

export const DEFAULT_ALLOWED_HOSTS = [
  'localhost:3000',
  'localhost',
  '127.0.0.1:3000',
  '127.0.0.1',
  'legeai-editions.com',
  'www.legeai-editions.com',
]

// ── Heuristiques anti-spam ────────────────────────────────────
export function looksLikeSpam(text: string): boolean {
  if (!text) return false
  const t = text.toLowerCase()

  const urlMatches = t.match(/https?:\/\/|www\./g)
  if (urlMatches && urlMatches.length > 3) return true

  if (/\[\/?url|\[\/?link/i.test(text)) return true

  const spamWords = [
    'viagra', 'cialis', 'casino', 'porno',
    'crypto investment', 'bitcoin doubler', 'forex signal',
    'seo guarantee', 'guaranteed seo', 'seo services cheap',
    'buy backlinks', 'cheap backlinks',
    'work from home', 'make money fast',
  ]
  for (const w of spamWords) {
    if (t.includes(w)) return true
  }

  const nonAlpha = (text.match(/[^a-zA-Z0-9\s.,!?;:'"()\-éèàùâêîôûçëïüœæ\n]/g) ?? []).length
  if (text.length > 50 && nonAlpha / text.length > 0.4) return true

  return false
}

// ── Email validation ──────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  return /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,24}$/.test(email)
}
