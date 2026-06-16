/**
 * Code PIN (4 chiffres) par profil vendeur. Idempotent.
 */
export default async function ({ safeApi }) {
  await safeApi('POST', '/fields/vendeurs', {
    field: 'pin', type: 'string',
    meta: { interface: 'input', sort: 6, note: 'Code PIN 4 chiffres (vide = pas de PIN)' },
    schema: { is_nullable: true }
  }, 'Field vendeurs.pin')
}
