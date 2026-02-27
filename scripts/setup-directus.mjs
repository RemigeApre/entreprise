#!/usr/bin/env node

/**
 * Script de setup Directus pour l'intranet LeGeai.
 * Cree le schema (collections, champs, relations), les roles,
 * les permissions, les donnees de seed et les utilisateurs de test.
 *
 * Usage:
 *   Dev:  node scripts/setup-directus.mjs
 *   Prod: docker compose -f docker-compose.yml exec directus npx -- (or use curl method below)
 *         OR: DIRECTUS_URL=http://localhost:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/setup-directus.mjs
 */

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
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.substring(0, 200)}`)
  }
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

async function waitForDirectus() {
  console.log('⏳ Attente de Directus...')
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/server/ping`)
      if (res.ok) {
        console.log('✓ Directus est pret\n')
        return
      }
    } catch {}
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error('Directus n\'a pas demarre a temps (2min)')
}

// ─── Step 1: Authenticate ────────────────────────────────

async function authenticate() {
  console.log('🔑 Authentification...')
  const data = await api('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  })
  token = data.access_token
  console.log('  ✓ Connecte en tant qu\'admin\n')
}

// ─── Step 2: Create Roles ────────────────────────────────

async function createRoles() {
  console.log('👥 Creation des roles...')

  const roleDefs = [
    { name: 'Directeur', icon: 'shield', admin_access: true, app_access: true, description: 'Directeur - Acces total' },
    { name: 'Employe', icon: 'person', admin_access: false, app_access: true, description: 'Employe standard' },
    { name: 'Freelance', icon: 'work', admin_access: false, app_access: true, description: 'Freelance externe' },
    { name: 'Alternant', icon: 'school', admin_access: false, app_access: true, description: 'Alternant' },
    { name: 'Stagiaire', icon: 'pending_actions', admin_access: false, app_access: true, description: 'Stagiaire' }
  ]

  const roleIds = {}
  for (const def of roleDefs) {
    const result = await safeApi('POST', '/roles', def, `Role "${def.name}"`)
    if (result) roleIds[def.name] = result.id
  }

  // Fetch all roles to get IDs of already-existing ones
  const allRoles = await api('GET', '/roles')
  for (const role of allRoles) {
    if (!roleIds[role.name]) roleIds[role.name] = role.id
  }

  console.log('')
  return roleIds
}

// ─── Step 3: Extend directus_users ──────────────────────

async function extendDirectusUsers() {
  console.log('👤 Extension de directus_users...')

  // Group alias fields (visual groups in Directus admin)
  const groups = [
    {
      field: 'contrat_group',
      type: 'alias',
      meta: { interface: 'group-detail', special: ['alias', 'no-data', 'group'], sort: 99, options: { headerIcon: 'badge', headerColor: '#3B82F6' } }
    },
    {
      field: 'coordonnees_group',
      type: 'alias',
      meta: { interface: 'group-detail', special: ['alias', 'no-data', 'group'], sort: 105, options: { headerIcon: 'contact_phone', headerColor: '#10B981' } }
    }
  ]

  for (const g of groups) {
    await safeApi('POST', '/fields/directus_users', g, `Groupe "${g.field}"`)
  }

  const fields = [
    {
      field: 'date_debut_contrat',
      type: 'date',
      schema: { is_nullable: true },
      meta: { interface: 'datetime', display: 'datetime', width: 'half', sort: 100, group: 'contrat_group', note: 'Date de debut de contrat' }
    },
    {
      field: 'date_fin_contrat',
      type: 'date',
      schema: { is_nullable: true },
      meta: { interface: 'datetime', display: 'datetime', width: 'half', sort: 101, group: 'contrat_group', note: 'Date de fin de contrat' }
    },
    {
      field: 'date_fin_periode_essai',
      type: 'date',
      schema: { is_nullable: true },
      meta: { interface: 'datetime', display: 'datetime', width: 'half', sort: 102, group: 'contrat_group', note: 'Date de fin de periode d\'essai' }
    },
    {
      field: 'actif',
      type: 'boolean',
      schema: { is_nullable: false, default_value: true },
      meta: { interface: 'boolean', display: 'boolean', width: 'half', sort: 103, group: 'contrat_group', special: ['cast-boolean'] }
    },
    {
      field: 'type_contrat',
      type: 'string',
      schema: { is_nullable: true },
      meta: {
        interface: 'select-dropdown',
        display: 'labels',
        width: 'half',
        sort: 104,
        group: 'contrat_group',
        options: {
          choices: [
            { text: 'CDI', value: 'CDI' },
            { text: 'CDD', value: 'CDD' },
            { text: 'Freelance', value: 'Freelance' },
            { text: 'Alternance', value: 'Alternance' },
            { text: 'Stage', value: 'Stage' }
          ]
        }
      }
    },
    {
      field: 'telephone',
      type: 'string',
      schema: { is_nullable: true },
      meta: { interface: 'input', display: 'raw', width: 'half', sort: 106, group: 'coordonnees_group', note: 'Numero de telephone' }
    },
    {
      field: 'linkedin',
      type: 'string',
      schema: { is_nullable: true },
      meta: { interface: 'input', display: 'raw', width: 'half', sort: 107, group: 'coordonnees_group', note: 'URL du profil LinkedIn' }
    },
    {
      field: 'localisation',
      type: 'string',
      schema: { is_nullable: true },
      meta: { interface: 'input', display: 'raw', width: 'half', sort: 108, group: 'coordonnees_group', note: 'Ville / lieu de travail' }
    },
    {
      field: 'bio',
      type: 'text',
      schema: { is_nullable: true },
      meta: { interface: 'input-multiline', display: 'raw', width: 'full', sort: 109, group: 'coordonnees_group', note: 'Courte presentation' }
    }
  ]

  for (const f of fields) {
    await safeApi('POST', '/fields/directus_users', f, `Champ "${f.field}"`)
  }
  console.log('')
}

// ─── Step 4: Create Collections ─────────────────────────

function systemFields() {
  return [
    { field: 'date_created', type: 'timestamp', schema: {}, meta: { special: ['date-created'], interface: 'datetime', display: 'datetime', readonly: true, hidden: true, width: 'half' } },
    { field: 'user_created', type: 'uuid', schema: {}, meta: { special: ['user-created'], interface: 'select-dropdown-m2o', display: 'user', readonly: true, hidden: true, width: 'half' } },
    { field: 'date_updated', type: 'timestamp', schema: {}, meta: { special: ['date-updated'], interface: 'datetime', display: 'datetime', readonly: true, hidden: true, width: 'half' } },
    { field: 'user_updated', type: 'uuid', schema: {}, meta: { special: ['user-updated'], interface: 'select-dropdown-m2o', display: 'user', readonly: true, hidden: true, width: 'half' } }
  ]
}

function uuidPK() {
  return {
    field: 'id',
    type: 'uuid',
    schema: { is_primary_key: true, has_auto_increment: false },
    meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] }
  }
}

function autoPK() {
  return {
    field: 'id',
    type: 'integer',
    schema: { is_primary_key: true, has_auto_increment: true },
    meta: { hidden: true, readonly: true, interface: 'input' }
  }
}

function dropdown(field, choices, opts = {}) {
  return {
    field,
    type: 'string',
    schema: { is_nullable: opts.required ? false : true, ...(opts.default_value ? { default_value: opts.default_value } : {}) },
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      ...(opts.required && { required: true }),
      ...(opts.width && { width: opts.width }),
      options: {
        choices: choices.map(c => typeof c === 'string' ? { text: c, value: c } : c)
      }
    }
  }
}

async function createCollections() {
  console.log('📦 Creation des collections...')

  // ── categories ──
  await safeApi('POST', '/collections', {
    collection: 'categories',
    schema: {},
    meta: { icon: 'category', note: 'Categories d\'activite', sort: 1 },
    fields: [
      uuidPK(),
      { field: 'nom', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, width: 'half', sort: 1 } },
      { field: 'description', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', width: 'full', sort: 2 } },
      { field: 'couleur', type: 'string', schema: { is_nullable: true }, meta: { interface: 'select-color', display: 'color', width: 'half', sort: 3 } },
      ...systemFields()
    ]
  }, 'Collection "categories"')

  // ── planning_entries ──
  await safeApi('POST', '/collections', {
    collection: 'planning_entries',
    schema: {},
    meta: { icon: 'calendar_month', note: 'Entrees du planning (demi-journees)', sort: 2 },
    fields: [
      uuidPK(),
      { field: 'date', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', display: 'datetime', required: true, width: 'half', sort: 2 } },
      dropdown('periode', [
        { text: 'Matin', value: 'matin' },
        { text: 'Apres-midi', value: 'apres_midi' }
      ], { required: true, width: 'half' }),
      dropdown('type', [
        { text: 'Travail', value: 'travail' },
        { text: 'Conge', value: 'conge' },
        { text: 'Ecole', value: 'ecole' },
        { text: 'Absent', value: 'absent' },
        { text: 'Ferie', value: 'ferie' }
      ], { required: true, width: 'half' }),
      dropdown('statut', [
        { text: 'Valide', value: 'valide' },
        { text: 'En attente', value: 'en_attente' },
        { text: 'Refuse', value: 'refuse' }
      ], { required: true, default_value: 'valide', width: 'half' }),
      { field: 'motif', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 6 } },
      { field: 'heures', type: 'float', schema: { is_nullable: true }, meta: { interface: 'input', sort: 7, width: 'half' } },
      { field: 'commentaire', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 8 } },
      { field: 'date_validation', type: 'timestamp', schema: { is_nullable: true }, meta: { interface: 'datetime', display: 'datetime', sort: 10, width: 'half', readonly: true } },
      ...systemFields()
    ]
  }, 'Collection "planning_entries"')

  // ── conges_requests ──
  await safeApi('POST', '/collections', {
    collection: 'conges_requests',
    schema: {},
    meta: { icon: 'beach_access', note: 'Demandes de conges', sort: 3 },
    fields: [
      uuidPK(),
      { field: 'date_debut', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, width: 'half', sort: 2 } },
      { field: 'date_fin', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, width: 'half', sort: 3 } },
      { field: 'motif', type: 'text', schema: { is_nullable: false }, meta: { interface: 'input-multiline', required: true, sort: 4 } },
      dropdown('type_conge', [
        { text: 'Conge paye', value: 'conge_paye' },
        { text: 'RTT', value: 'rtt' },
        { text: 'Maladie', value: 'maladie' },
        { text: 'Sans solde', value: 'sans_solde' },
        { text: 'Autre', value: 'autre' }
      ], { required: true, width: 'half' }),
      dropdown('statut', [
        { text: 'En attente', value: 'en_attente' },
        { text: 'Approuve', value: 'approuve' },
        { text: 'Refuse', value: 'refuse' }
      ], { required: true, default_value: 'en_attente', width: 'half' }),
      { field: 'reponse_commentaire', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 7 } },
      { field: 'date_traitement', type: 'timestamp', schema: { is_nullable: true }, meta: { interface: 'datetime', sort: 9, readonly: true } },
      ...systemFields()
    ]
  }, 'Collection "conges_requests"')

  // ── prospects ──
  await safeApi('POST', '/collections', {
    collection: 'prospects',
    schema: {},
    meta: { icon: 'storefront', note: 'Prospection commerciale', sort: 4 },
    fields: [
      uuidPK(),
      { field: 'nom_entreprise', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 1 } },
      { field: 'secteur', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 2 } },
      { field: 'adresse', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 3 } },
      { field: 'telephone', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 4 } },
      { field: 'email', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 5 } },
      { field: 'site_web', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', sort: 6 } },
      { field: 'date_premier_contact', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, width: 'half', sort: 7 } },
      { field: 'notes', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-rich-text-html', sort: 8 } },
      dropdown('statut', [
        { text: 'Nouveau', value: 'nouveau' },
        { text: 'En cours', value: 'en_cours' },
        { text: 'Converti', value: 'converti' },
        { text: 'Perdu', value: 'perdu' },
        { text: 'En pause', value: 'en_pause' }
      ], { required: true, default_value: 'nouveau', width: 'half' }),
      ...systemFields()
    ]
  }, 'Collection "prospects"')

  // ── contacts_history ──
  await safeApi('POST', '/collections', {
    collection: 'contacts_history',
    schema: {},
    meta: { icon: 'history', note: 'Historique des prises de contact', sort: 5 },
    fields: [
      uuidPK(),
      dropdown('canal', [
        { text: 'Email', value: 'email' },
        { text: 'Telephone', value: 'telephone' },
        { text: 'LinkedIn', value: 'linkedin' },
        { text: 'En personne', value: 'en_personne' },
        { text: 'Autre', value: 'autre' }
      ], { required: true, width: 'half' }),
      { field: 'date_contact', type: 'timestamp', schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, width: 'half', sort: 3 } },
      { field: 'notes', type: 'text', schema: { is_nullable: false }, meta: { interface: 'input-rich-text-html', required: true, sort: 4 } },
      ...systemFields()
    ]
  }, 'Collection "contacts_history"')

  // ── projects ──
  await safeApi('POST', '/collections', {
    collection: 'projects',
    schema: {},
    meta: { icon: 'folder', note: 'Projets', sort: 6 },
    fields: [
      uuidPK(),
      { field: 'nom', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 1 } },
      { field: 'description', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-rich-text-html', sort: 2 } },
      dropdown('statut', [
        { text: 'Brouillon', value: 'brouillon' },
        { text: 'En cours', value: 'en_cours' },
        { text: 'En pause', value: 'en_pause' },
        { text: 'Termine', value: 'termine' },
        { text: 'Annule', value: 'annule' }
      ], { required: true, default_value: 'brouillon', width: 'half' }),
      { field: 'date_debut', type: 'date', schema: { is_nullable: true }, meta: { interface: 'datetime', width: 'half', sort: 4 } },
      { field: 'date_fin', type: 'date', schema: { is_nullable: true }, meta: { interface: 'datetime', width: 'half', sort: 5 } },
      { field: 'budget', type: 'float', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 6 } },
      ...systemFields()
    ]
  }, 'Collection "projects"')

  // ── projects_members (junction) ──
  await safeApi('POST', '/collections', {
    collection: 'projects_members',
    schema: {},
    meta: { icon: 'group', note: 'Membres des projets', sort: 7, hidden: true },
    fields: [
      autoPK(),
      { field: 'role_projet', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', sort: 3, note: 'Ex: Chef de projet, Dev...' } }
    ]
  }, 'Collection "projects_members"')

  // ── project_tasks ──
  await safeApi('POST', '/collections', {
    collection: 'project_tasks',
    schema: {},
    meta: { icon: 'task_alt', note: 'Taches de projets', sort: 8 },
    fields: [
      uuidPK(),
      { field: 'titre', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 2 } },
      { field: 'description', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 3 } },
      dropdown('statut', [
        { text: 'A faire', value: 'a_faire' },
        { text: 'En cours', value: 'en_cours' },
        { text: 'Termine', value: 'termine' }
      ], { required: true, default_value: 'a_faire', width: 'half' }),
      dropdown('priorite', [
        { text: 'Basse', value: 'basse' },
        { text: 'Normale', value: 'normale' },
        { text: 'Haute', value: 'haute' },
        { text: 'Urgente', value: 'urgente' }
      ], { width: 'half' }),
      { field: 'date_echeance', type: 'date', schema: { is_nullable: true }, meta: { interface: 'datetime', width: 'half', sort: 6 } },
      { field: 'ordre', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 7, hidden: true } },
      ...systemFields()
    ]
  }, 'Collection "project_tasks"')

  // ── project_files (junction) ──
  await safeApi('POST', '/collections', {
    collection: 'project_files',
    schema: {},
    meta: { icon: 'attach_file', note: 'Fichiers de projets', sort: 9, hidden: true },
    fields: [
      autoPK(),
      { field: 'description', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', sort: 3 } }
    ]
  }, 'Collection "project_files"')

  // ── notifications ──
  await safeApi('POST', '/collections', {
    collection: 'notifications',
    schema: {},
    meta: { icon: 'notifications', note: 'Notifications utilisateurs', sort: 11 },
    fields: [
      uuidPK(),
      { field: 'message', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 2 } },
      dropdown('type', [
        { text: 'Planning modifie', value: 'planning_modifie' },
        { text: 'Statut conge', value: 'conge_statut' },
        { text: 'Information', value: 'info' }
      ], { required: true, width: 'half' }),
      { field: 'lu', type: 'boolean', schema: { is_nullable: false, default_value: false }, meta: { interface: 'boolean', display: 'boolean', width: 'half', sort: 4, special: ['cast-boolean'] } },
      { field: 'lien', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', sort: 5 } },
      ...systemFields()
    ]
  }, 'Collection "notifications"')

  // ── wiki_pages ──
  await safeApi('POST', '/collections', {
    collection: 'wiki_pages',
    schema: {},
    meta: { icon: 'menu_book', note: 'Pages du wiki interne', sort: 12 },
    fields: [
      uuidPK(),
      { field: 'titre', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 1 } },
      { field: 'slug', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 2, note: 'Identifiant URL (ex: reglement)' } },
      { field: 'contenu', type: 'text', schema: { is_nullable: false }, meta: { interface: 'input-rich-text-html', required: true, sort: 3 } },
      { field: 'icone', type: 'string', schema: { is_nullable: true }, meta: { interface: 'input', sort: 4, width: 'half', note: 'Nom icone Lucide (ex: i-lucide-scale)' } },
      { field: 'couleur', type: 'string', schema: { is_nullable: true }, meta: { interface: 'select-color', display: 'color', sort: 5, width: 'half' } },
      { field: 'ordre', type: 'integer', schema: { is_nullable: false, default_value: 0 }, meta: { interface: 'input', sort: 6, width: 'half' } },
      { field: 'actif', type: 'boolean', schema: { is_nullable: false, default_value: true }, meta: { interface: 'boolean', display: 'boolean', sort: 7, width: 'half', special: ['cast-boolean'] } },
      ...systemFields()
    ]
  }, 'Collection "wiki_pages"')

  // ── schedule_entries ──
  await safeApi('POST', '/collections', {
    collection: 'schedule_entries',
    schema: {},
    meta: { icon: 'schedule', note: 'Emploi du temps (creneaux horaires)', sort: 13 },
    fields: [
      uuidPK(),
      { field: 'utilisateur', type: 'uuid', schema: { is_nullable: false }, meta: { interface: 'select-dropdown-m2o', display: 'user', required: true, sort: 1 } },
      { field: 'date', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', required: true, sort: 2 } },
      { field: 'heure_debut', type: 'time', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 3, note: 'Format HH:mm' } },
      { field: 'heure_fin', type: 'time', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 4, note: 'Format HH:mm' } },
      { field: 'titre', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 5 } },
      dropdown('categorie', [
        { text: 'Reunion client', value: 'reunion_client' },
        { text: 'Reunion interne', value: 'reunion_interne' },
        { text: 'Financement', value: 'reunion_financement' },
        { text: 'Indisponibilite', value: 'indispo_perso' },
        { text: 'Autre', value: 'autre' }
      ], { required: true, default_value: 'reunion_interne', sort: 6 }),
      { field: 'description', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 7 } },
      ...systemFields()
    ]
  }, 'Collection "schedule_entries"')

  // ── monitored_sites ──
  await safeApi('POST', '/collections', {
    collection: 'monitored_sites',
    schema: {},
    meta: { icon: 'monitoring', note: 'Sites web a surveiller', sort: 12 },
    fields: [
      uuidPK(),
      { field: 'nom', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 1 } },
      { field: 'url', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 2, options: { placeholder: 'https://example.com' } } },
      { field: 'actif', type: 'boolean', schema: { is_nullable: false, default_value: true }, meta: { interface: 'boolean', display: 'boolean', width: 'half', sort: 3, special: ['cast-boolean'] } }
    ]
  }, 'Collection "monitored_sites"')

  // ── monitored_sites_users (junction M2M) ──
  await safeApi('POST', '/collections', {
    collection: 'monitored_sites_users',
    schema: {},
    meta: { icon: 'group', note: 'Utilisateurs autorises par site', sort: 13, hidden: true },
    fields: [
      autoPK()
    ]
  }, 'Collection "monitored_sites_users"')

  // ── offres_emploi ──
  await safeApi('POST', '/collections', {
    collection: 'offres_emploi',
    schema: {},
    meta: { icon: 'work', note: 'Offres d\'emploi', sort: 10 },
    fields: [
      uuidPK(),
      { field: 'titre', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, sort: 1 } },
      { field: 'description', type: 'text', schema: { is_nullable: false }, meta: { interface: 'input-rich-text-html', required: true, sort: 2 } },
      dropdown('type_contrat', [
        { text: 'CDI', value: 'CDI' },
        { text: 'CDD', value: 'CDD' },
        { text: 'Freelance', value: 'Freelance' },
        { text: 'Alternance', value: 'Alternance' },
        { text: 'Stage', value: 'Stage' }
      ], { required: true, width: 'half' }),
      { field: 'localisation', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input', required: true, width: 'half', sort: 4 } },
      { field: 'salaire_min', type: 'float', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 5 } },
      { field: 'salaire_max', type: 'float', schema: { is_nullable: true }, meta: { interface: 'input', width: 'half', sort: 6 } },
      dropdown('salaire_periode', [
        { text: 'Par heure', value: 'heure' },
        { text: 'Par mois', value: 'mois' },
        { text: 'Par an', value: 'annee' }
      ], { width: 'half' }),
      { field: 'competences_requises', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-rich-text-html', sort: 8 } },
      { field: 'avantages', type: 'text', schema: { is_nullable: true }, meta: { interface: 'input-multiline', sort: 9 } },
      { field: 'publie', type: 'boolean', schema: { is_nullable: false, default_value: false }, meta: { interface: 'boolean', display: 'boolean', width: 'half', sort: 10, special: ['cast-boolean'] } },
      { field: 'date_publication', type: 'timestamp', schema: { is_nullable: true }, meta: { interface: 'datetime', display: 'datetime', width: 'half', sort: 11 } },
      { field: 'date_expiration', type: 'date', schema: { is_nullable: true }, meta: { interface: 'datetime', width: 'half', sort: 12 } },
      ...systemFields()
    ]
  }, 'Collection "offres_emploi"')

  console.log('')
}

// ─── Step 5: Create M2O Fields + Relations ──────────────

async function createRelations() {
  console.log('🔗 Creation des relations...')

  const relations = [
    // planning_entries
    { coll: 'planning_entries', field: 'utilisateur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },
    { coll: 'planning_entries', field: 'valide_par', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // conges_requests
    { coll: 'conges_requests', field: 'demandeur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },
    { coll: 'conges_requests', field: 'traite_par', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // prospects
    { coll: 'prospects', field: 'prospecteur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // contacts_history
    { coll: 'contacts_history', field: 'prospect', related: 'prospects', template: '{{nom_entreprise}}', one_field: 'historique_contacts' },
    { coll: 'contacts_history', field: 'contacte_par', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // projects
    { coll: 'projects', field: 'categorie', related: 'categories', template: '{{nom}}' },
    { coll: 'projects', field: 'client', related: 'prospects', template: '{{nom_entreprise}}' },

    // projects_members
    { coll: 'projects_members', field: 'project', related: 'projects', template: '{{nom}}', one_field: 'membres' },
    { coll: 'projects_members', field: 'utilisateur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // project_tasks
    { coll: 'project_tasks', field: 'project', related: 'projects', template: '{{nom}}', one_field: 'taches' },
    { coll: 'project_tasks', field: 'assigne_a', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // project_files
    { coll: 'project_files', field: 'project', related: 'projects', template: '{{nom}}', one_field: 'fichiers' },
    { coll: 'project_files', field: 'fichier', related: 'directus_files' },

    // notifications
    { coll: 'notifications', field: 'utilisateur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // monitored_sites_users (junction)
    { coll: 'monitored_sites_users', field: 'monitored_site', related: 'monitored_sites', template: '{{nom}}', one_field: 'utilisateurs' },
    { coll: 'monitored_sites_users', field: 'utilisateur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // schedule_entries
    { coll: 'schedule_entries', field: 'utilisateur', related: 'directus_users', template: '{{first_name}} {{last_name}}' },

    // offres_emploi
    { coll: 'offres_emploi', field: 'categorie', related: 'categories', template: '{{nom}}' },

    // directus_users -> categories
    { coll: 'directus_users', field: 'categorie', related: 'categories', template: '{{nom}}', one_field: 'membres' }
  ]

  for (const rel of relations) {
    // 1. Create M2O field
    const fieldType = rel.related === 'directus_files' ? 'uuid' : 'uuid'
    const fieldDef = {
      field: rel.field,
      type: fieldType,
      schema: { is_nullable: true },
      meta: {
        interface: rel.related === 'directus_files' ? 'file' : 'select-dropdown-m2o',
        special: rel.related === 'directus_files' ? ['file'] : ['m2o'],
        display: rel.related === 'directus_files' ? 'file' : 'related-values',
        ...(rel.template && { display_options: { template: rel.template } })
      }
    }
    await safeApi('POST', `/fields/${rel.coll}`, fieldDef, `Champ M2O "${rel.coll}.${rel.field}"`)

    // 2. Create relation
    const relDef = {
      collection: rel.coll,
      field: rel.field,
      related_collection: rel.related,
      ...(rel.one_field && {
        meta: {
          one_field: rel.one_field
        }
      })
    }
    await safeApi('POST', '/relations', relDef, `Relation "${rel.coll}.${rel.field}" → "${rel.related}"`)

    // 3. Create O2M alias field if needed
    if (rel.one_field && rel.related !== 'directus_users' && rel.related !== 'directus_files') {
      await safeApi('POST', `/fields/${rel.related}`, {
        field: rel.one_field,
        type: 'alias',
        meta: {
          interface: 'list-o2m',
          special: ['o2m'],
          display: 'related-values'
        }
      }, `Alias O2M "${rel.related}.${rel.one_field}"`)
    }
  }

  console.log('')
}

// ─── Step 6: Permissions ────────────────────────────────

async function setupPermissions(roleIds) {
  console.log('🔒 Configuration des permissions...')

  // ── Public policy ──
  const publicPolicy = await safeApi('POST', '/policies', {
    name: 'Acces Public',
    icon: 'public',
    description: 'Acces pour les visiteurs non connectes',
    admin_access: false,
    app_access: false
  }, 'Policy "Acces Public"')

  if (publicPolicy) {
    // Link to public role (null)
    await safeApi('POST', '/access', { role: null, policy: publicPolicy.id }, 'Access public → policy')

    // Public permissions
    await safeApi('POST', '/permissions', {
      policy: publicPolicy.id, collection: 'offres_emploi', action: 'read',
      fields: ['*'], permissions: { publie: { _eq: true } }
    }, 'Permission: public read offres publiees')

    await safeApi('POST', '/permissions', {
      policy: publicPolicy.id, collection: 'categories', action: 'read',
      fields: ['*'], permissions: {}
    }, 'Permission: public read categories')
  }

  // ── Authenticated base policy ──
  const authPolicy = await safeApi('POST', '/policies', {
    name: 'Base Authentifie',
    icon: 'verified_user',
    description: 'Permissions de base pour tous les utilisateurs connectes',
    admin_access: false,
    app_access: true
  }, 'Policy "Base Authentifie"')

  if (authPolicy) {
    // Link to non-admin roles
    for (const roleName of ['Employe', 'Freelance', 'Alternant', 'Stagiaire']) {
      if (roleIds[roleName]) {
        await safeApi('POST', '/access', { role: roleIds[roleName], policy: authPolicy.id }, `Access "${roleName}" → base policy`)
      }
    }

    // Permissions for authenticated users
    const perms = [
      // Users: read active, update own
      { collection: 'directus_users', action: 'read', fields: ['id', 'first_name', 'last_name', 'email', 'avatar', 'role', 'categorie', 'actif', 'type_contrat', 'date_debut_contrat', 'date_fin_contrat', 'date_fin_periode_essai', 'telephone', 'linkedin', 'localisation', 'bio'], permissions: {} },
      { collection: 'directus_users', action: 'update', fields: ['first_name', 'last_name', 'avatar', 'password', 'telephone', 'linkedin', 'localisation', 'bio'], permissions: { id: { _eq: '$CURRENT_USER' } } },

      // Roles: read
      { collection: 'directus_roles', action: 'read', fields: ['id', 'name', 'icon'], permissions: {} },

      // Files: CRUD (needed for avatars, project files)
      { collection: 'directus_files', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'directus_files', action: 'read', fields: ['*'], permissions: {} },

      // Categories: read
      { collection: 'categories', action: 'read', fields: ['*'], permissions: {} },

      // Planning entries: create own, read all, update own, delete own
      { collection: 'planning_entries', action: 'create', fields: ['*'], permissions: {}, validation: { utilisateur: { _eq: '$CURRENT_USER' } } },
      { collection: 'planning_entries', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'planning_entries', action: 'update', fields: ['*'], permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },
      { collection: 'planning_entries', action: 'delete', permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },

      // Conges requests: create own, read own, update own pending, delete own pending
      { collection: 'conges_requests', action: 'create', fields: ['*'], permissions: {}, validation: { demandeur: { _eq: '$CURRENT_USER' } } },
      { collection: 'conges_requests', action: 'read', fields: ['*'], permissions: { demandeur: { _eq: '$CURRENT_USER' } } },
      { collection: 'conges_requests', action: 'update', fields: ['motif', 'type_conge', 'date_debut', 'date_fin'], permissions: { demandeur: { _eq: '$CURRENT_USER' }, statut: { _eq: 'en_attente' } } },
      { collection: 'conges_requests', action: 'delete', permissions: { demandeur: { _eq: '$CURRENT_USER' }, statut: { _eq: 'en_attente' } } },

      // Prospects: full CRUD for all authenticated
      { collection: 'prospects', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'prospects', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'prospects', action: 'update', fields: ['*'], permissions: {} },

      // Contacts history: create, read all, update/delete own
      { collection: 'contacts_history', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'contacts_history', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'contacts_history', action: 'update', fields: ['*'], permissions: { user_created: { _eq: '$CURRENT_USER' } } },
      { collection: 'contacts_history', action: 'delete', permissions: { user_created: { _eq: '$CURRENT_USER' } } },

      // Projects: read all, update own
      { collection: 'projects', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'projects', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'projects', action: 'update', fields: ['*'], permissions: {} },

      // Project members
      { collection: 'projects_members', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'projects_members', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'projects_members', action: 'delete', permissions: {} },

      // Project tasks
      { collection: 'project_tasks', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'project_tasks', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'project_tasks', action: 'update', fields: ['*'], permissions: {} },
      { collection: 'project_tasks', action: 'delete', permissions: { user_created: { _eq: '$CURRENT_USER' } } },

      // Project files
      { collection: 'project_files', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'project_files', action: 'read', fields: ['*'], permissions: {} },

      // Notifications: create, read own, update own (mark as read)
      { collection: 'notifications', action: 'create', fields: ['*'], permissions: {} },
      { collection: 'notifications', action: 'read', fields: ['*'], permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },
      { collection: 'notifications', action: 'update', fields: ['lu'], permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },

      // Wiki pages: read active
      { collection: 'wiki_pages', action: 'read', fields: ['*'], permissions: { actif: { _eq: true } } },

      // Schedule entries: create own, read all, update own, delete own
      { collection: 'schedule_entries', action: 'create', fields: ['*'], permissions: {}, validation: { utilisateur: { _eq: '$CURRENT_USER' } } },
      { collection: 'schedule_entries', action: 'read', fields: ['*'], permissions: {} },
      { collection: 'schedule_entries', action: 'update', fields: ['*'], permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },
      { collection: 'schedule_entries', action: 'delete', permissions: { utilisateur: { _eq: '$CURRENT_USER' } } },

      // Monitored sites: read active
      { collection: 'monitored_sites', action: 'read', fields: ['*'], permissions: { actif: { _eq: true } } },
      { collection: 'monitored_sites_users', action: 'read', fields: ['*'], permissions: {} },

      // Offres emploi: read published
      { collection: 'offres_emploi', action: 'read', fields: ['*'], permissions: { publie: { _eq: true } } }
    ]

    for (const perm of perms) {
      await safeApi('POST', '/permissions', {
        policy: authPolicy.id,
        ...perm
      }, `Permission: ${perm.action} ${perm.collection}`)
    }
  }

  console.log('')
}

// ─── Step 7: Seed Data ──────────────────────────────────

async function seedCategories() {
  console.log('🌱 Donnees de seed...')

  const categories = [
    { nom: 'Informatique', couleur: '#3B82F6', description: 'Developpement, infrastructure, support IT' },
    { nom: 'Design 2D/3D', couleur: '#8B5CF6', description: 'Creation graphique, modelisation 3D, UI/UX' },
    { nom: 'Communication', couleur: '#F59E0B', description: 'Marketing, reseaux sociaux, relations publiques' },
    { nom: 'Journalisme', couleur: '#EF4444', description: 'Redaction, investigation, reportage' },
    { nom: 'Edition', couleur: '#10B981', description: 'Correction, mise en page, publication' },
    { nom: 'Administration', couleur: '#6B7280', description: 'Gestion, comptabilite, RH' }
  ]

  for (const cat of categories) {
    await safeApi('POST', '/items/categories', cat, `Categorie "${cat.nom}"`)
  }

  console.log('')
}

// ─── Step 7b: Seed Wiki Pages ────────────────────────────

async function seedWikiPages() {
  console.log('📖 Seed des pages wiki...')

  const pages = [
    {
      titre: 'Reglement interieur',
      slug: 'reglement',
      icone: 'i-lucide-scale',
      couleur: '#3B82F6',
      ordre: 1,
      actif: true,
      contenu: `<h2>Preambule</h2>
<p>Le present reglement interieur est etabli par la direction de Le Geai Editions, conformement aux dispositions des articles L.1311-1 a L.1321-6 et R.1321-1 a R.1321-4 du Code du travail.</p>
<p>Bien que l'entreprise emploie moins de 50 salaries et ne soit donc pas soumise a l'obligation legale d'etablir un reglement interieur, la direction a choisi de mettre en place le present document afin de garantir un cadre de travail clair, sur et equitable.</p>
<p><strong>Champ d'application :</strong> le present reglement s'applique a l'ensemble des salaries de l'entreprise, quel que soit leur contrat de travail (CDI, CDD, contrat d'apprentissage, contrat de professionnalisation). Les stagiaires et travailleurs interimaires sont soumis aux dispositions relatives a l'hygiene, a la securite et a la discipline generale.</p>

<h2>Titre I - Hygiene et securite</h2>
<h3>Article 1 : Regles generales</h3>
<p>Chaque collaborateur est tenu de prendre soin de sa sante et de sa securite ainsi que de celles des autres personnes concernees par ses actes ou omissions au travail (art. L.4122-1). Les collaborateurs doivent respecter les regles d'utilisation des equipements et des locaux, signaler toute situation dangereuse et ne pas modifier les dispositifs de securite.</p>
<h3>Article 2 : Teletravail</h3>
<p>Le collaborateur en teletravail reste soumis aux regles de securite applicables. Il s'engage a disposer d'un espace de travail conforme aux exigences d'ergonomie et de securite electrique. Tout accident survenu pendant les heures de travail sur le lieu de teletravail doit etre signale dans les 24 heures.</p>
<h3>Article 3 : Retablissement des conditions de securite</h3>
<p>Lorsque les conditions protectrices de la sante et de la securite sont compromises, les collaborateurs sont tenus de participer a leur retablissement (formations, mesures correctives, procedures temporaires renforcees).</p>

<h2>Titre II - Discipline</h2>
<h3>Article 4 : Regles generales de discipline</h3>
<ul>
<li>Respecter les horaires de travail ou les delais et livrables fixes</li>
<li>Adopter un comportement professionnel, courtois et respectueux</li>
<li>Se conformer aux directives de la direction</li>
<li>Justifier toute absence dans les 48 heures</li>
<li>Ne pas exercer d'activite concurrente</li>
</ul>
<h3>Article 5 : Outils et ressources</h3>
<p>Les outils, logiciels et ressources numeriques sont destines a un usage exclusivement professionnel, sauf tolerance de la direction. Toute utilisation abusive constitue une faute disciplinaire.</p>
<h3>Article 6 : Systemes d'information</h3>
<p>L'acces est strictement nominatif. Il est interdit de communiquer ses identifiants, d'utiliser ceux d'un autre collaborateur ou de contourner les mesures de securite. Les acces sont desactives a la fin de la collaboration.</p>
<h3>Article 7 : Comportements nuisibles</h3>
<p>Sont interdits : la diffusion de fausses informations, la mise en danger des donnees, l'introduction de contenus illicites (a l'exception des oeuvres editoriales de l'entreprise).</p>
<h3>Article 8 : Communication des incidents</h3>
<p>Tout incident doit etre signale sans delai a la direction. Ce signalement ne peut donner lieu a des represailles.</p>

<h2>Titre III - Harcelement, discrimination et lanceurs d'alerte</h2>
<h3>Article 9 : Harcelement moral</h3>
<p>Aucun collaborateur ne doit subir des agissements repetes de harcelement moral (art. L.1152-1 a L.1152-6). Toute victime peut saisir la direction, le medecin du travail ou l'inspection du travail.</p>
<h3>Article 10 : Harcelement sexuel et agissements sexistes</h3>
<p>Aucun collaborateur ne doit subir de harcelement sexuel ou d'agissements sexistes (art. L.1153-1 a L.1153-6 et L.1142-2-1). Est assimile au harcelement sexuel toute pression grave exercee dans le but d'obtenir un acte de nature sexuelle.</p>
<h3>Article 11 : Discriminations</h3>
<p>Aucune discrimination n'est toleree, conformement aux articles L.1132-1 et suivants du Code du travail (origine, sexe, age, orientation sexuelle, identite de genre, handicap, opinions politiques, convictions religieuses, etc.).</p>
<h3>Article 12 : Lanceurs d'alerte</h3>
<p>Conformement a la loi du 21 mars 2022, un dispositif de recueil des signalements est en place. Aucune sanction ne peut etre prise contre un lanceur d'alerte de bonne foi.</p>

<h2>Titre IV - Sanctions disciplinaires</h2>
<p>Echelle des sanctions, en fonction de la gravite :</p>
<ol>
<li><strong>Avertissement ecrit</strong> - observation ecrite rappelant les faits</li>
<li><strong>Blame</strong> - reprimande versee au dossier</li>
<li><strong>Mise a pied disciplinaire</strong> - suspension sans remuneration (max. 5 jours ouvres)</li>
<li><strong>Retrogradation</strong> - sous reserve de l'accord du collaborateur</li>
<li><strong>Licenciement pour faute</strong></li>
<li><strong>Licenciement pour faute grave ou lourde</strong> - sans preavis ni indemnite</li>
</ol>
<p>Cette echelle n'implique pas une progressivite obligatoire. Aucune sanction ne peut etre prononcee sans entretien prealable (sauf avertissement/blame). Aucun fait fautif ne peut donner lieu a des poursuites au-dela de 2 mois.</p>`
    },
    {
      titre: 'Charte contractuelle',
      slug: 'charte',
      icone: 'i-lucide-file-lock',
      couleur: '#10B981',
      ordre: 2,
      actif: true,
      contenu: `<h2>Preambule</h2>
<p>La presente charte constitue une annexe au contrat de travail (ou a la convention de stage). Elle definit les engagements reciproques en matiere de confidentialite, de propriete intellectuelle, de non-sollicitation et d'utilisation des ressources. Les obligations s'ajoutent aux dispositions du reglement interieur.</p>

<h2>Titre I - Confidentialite</h2>
<h3>Article 1 : Informations confidentielles</h3>
<p>Sont confidentielles : les donnees, documents, oeuvres, manuscrits, strategies commerciales, listes de clients, conditions tarifaires, procedes techniques et savoir-faire. Cette obligation couvre les oeuvres en cours ou non publiees.</p>
<h3>Article 2 : Obligations</h3>
<ul>
<li>Ne pas divulguer, reproduire ou exploiter les informations sans autorisation ecrite</li>
<li>Ne pas utiliser les informations a des fins personnelles</li>
<li>Proteger la confidentialite (verrouillage postes, stockage securise, chiffrement)</li>
<li>Restituer tous les documents a la fin de la collaboration</li>
</ul>
<h3>Article 3 : Duree</h3>
<p>L'obligation s'applique pendant et apres la collaboration, sans limitation de duree. Toute violation engage la responsabilite civile et penale du collaborateur.</p>

<h2>Titre II - Propriete intellectuelle</h2>
<h3>Article 4 : Cession des droits patrimoniaux</h3>
<p>Le collaborateur cede a Le Geai Editions l'integralite de ses droits patrimoniaux sur les oeuvres realisees dans le cadre de son contrat. Cession pour le monde entier et pour toute la duree de la protection legale :</p>
<ul>
<li><strong>Reproduction</strong> : sur tout support connu ou a venir</li>
<li><strong>Representation</strong> : par tout procede de diffusion</li>
<li><strong>Adaptation</strong> : modification, traduction, integration</li>
</ul>
<h3>Article 5 : Droit moral</h3>
<p>Le droit moral reste inalienable. L'entreprise respecte la paternite de l'oeuvre et ne procede pas a des modifications portant atteinte a son integrite sans concertation.</p>

<h2>Titre III - Non-sollicitation et loyaute</h2>
<p>Pendant la collaboration, le collaborateur s'interdit de :</p>
<ul>
<li>Demarcher les clients pour son propre compte</li>
<li>Diffuser les coordonnees ou listes de clients</li>
<li>Solliciter les partenaires commerciaux pour detourner du chiffre d'affaires</li>
</ul>
<p>L'obligation est applicable pendant toute la duree du contrat. Les clauses de non-concurrence eventuelles s'appliquent au-dela.</p>

<h2>Dispositions finales</h2>
<p>Tout manquement constitue une faute susceptible d'entrainer des sanctions disciplinaires conformement au reglement interieur, sans prejudice de poursuites judiciaires.</p>`
    },
    {
      titre: 'Cession de droits d\'auteur',
      slug: 'cession',
      icone: 'i-lucide-file-signature',
      couleur: '#8B5CF6',
      ordre: 3,
      actif: true,
      contenu: `<h2>Article 1 - Objet de la cession</h2>
<p>Le stagiaire cede ses droits patrimoniaux sur l'ensemble des oeuvres realisees dans le cadre du stage ou a l'aide des outils de l'entreprise. Les oeuvres incluent :</p>
<ul>
<li>Code source, scripts, modules logiciels, contributions techniques</li>
<li>Illustrations, graphismes, maquettes, animations, videos, mises en page</li>
<li>Contenus redactionnels, editoriaux et documentaires</li>
<li>Toute autre creation originale produite dans le cadre du stage</li>
</ul>

<h2>Article 2 - Droits cedes</h2>
<p>Conformement a l'article L.131-3 du CPI :</p>
<ul>
<li><strong>Reproduction :</strong> fixation sur tout support materiel ou immateriel, en nombre illimite</li>
<li><strong>Representation :</strong> communication au public par tout procede</li>
<li><strong>Adaptation :</strong> modification, traduction, integration dans une oeuvre composite</li>
</ul>

<h2>Article 3 - Destination</h2>
<ul>
<li>Edition et publication d'ouvrages (papier et numerique)</li>
<li>Sites web, applications mobiles, plateformes en ligne</li>
<li>Communication institutionnelle et promotionnelle</li>
<li>Exploitations derivees liees aux activites de l'entreprise</li>
</ul>

<h2>Article 4 - Etendue</h2>
<ul>
<li><strong>Territoire :</strong> monde entier, sans restriction</li>
<li><strong>Duree :</strong> toute la duree legale de protection des droits d'auteur</li>
</ul>

<h2>Article 5 - Contrepartie</h2>
<p>La cession est consentie en contrepartie de la gratification de stage. En l'absence de gratification (stage de 2 mois ou moins), la cession est a titre gratuit, l'experience professionnelle constituant la contrepartie.</p>

<h2>Articles 6, 7, 8 - Droit moral, garanties et confidentialite</h2>
<h3>Droit moral (art. 6)</h3>
<p>Le droit moral demeure inalienable. L'entreprise respecte l'integrite des oeuvres. Le stagiaire autorise l'exploitation sans mention systematique de son nom. Il conserve le droit de revendiquer la paternite de ses creations.</p>
<h3>Garanties (art. 7)</h3>
<p>Le stagiaire garantit etre l'auteur des oeuvres, leur originalite, l'absence d'atteinte aux droits de tiers, et l'absence de cessions incompatibles.</p>
<h3>Confidentialite (art. 8)</h3>
<p>Le stagiaire ne peut diffuser les oeuvres sans autorisation. Il conserve le droit d'integrer les oeuvres dans un portfolio personnel, sans divulguer d'informations confidentielles, en informant prealablement l'entreprise.</p>`
    }
  ]

  for (const page of pages) {
    await safeApi('POST', '/items/wiki_pages', page, `Wiki "${page.titre}"`)
  }

  console.log('')
}

// ─── Step 7c: Seed Monitored Sites ──────────────────────

async function seedMonitoredSites() {
  console.log('🌐 Seed des sites surveilles...')

  const sites = [
    { nom: 'Le Geai Editions', url: 'https://legeai-editions.com', actif: true },
    { nom: 'Le Geai Informatique', url: 'https://legeai-informatique.fr', actif: true },
    { nom: 'Bergfrid', url: 'https://bergfrid.com', actif: true }
  ]

  for (const site of sites) {
    await safeApi('POST', '/items/monitored_sites', site, `Site "${site.nom}"`)
  }

  console.log('')
}

// ─── Step 8: Test Users ─────────────────────────────────

async function createTestUsers(roleIds) {
  console.log('👤 Creation des utilisateurs de test...')

  const testUsers = [
    {
      email: 'employe@legeai.fr',
      password: 'Test1234!',
      first_name: 'Marie',
      last_name: 'Dupont',
      role: roleIds.Employe,
      actif: true,
      type_contrat: 'CDI',
      date_debut_contrat: '2024-03-01'
    },
    {
      email: 'freelance@legeai.fr',
      password: 'Test1234!',
      first_name: 'Thomas',
      last_name: 'Martin',
      role: roleIds.Freelance,
      actif: true,
      type_contrat: 'Freelance',
      date_debut_contrat: '2025-01-15',
      date_fin_contrat: '2025-12-31'
    },
    {
      email: 'alternant@legeai.fr',
      password: 'Test1234!',
      first_name: 'Lucas',
      last_name: 'Bernard',
      role: roleIds.Alternant,
      actif: true,
      type_contrat: 'Alternance',
      date_debut_contrat: '2025-09-01',
      date_fin_contrat: '2026-08-31'
    },
    {
      email: 'stagiaire@legeai.fr',
      password: 'Test1234!',
      first_name: 'Emma',
      last_name: 'Petit',
      role: roleIds.Stagiaire,
      actif: true,
      type_contrat: 'Stage',
      date_debut_contrat: '2026-01-15',
      date_fin_contrat: '2026-07-15'
    }
  ]

  for (const u of testUsers) {
    await safeApi('POST', '/users', u, `Utilisateur "${u.first_name} ${u.last_name}" (${u.email})`)
  }

  // Assign admin user to Directeur role
  if (roleIds.Directeur) {
    // Find admin user
    try {
      const users = await api('GET', '/users?filter[email][_eq]=' + encodeURIComponent(ADMIN_EMAIL))
      if (users && users.length > 0) {
        await api('PATCH', `/users/${users[0].id}`, {
          role: roleIds.Directeur,
          first_name: 'Admin',
          last_name: 'LeGeai',
          actif: true
        })
        console.log('  ✓ Admin assigne au role Directeur')
      }
    } catch (e) {
      console.log(`  ⚠ Impossible d'assigner le role Directeur a l'admin: ${e.message.substring(0, 100)}`)
    }
  }

  console.log('')
}

// ─── Step 9: Fix existing permissions ────────────────────

async function fixExistingPermissions() {
  console.log('🔧 Correction des permissions existantes...')

  try {
    // Fetch all permissions
    const perms = await api('GET', '/permissions?limit=-1')

    // Fix planning_entries delete/update: remove statut restriction
    for (const perm of perms) {
      if (perm.collection === 'planning_entries' && (perm.action === 'delete' || perm.action === 'update')) {
        const currentPerms = perm.permissions || {}
        if (currentPerms.statut) {
          const newPerms = { ...currentPerms }
          delete newPerms.statut
          await safeApi('PATCH', `/permissions/${perm.id}`, { permissions: newPerms }, `Fix ${perm.action} planning_entries (id: ${perm.id})`)
        }
      }

      // Fix directus_users update: add missing fields
      if (perm.collection === 'directus_users' && perm.action === 'update' && perm.fields) {
        const required = ['password', 'telephone', 'linkedin', 'localisation', 'bio']
        const missing = required.filter(f => !perm.fields.includes(f))
        if (missing.length > 0 && perm.fields.includes('first_name')) {
          const newFields = [...perm.fields, ...missing]
          await safeApi('PATCH', `/permissions/${perm.id}`, { fields: newFields }, `Fix update directus_users: ajout champs ${missing.join(', ')} (id: ${perm.id})`)
        }
      }

      // Fix directus_users read: add missing profile fields
      if (perm.collection === 'directus_users' && perm.action === 'read' && perm.fields) {
        const required = ['telephone', 'linkedin', 'localisation', 'bio']
        const missing = required.filter(f => !perm.fields.includes(f))
        if (missing.length > 0 && perm.fields.includes('first_name')) {
          const newFields = [...perm.fields, ...missing]
          await safeApi('PATCH', `/permissions/${perm.id}`, { fields: newFields }, `Fix read directus_users: ajout champs ${missing.join(', ')} (id: ${perm.id})`)
        }
      }
    }

    // Fix directus_users fields: assign to groups if not already grouped
    const groupAssignments = {
      contrat_group: ['date_debut_contrat', 'date_fin_contrat', 'date_fin_periode_essai', 'actif', 'type_contrat'],
      coordonnees_group: ['telephone', 'linkedin', 'localisation', 'bio']
    }
    try {
      const userFields = await api('GET', '/fields/directus_users')
      for (const [groupName, fieldNames] of Object.entries(groupAssignments)) {
        for (const fieldName of fieldNames) {
          const field = userFields.find(f => f.field === fieldName)
          if (field && field.meta && field.meta.group !== groupName) {
            await safeApi('PATCH', `/fields/directus_users/${fieldName}`, { meta: { group: groupName } }, `Fix groupe: ${fieldName} → ${groupName}`)
          }
        }
      }
    } catch (e) {
      console.log(`  ⚠ Impossible de corriger les groupes: ${e.message.substring(0, 150)}`)
    }

    // Check if notifications create permission exists
    const hasNotifCreate = perms.some(p => p.collection === 'notifications' && p.action === 'create')
    if (!hasNotifCreate) {
      // Find the authenticated policy ID from existing notifications read permission
      const notifReadPerm = perms.find(p => p.collection === 'notifications' && p.action === 'read')
      if (notifReadPerm) {
        await safeApi('POST', '/permissions', {
          policy: notifReadPerm.policy,
          collection: 'notifications',
          action: 'create',
          fields: ['*'],
          permissions: {}
        }, 'Fix: ajout permission create notifications')
      }
    }
  } catch (e) {
    console.log(`  ⚠ Impossible de corriger les permissions: ${e.message.substring(0, 150)}`)
  }

  console.log('')
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   Setup Intranet LeGeai - Directus       ║')
  console.log('╚══════════════════════════════════════════╝\n')

  await waitForDirectus()
  await authenticate()

  const roleIds = await createRoles()
  await extendDirectusUsers()
  await createCollections()
  await createRelations()
  await setupPermissions(roleIds)
  await seedCategories()
  await seedWikiPages()
  await seedMonitoredSites()
  await createTestUsers(roleIds)

  await fixExistingPermissions()

  console.log('╔══════════════════════════════════════════╗')
  console.log('║   ✅ Setup termine avec succes !          ║')
  console.log('╚══════════════════════════════════════════╝\n')
  console.log('Comptes de test :')
  console.log('  Directeur  : admin@legeai.fr / Admin2026LeGeai')
  console.log('  Employe    : employe@legeai.fr / Test1234!')
  console.log('  Freelance  : freelance@legeai.fr / Test1234!')
  console.log('  Alternant  : alternant@legeai.fr / Test1234!')
  console.log('  Stagiaire  : stagiaire@legeai.fr / Test1234!')
  console.log('')
  console.log(`Directus admin : ${BASE_URL}/admin`)
}

main().catch(err => {
  console.error('\n❌ Erreur fatale:', err.message)
  process.exit(1)
})
