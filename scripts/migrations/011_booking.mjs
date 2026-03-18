/**
 * Crée les collections recruteur_disponibilites et candidat_booking_tokens.
 * Ajoute discord_id à la collection candidats.
 */
export default async function ({ safeApi }) {
  // ── recruteur_disponibilites ──────────────────────────────
  await safeApi('POST', '/collections', {
    collection: 'recruteur_disponibilites',
    meta: { icon: 'schedule', note: 'Plages de disponibilite du recruteur pour les RDV candidats', singleton: false }
  }, 'Collection recruteur_disponibilites')

  const dispFields = [
    {
      field: 'jour_semaine', type: 'integer',
      meta: { interface: 'select-dropdown', display: 'raw', sort: 1, note: '1=Lundi…5=Vendredi',
        options: { choices: [
          { text: 'Lundi', value: 1 }, { text: 'Mardi', value: 2 },
          { text: 'Mercredi', value: 3 }, { text: 'Jeudi', value: 4 }, { text: 'Vendredi', value: 5 }
        ] } },
      schema: { is_nullable: false, default_value: 1 }
    },
    {
      field: 'heure_debut', type: 'string',
      meta: { interface: 'input', sort: 2, note: 'Format "09:00"' },
      schema: { is_nullable: false, default_value: '09:00' }
    },
    {
      field: 'heure_fin', type: 'string',
      meta: { interface: 'input', sort: 3, note: 'Format "12:00"' },
      schema: { is_nullable: false, default_value: '12:00' }
    },
    {
      field: 'canaux', type: 'json',
      meta: { interface: 'tags', sort: 4, note: 'visio, telephone, physique' },
      schema: { is_nullable: true, default_value: '["visio","telephone"]' }
    },
    {
      field: 'note', type: 'text',
      meta: { interface: 'input-multiline', sort: 5, note: 'Infos supplementaires (ex: adresse pour les RDV physiques)' },
      schema: { is_nullable: true, default_value: null }
    },
    {
      field: 'actif', type: 'boolean',
      meta: { interface: 'boolean', sort: 6 },
      schema: { is_nullable: false, default_value: true }
    }
  ]
  for (const f of dispFields) {
    await safeApi('POST', '/fields/recruteur_disponibilites', f, `Field recruteur_disponibilites.${f.field}`)
  }

  // ── candidat_booking_tokens ───────────────────────────────
  await safeApi('POST', '/collections', {
    collection: 'candidat_booking_tokens',
    meta: { icon: 'link', note: 'Tokens de prise de RDV envoyes aux candidats', singleton: false }
  }, 'Collection candidat_booking_tokens')

  const tokenFields = [
    {
      field: 'token', type: 'string',
      meta: { interface: 'input', sort: 1 },
      schema: { is_nullable: false, is_unique: true }
    },
    {
      field: 'expires_at', type: 'timestamp',
      meta: { interface: 'datetime', sort: 2 },
      schema: { is_nullable: false }
    },
    {
      field: 'utilise', type: 'boolean',
      meta: { interface: 'boolean', sort: 3 },
      schema: { is_nullable: false, default_value: false }
    },
    {
      field: 'candidat', type: 'uuid',
      meta: { interface: 'select-dropdown-m2o', sort: 4 },
      schema: { is_nullable: false, foreign_key_table: 'candidats', foreign_key_column: 'id' }
    }
  ]
  for (const f of tokenFields) {
    await safeApi('POST', '/fields/candidat_booking_tokens', f, `Field candidat_booking_tokens.${f.field}`)
  }

  await safeApi('POST', '/relations', {
    collection: 'candidat_booking_tokens',
    field: 'candidat',
    related_collection: 'candidats'
  }, 'Relation candidat_booking_tokens → candidats')

  // ── discord_id sur candidats ──────────────────────────────
  await safeApi('POST', '/fields/candidats', {
    field: 'discord_id',
    type: 'string',
    schema: { is_nullable: true, default_value: null },
    meta: { interface: 'input', sort: 18, note: 'Pseudo Discord du candidat (pour les entretiens en visio Discord)' }
  }, 'Field candidats.discord_id')
}
