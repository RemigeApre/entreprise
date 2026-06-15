/**
 * Personnalisation des profils vendeurs : icone + couleur. Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/vendeurs', {
    field: 'icone', type: 'string',
    meta: { interface: 'input', sort: 4, note: 'Nom d\'icone (ex: i-lucide-crown)' },
    schema: { is_nullable: true, default_value: 'i-lucide-user' }
  }, 'Field vendeurs.icone')

  await safeApi('POST', '/fields/vendeurs', {
    field: 'couleur', type: 'string',
    meta: { interface: 'select-color', sort: 5, note: 'Couleur du profil' },
    schema: { is_nullable: true, default_value: '#AF8F3C' }
  }, 'Field vendeurs.couleur')
}
