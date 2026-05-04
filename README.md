# Intranet Le Geai

Plateforme intranet et site public du groupe Le Geai.
Stack : **Nuxt 4** · **@nuxt/ui v4** · **Tailwind CSS 4** · **Directus 11** · **PostgreSQL** · **Docker**

---

## Architecture

```
entreprise/
├── frontend/          # Nuxt 4 — site public + intranet SPA
├── scripts/           # Migrations Directus (setup-directus.mjs + migrations/)
├── docker-compose.yml # Production (TOUJOURS utiliser -f docker-compose.yml)
└── docker-compose.override.yml  # Dev only — NE JAMAIS utiliser en prod
```

**Pages publiques** (SSR/prerender) : `/`, `/le-geai`, `/le-geai/**`, `/soutenir`, `/recrutement`, `/articles`
**Intranet** (SPA, `ssr: false`) : `/dashboard`, `/planning`, `/equipe`, `/projets`, `/offres`, `/candidats`, `/wiki`, etc.

---

## Déploiement VPS

### Frontend uniquement (cas standard)

```bash
cd ~/intranet/entreprise
git pull
docker compose -f docker-compose.yml build --no-cache frontend
docker compose -f docker-compose.yml up -d frontend
docker compose -f docker-compose.yml restart nginx
```

### Frontend + migrations Directus (quand les collections/permissions changent)

```bash
cd ~/intranet/entreprise
git pull
docker compose -f docker-compose.yml build --no-cache frontend
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml restart nginx
docker compose -f docker-compose.yml exec -e DIRECTUS_URL=http://localhost:8055 directus node /scripts/setup-directus.mjs
```

### ⚠️ Règles critiques

- **TOUJOURS** `-f docker-compose.yml` — sans ça, `docker-compose.override.yml` est chargé (bind port 80 = conflit NPM)
- **TOUJOURS** `restart nginx` après rebuild frontend (cache DNS du container)
- Chemin VPS : `~/intranet/entreprise/`
- NPM (Nginx Proxy Manager, container `bergfrid`) gère le reverse proxy sur les ports 80/443

---

## Développement local

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Variables d'environnement (`.env` à la racine) :
```
NUXT_DIRECTUS_URL=http://localhost:8055
NUXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
```

---

## Rôles & permissions

**2 rôles seulement** dans Directus :

| Rôle | Description |
|---|---|
| `Directeur` | Accès complet (gestion équipe, candidats, finance, etc.) — `admin_access: true` |
| `Membre` | Tout le reste. La distinction stagiaire / alternant / freelance / employé est portée par le champ `type_contrat` du user, pas par le rôle. |

Tous les rôles sont liés à la même policy **`Base Authentifié`** qui contient les permissions CRUD sur les collections métier (`planning_entries`, `schedule_entries`, `prospects`, etc.).

Côté code, `useAuth` expose `isDirecteur`, `hasSchoolDays`, `hasHourTracking` — ces deux derniers se basent désormais sur `type_contrat` (`Stage`/`Alternance` pour l'école, `Freelance`/`Stage`/`Alternance` pour le suivi horaire).

---

## Migrations Directus

Les migrations sont dans `scripts/migrations/` et exécutées dans l'ordre alphabétique par `scripts/setup-directus.mjs`.

| Fichier | Contenu |
|---------|---------|
| `001_seed_categories.mjs` | Catégories initiales |
| `002_seed_offres_emploi.mjs` | 5 offres de stage |
| `003_…` | … |
| `006_offres_emploi_permissions.mjs` | Permissions CRUD offres pour Directeur + Administrator |

Pour ajouter une migration : créer `scripts/migrations/NNN_nom.mjs` avec `export default async function ({ api, safeApi }) { … }`.

---

## SEO & Performance

### Pages publiques

- **Prerender** : `/`, `/le-geai`, `/le-geai/**`, `/soutenir` → HTML statique au build
- **SSR on demand** : `/recrutement`, `/articles` → rendu serveur à chaque requête (contenu Directus dynamique)
- **Schema.org** : Organization JSON-LD sur `/`, JobPosting JSON-LD sur `/recrutement` (dynamique)
- **robots.txt** : `public/robots.txt` — bloque crawlers sur toutes les routes intranet
- **Polices** : Crimson Pro + IM Fell DW Pica + UnifrakturCook — chargées avec `preload` + `preconnect`

### Performance

- Calques SVG noise : `will-change: transform` + `translateZ(0)` → compositing GPU
- Images décoratives (watermark) : `decoding="async"` + `fetchpriority="low"`
- Polices Playfair Display + Source Sans 3 supprimées de `app.vue` (n'étaient pas utilisées)
- `NuxtLoadingIndicator` (#AF8F3C, 2px) sur toutes les transitions de page
- Fond crème `#EDE5D0` en global CSS → zéro flash blanc avant hydratation SPA

---

## Structure Nuxt

```
frontend/app/
├── pages/
│   ├── index.vue              # Landing (prerender)
│   ├── le-geai/index.vue      # Entreprise (prerender)
│   ├── le-geai/transparence.vue
│   ├── soutenir.vue           # (prerender)
│   ├── recrutement.vue        # SSR, schema.org JobPosting
│   ├── articles.vue           # SSR
│   └── [intranet]/            # SPA (ssr: false)
├── layouts/
│   ├── landing.vue            # Pages fullscreen (index, recrutement, le-geai)
│   ├── public.vue             # Pages avec nav (articles, soutenir, transparence)
│   └── default.vue            # Intranet (sidebar + tabbar)
├── components/
├── composables/               # useAuth, usePlanning, useEvenements, etc.
├── middleware/
│   ├── auth.global.ts         # Vérifie le token Directus sur toutes les routes intranet
│   └── directeur.ts           # Restreint aux rôles Directeur/Administrator
└── utils/
    ├── types.ts
    ├── constants.ts
    └── dates.ts
```
