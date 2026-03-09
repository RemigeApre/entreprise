#!/usr/bin/env node

/**
 * Migration runner pour Directus.
 * Execute les migrations incrementales qui n'ont pas encore ete appliquees.
 *
 * Les migrations sont stockees dans ./migrations/ avec le format:
 *   001_description.mjs
 *   002_description.mjs
 *
 * L'etat des migrations est stocke dans la collection `_migrations` de Directus.
 *
 * Usage:
 *   DIRECTUS_URL=http://localhost:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/migrate.mjs
 *   docker compose -f docker-compose.yml exec -e DIRECTUS_URL=http://localhost:8055 directus node /scripts/migrate.mjs
 */

import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL = process.env.DIRECTUS_URL || 'http://localhost:8060'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@legeai-editions.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_ME'

let token = ''

// ─── Helpers ────────────────────────────────────────────

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 200)}`)
  try { return JSON.parse(text).data } catch { return null }
}

async function safeApi(method, path, body, label) {
  try {
    const result = await api(method, path, body)
    console.log(`  ✓ ${label}`)
    return result
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('unique') || e.message.includes('DUPLICAT')) {
      console.log(`  ⊘ ${label} (existe deja)`)
      return null
    }
    console.log(`  ✗ ${label}: ${e.message.substring(0, 150)}`)
    return null
  }
}

// ─── Auth ────────────────────────────────────────────

async function authenticate() {
  const data = await api('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  token = data.access_token
  console.log('✓ Authentifie\n')
}

// ─── Migration tracking ────────────────────────────────

async function ensureMigrationsCollection() {
  try {
    await api('GET', '/items/_migrations?limit=0')
  } catch {
    // Collection doesn't exist, create it
    await safeApi('POST', '/collections', {
      collection: '_migrations',
      meta: { hidden: true, icon: 'history', note: 'Migration tracking - ne pas modifier' },
      schema: {}
    }, 'Collection _migrations')

    await safeApi('POST', '/fields/_migrations', {
      field: 'name',
      type: 'string',
      schema: { is_nullable: false, is_unique: true },
      meta: { interface: 'input', width: 'full' }
    }, 'Champ _migrations.name')

    await safeApi('POST', '/fields/_migrations', {
      field: 'applied_at',
      type: 'timestamp',
      schema: { is_nullable: false },
      meta: { interface: 'datetime', width: 'half' }
    }, 'Champ _migrations.applied_at')
  }
}

async function getAppliedMigrations() {
  try {
    const items = await api('GET', '/items/_migrations?fields=name&limit=-1')
    return new Set((items || []).map(m => m.name))
  } catch {
    return new Set()
  }
}

async function markMigrationApplied(name) {
  await api('POST', '/items/_migrations', {
    name,
    applied_at: new Date().toISOString()
  })
}

// ─── Runner ────────────────────────────────────────────

async function run() {
  console.log('🔄 Migration Directus\n')

  await authenticate()
  await ensureMigrationsCollection()

  const applied = await getAppliedMigrations()
  console.log(`Migrations deja appliquees: ${applied.size}\n`)

  // List migration files
  const migrationsDir = join(__dirname, 'migrations')
  let files
  try {
    files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.mjs'))
      .sort()
  } catch {
    console.log('Aucun dossier migrations/ trouve.')
    return
  }

  const pending = files.filter(f => !applied.has(f.replace('.mjs', '')))

  if (!pending.length) {
    console.log('✓ Aucune migration en attente.\n')
    return
  }

  console.log(`${pending.length} migration(s) en attente:\n`)

  for (const file of pending) {
    const name = file.replace('.mjs', '')
    console.log(`── ${name} ──`)

    try {
      const mod = await import(join(migrationsDir, file))
      await mod.default({ api, safeApi })
      await markMigrationApplied(name)
      console.log(`✓ ${name} appliquee\n`)
    } catch (e) {
      console.error(`✗ ${name} echouee: ${e.message}`)
      console.error('Arret des migrations.\n')
      process.exit(1)
    }
  }

  console.log('✓ Toutes les migrations ont ete appliquees.\n')
}

run().catch(e => {
  console.error('Erreur fatale:', e.message)
  process.exit(1)
})
