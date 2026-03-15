/**
 * Cree la collection articles avec les champs, relations et permissions.
 */
export default async function ({ api, safeApi }) {
  // ── Collection ──
  await safeApi('POST', '/collections', {
    collection: 'articles',
    meta: {
      icon: 'article',
      note: 'Articles publies sur le site (micro-articles LinkedIn)',
      sort_field: 'date_created',
      archive_field: 'statut',
      archive_value: 'brouillon',
      unarchive_value: 'publie'
    },
    schema: {}
  }, 'Collection articles')

  // ── Champs ──
  await safeApi('POST', '/fields/articles', {
    field: 'titre',
    type: 'string',
    schema: { is_nullable: false },
    meta: { interface: 'input', sort: 1, width: 'full', required: true, note: 'Titre de l\'article' }
  }, 'Champ articles.titre')

  await safeApi('POST', '/fields/articles', {
    field: 'contenu',
    type: 'text',
    schema: { is_nullable: false },
    meta: { interface: 'input-rich-text-html', sort: 2, width: 'full', required: true, note: 'Contenu de l\'article (gras, souligne, emojis)' }
  }, 'Champ articles.contenu')

  await safeApi('POST', '/fields/articles', {
    field: 'statut',
    type: 'string',
    schema: { is_nullable: false, default_value: 'brouillon' },
    meta: {
      interface: 'select-dropdown',
      sort: 3,
      width: 'half',
      options: {
        choices: [
          { text: 'Brouillon', value: 'brouillon' },
          { text: 'Publie', value: 'publie' },
          { text: 'Programme', value: 'programme' }
        ]
      }
    }
  }, 'Champ articles.statut')

  await safeApi('POST', '/fields/articles', {
    field: 'date_publication',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: { interface: 'datetime', display: 'datetime', sort: 4, width: 'half', note: 'Date de publication (ou programmee)' }
  }, 'Champ articles.date_publication')

  await safeApi('POST', '/fields/articles', {
    field: 'auteur',
    type: 'uuid',
    schema: { is_nullable: true, foreign_key_table: 'directus_users', foreign_key_column: 'id' },
    meta: { interface: 'select-dropdown-m2o', sort: 5, width: 'half', display: 'related-values', display_options: { template: '{{first_name}} {{last_name}}' }, special: ['m2o'] }
  }, 'Champ articles.auteur')

  // Relation M2O auteur → directus_users
  await safeApi('POST', '/relations', {
    collection: 'articles',
    field: 'auteur',
    related_collection: 'directus_users',
    meta: { one_field: null },
    schema: { on_delete: 'SET NULL' }
  }, 'Relation articles.auteur → directus_users')

  // System fields
  await safeApi('POST', '/fields/articles', {
    field: 'date_created',
    type: 'timestamp',
    schema: { is_nullable: false },
    meta: { interface: 'datetime', display: 'datetime', sort: 10, width: 'half', readonly: true, special: ['date-created'] }
  }, 'Champ articles.date_created')

  await safeApi('POST', '/fields/articles', {
    field: 'date_updated',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: { interface: 'datetime', display: 'datetime', sort: 11, width: 'half', readonly: true, special: ['date-updated'] }
  }, 'Champ articles.date_updated')

  await safeApi('POST', '/fields/articles', {
    field: 'user_created',
    type: 'uuid',
    schema: { is_nullable: true, foreign_key_table: 'directus_users', foreign_key_column: 'id' },
    meta: { interface: 'select-dropdown-m2o', sort: 12, width: 'half', readonly: true, special: ['user-created'], hidden: true }
  }, 'Champ articles.user_created')

  // ── Permissions ──

  // Public: read articles publies
  // Find existing public policy
  let publicPolicyId = null
  try {
    const policies = await api('GET', '/policies?filter[name][_eq]=Acces%20Public&limit=1')
    if (policies && policies.length > 0) publicPolicyId = policies[0].id
  } catch { /* ignore */ }

  if (publicPolicyId) {
    await safeApi('POST', '/permissions', {
      policy: publicPolicyId,
      collection: 'articles',
      action: 'read',
      fields: ['id', 'titre', 'contenu', 'statut', 'date_publication', 'auteur', 'date_created'],
      permissions: { _and: [{ statut: { _eq: 'publie' } }, { date_publication: { _lte: '$NOW' } }] }
    }, 'Permission: public read articles publies')
  }

  // Authenticated: read articles publies
  let authPolicyId = null
  try {
    const policies = await api('GET', '/policies?filter[name][_eq]=Base%20Authentifie&limit=1')
    if (policies && policies.length > 0) authPolicyId = policies[0].id
  } catch { /* ignore */ }

  if (authPolicyId) {
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'articles',
      action: 'read',
      fields: ['*'],
      permissions: { _and: [{ statut: { _eq: 'publie' } }, { date_publication: { _lte: '$NOW' } }] }
    }, 'Permission: authentifie read articles publies')
  }

  // Admin (Directeur) has admin_access=true, so they get full CRUD automatically
  console.log('  ℹ Les admins (Directeur) ont deja le CRUD complet via admin_access')
}
