/**
 * Cree les collections evenements et evenements_participants
 * avec champs, relations et permissions.
 */
export default async function ({ api, safeApi }) {

  // ════════════════════════════════════════════════════════
  // 1. Collection evenements
  // ════════════════════════════════════════════════════════

  await safeApi('POST', '/collections', {
    collection: 'evenements',
    meta: {
      icon: 'event',
      note: 'Evenements du calendrier partagé',
      sort_field: 'date_debut',
      display_template: '{{titre}}'
    },
    schema: {}
  }, 'Collection evenements')

  // titre
  await safeApi('POST', '/fields/evenements', {
    field: 'titre',
    type: 'string',
    schema: { is_nullable: false },
    meta: { interface: 'input', sort: 1, width: 'full', required: true, note: 'Titre de l\'evenement' }
  }, 'Champ evenements.titre')

  // description
  await safeApi('POST', '/fields/evenements', {
    field: 'description',
    type: 'text',
    schema: { is_nullable: true },
    meta: { interface: 'input-multiline', sort: 2, width: 'full' }
  }, 'Champ evenements.description')

  // lieu
  await safeApi('POST', '/fields/evenements', {
    field: 'lieu',
    type: 'string',
    schema: { is_nullable: true },
    meta: { interface: 'input', sort: 3, width: 'half', note: 'Lieu ou lien de reunion' }
  }, 'Champ evenements.lieu')

  // date_debut
  await safeApi('POST', '/fields/evenements', {
    field: 'date_debut',
    type: 'timestamp',
    schema: { is_nullable: false },
    meta: { interface: 'datetime', display: 'datetime', sort: 4, width: 'half', required: true }
  }, 'Champ evenements.date_debut')

  // date_fin
  await safeApi('POST', '/fields/evenements', {
    field: 'date_fin',
    type: 'timestamp',
    schema: { is_nullable: false },
    meta: { interface: 'datetime', display: 'datetime', sort: 5, width: 'half', required: true }
  }, 'Champ evenements.date_fin')

  // toute_journee
  await safeApi('POST', '/fields/evenements', {
    field: 'toute_journee',
    type: 'boolean',
    schema: { is_nullable: false, default_value: false },
    meta: { interface: 'boolean', sort: 6, width: 'half' }
  }, 'Champ evenements.toute_journee')

  // couleur
  await safeApi('POST', '/fields/evenements', {
    field: 'couleur',
    type: 'string',
    schema: { is_nullable: true, default_value: '#AF8F3C' },
    meta: { interface: 'select-color', sort: 7, width: 'half', note: 'Couleur HEX' }
  }, 'Champ evenements.couleur')

  // type
  await safeApi('POST', '/fields/evenements', {
    field: 'type',
    type: 'string',
    schema: { is_nullable: false, default_value: 'personnel' },
    meta: {
      interface: 'select-dropdown',
      sort: 8,
      width: 'half',
      options: {
        choices: [
          { text: 'Personnel', value: 'personnel' },
          { text: 'Equipe', value: 'equipe' },
          { text: 'Entreprise', value: 'entreprise' }
        ]
      }
    }
  }, 'Champ evenements.type')

  // organisateur (M2O → directus_users)
  await safeApi('POST', '/fields/evenements', {
    field: 'organisateur',
    type: 'uuid',
    schema: { is_nullable: false, foreign_key_table: 'directus_users', foreign_key_column: 'id' },
    meta: {
      interface: 'select-dropdown-m2o',
      sort: 9,
      width: 'half',
      display: 'related-values',
      display_options: { template: '{{first_name}} {{last_name}}' },
      special: ['m2o']
    }
  }, 'Champ evenements.organisateur')

  await safeApi('POST', '/relations', {
    collection: 'evenements',
    field: 'organisateur',
    related_collection: 'directus_users',
    meta: { one_field: null },
    schema: { on_delete: 'SET NULL' }
  }, 'Relation evenements.organisateur → directus_users')

  // date_created / user_created
  await safeApi('POST', '/fields/evenements', {
    field: 'date_created',
    type: 'timestamp',
    schema: { is_nullable: false },
    meta: { interface: 'datetime', display: 'datetime', sort: 20, width: 'half', readonly: true, special: ['date-created'], hidden: true }
  }, 'Champ evenements.date_created')

  await safeApi('POST', '/fields/evenements', {
    field: 'user_created',
    type: 'uuid',
    schema: { is_nullable: true, foreign_key_table: 'directus_users', foreign_key_column: 'id' },
    meta: { interface: 'select-dropdown-m2o', sort: 21, width: 'half', readonly: true, special: ['user-created'], hidden: true }
  }, 'Champ evenements.user_created')

  // ════════════════════════════════════════════════════════
  // 2. Collection evenements_participants (jonction)
  // ════════════════════════════════════════════════════════

  await safeApi('POST', '/collections', {
    collection: 'evenements_participants',
    meta: {
      icon: 'group',
      note: 'Participants aux evenements avec statut de reponse',
      hidden: true
    },
    schema: {}
  }, 'Collection evenements_participants')

  // evenement (M2O → evenements)
  await safeApi('POST', '/fields/evenements_participants', {
    field: 'evenement',
    type: 'integer',
    schema: { is_nullable: false, foreign_key_table: 'evenements', foreign_key_column: 'id' },
    meta: { interface: 'select-dropdown-m2o', sort: 1, width: 'half', special: ['m2o'] }
  }, 'Champ evenements_participants.evenement')

  await safeApi('POST', '/relations', {
    collection: 'evenements_participants',
    field: 'evenement',
    related_collection: 'evenements',
    meta: { one_field: 'participants', sort_field: null },
    schema: { on_delete: 'CASCADE' }
  }, 'Relation evenements_participants.evenement → evenements')

  // user (M2O → directus_users)
  await safeApi('POST', '/fields/evenements_participants', {
    field: 'user',
    type: 'uuid',
    schema: { is_nullable: false, foreign_key_table: 'directus_users', foreign_key_column: 'id' },
    meta: {
      interface: 'select-dropdown-m2o',
      sort: 2,
      width: 'half',
      display: 'related-values',
      display_options: { template: '{{first_name}} {{last_name}}' },
      special: ['m2o']
    }
  }, 'Champ evenements_participants.user')

  await safeApi('POST', '/relations', {
    collection: 'evenements_participants',
    field: 'user',
    related_collection: 'directus_users',
    meta: { one_field: null },
    schema: { on_delete: 'CASCADE' }
  }, 'Relation evenements_participants.user → directus_users')

  // statut (invite / accepte / refuse)
  await safeApi('POST', '/fields/evenements_participants', {
    field: 'statut',
    type: 'string',
    schema: { is_nullable: false, default_value: 'invite' },
    meta: {
      interface: 'select-dropdown',
      sort: 3,
      width: 'half',
      options: {
        choices: [
          { text: 'Invite', value: 'invite' },
          { text: 'Accepte', value: 'accepte' },
          { text: 'Refuse', value: 'refuse' }
        ]
      }
    }
  }, 'Champ evenements_participants.statut')

  // ════════════════════════════════════════════════════════
  // 3. Champ O2M virtual sur evenements (participants list)
  // ════════════════════════════════════════════════════════

  await safeApi('POST', '/fields/evenements', {
    field: 'participants',
    type: 'alias',
    schema: null,
    meta: {
      interface: 'list-o2m',
      sort: 10,
      width: 'full',
      special: ['o2m'],
      options: {
        template: '{{user.first_name}} {{user.last_name}} — {{statut}}',
        enableCreate: false
      }
    }
  }, 'Champ virtuel evenements.participants (O2M)')

  // ════════════════════════════════════════════════════════
  // 4. Permissions
  // ════════════════════════════════════════════════════════

  let authPolicyId = null
  try {
    const policies = await api('GET', '/policies?filter[name][_eq]=Base%20Authentifie&limit=1')
    if (policies && policies.length > 0) authPolicyId = policies[0].id
  } catch { /* ignore */ }

  if (!authPolicyId) {
    console.log('  ⚠ Politique "Base Authentifie" introuvable — permissions ignorees')
  } else {
    // evenements — read (propres + invite)
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements',
      action: 'read',
      fields: ['*'],
      permissions: {
        _or: [
          { organisateur: { _eq: '$CURRENT_USER' } },
          { participants: { user: { _eq: '$CURRENT_USER' } } }
        ]
      }
    }, 'Permission: authentifie read evenements (propres + invite)')

    // evenements — create
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements',
      action: 'create',
      fields: ['*'],
      permissions: {}
    }, 'Permission: authentifie create evenements')

    // evenements — update (propres uniquement)
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements',
      action: 'update',
      fields: ['*'],
      permissions: { organisateur: { _eq: '$CURRENT_USER' } }
    }, 'Permission: authentifie update evenements (propres)')

    // evenements — delete (propres uniquement)
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements',
      action: 'delete',
      fields: ['*'],
      permissions: { organisateur: { _eq: '$CURRENT_USER' } }
    }, 'Permission: authentifie delete evenements (propres)')

    // evenements_participants — read
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements_participants',
      action: 'read',
      fields: ['*'],
      permissions: {}
    }, 'Permission: authentifie read evenements_participants')

    // evenements_participants — create
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements_participants',
      action: 'create',
      fields: ['*'],
      permissions: {}
    }, 'Permission: authentifie create evenements_participants')

    // evenements_participants — update statut (propre participation)
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements_participants',
      action: 'update',
      fields: ['statut'],
      permissions: { user: { _eq: '$CURRENT_USER' } }
    }, 'Permission: authentifie update statut participation')

    // evenements_participants — delete (organisateur supprime via cascade ou propre participation)
    await safeApi('POST', '/permissions', {
      policy: authPolicyId,
      collection: 'evenements_participants',
      action: 'delete',
      fields: ['*'],
      permissions: {}
    }, 'Permission: authentifie delete evenements_participants')
  }

  console.log('  ℹ Les admins (Directeur) ont deja le CRUD complet via admin_access')
}
