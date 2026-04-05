/**
 * Cree les collections pour la page "Les Anciens" :
 * - retex_anciens : retour d'experience (avis + note 0-5)
 * - soutiens_anciens : email d'une personne a soutenir
 */
export default async function ({ safeApi }) {
  // ── Collection retex_anciens ──
  await safeApi('POST', '/collections', {
    collection: 'retex_anciens',
    meta: { icon: 'star', note: 'Retours d\'experience des anciens', sort: 50 },
    schema: {}
  }, 'Collection retex_anciens')

  await safeApi('POST', '/fields/retex_anciens', {
    field: 'utilisateur',
    type: 'uuid',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values' },
    schema: { is_nullable: false }
  }, 'Champ retex_anciens.utilisateur')

  await safeApi('POST', '/relations', {
    collection: 'retex_anciens',
    field: 'utilisateur',
    related_collection: 'directus_users'
  }, 'Relation retex_anciens.utilisateur -> directus_users')

  await safeApi('POST', '/fields/retex_anciens', {
    field: 'note',
    type: 'integer',
    meta: { interface: 'input', note: 'Note de 0 a 5' },
    schema: { is_nullable: false, default_value: 0 }
  }, 'Champ retex_anciens.note')

  await safeApi('POST', '/fields/retex_anciens', {
    field: 'commentaire',
    type: 'text',
    meta: { interface: 'input-multiline', note: 'Avis libre' },
    schema: { is_nullable: true }
  }, 'Champ retex_anciens.commentaire')

  // ── Collection soutiens_anciens ──
  await safeApi('POST', '/collections', {
    collection: 'soutiens_anciens',
    meta: { icon: 'favorite', note: 'Soutiens deposes par les anciens', sort: 51 },
    schema: {}
  }, 'Collection soutiens_anciens')

  await safeApi('POST', '/fields/soutiens_anciens', {
    field: 'depose_par',
    type: 'uuid',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], display: 'related-values' },
    schema: { is_nullable: false }
  }, 'Champ soutiens_anciens.depose_par')

  await safeApi('POST', '/relations', {
    collection: 'soutiens_anciens',
    field: 'depose_par',
    related_collection: 'directus_users'
  }, 'Relation soutiens_anciens.depose_par -> directus_users')

  await safeApi('POST', '/fields/soutiens_anciens', {
    field: 'email_soutenu',
    type: 'string',
    meta: { interface: 'input', note: 'Email de la personne a soutenir' },
    schema: { is_nullable: false }
  }, 'Champ soutiens_anciens.email_soutenu')

  await safeApi('POST', '/fields/soutiens_anciens', {
    field: 'message',
    type: 'text',
    meta: { interface: 'input-multiline', note: 'Message optionnel' },
    schema: { is_nullable: true }
  }, 'Champ soutiens_anciens.message')

  // ── Permissions pour les utilisateurs avec statut termine ──
  // On utilise le role Membre (pas admin) - ils doivent pouvoir creer et lire leurs propres items
  // Les permissions doivent etre ajustees selon le role ID reel dans setup-directus.mjs
}
