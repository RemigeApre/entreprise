/**
 * Ajoute les champs origine et niveau_site a la collection prospects.
 */
export default async function ({ safeApi }) {
  // ── origine ──
  await safeApi('POST', '/fields/prospects', {
    field: 'origine',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 3,
      note: 'Source de la prospection',
      options: {
        choices: [
          { text: 'Google Maps', value: 'google_maps' },
          { text: 'LinkedIn', value: 'linkedin' },
          { text: 'Pages Jaunes', value: 'pages_jaunes' },
          { text: 'Bouche a oreille', value: 'bouche_a_oreille' },
          { text: 'Salon / Evenement', value: 'salon' },
          { text: 'Site web', value: 'site_web' },
          { text: 'Autre', value: 'autre' }
        ]
      }
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ prospects.origine')

  // ── niveau_site ──
  await safeApi('POST', '/fields/prospects', {
    field: 'niveau_site',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      display: 'labels',
      sort: 4,
      note: 'Qualite du site web existant',
      options: {
        choices: [
          { text: 'Pas de site', value: 'pas_de_site' },
          { text: 'Site casse', value: 'site_casse' },
          { text: 'Site nul', value: 'site_nul' },
          { text: 'Site passable', value: 'site_passable' }
        ]
      }
    },
    schema: { is_nullable: true, default_value: null }
  }, 'Champ prospects.niveau_site')
}
