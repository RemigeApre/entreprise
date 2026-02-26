# Commandes - Intranet Le Geai

## Demarrage local (dev)

```bash
# Lancer toute la stack (Postgres + Directus + Frontend + Nginx)
docker compose up -d

# Premiere fois uniquement : initialiser le schema et les permissions Directus
docker compose exec -e DIRECTUS_URL=http://localhost:8055 directus node /scripts/setup-directus.mjs
```

Acces :
- Site : http://localhost
- Directus admin : http://localhost:8060/admin
- API : http://localhost/api

---

## Apres une modification du code frontend

```bash
# Rebuild + relance du container frontend
docker compose up -d --build frontend
```

---

## Apres une modification des permissions / collections Directus

```bash
# Relancer le script de setup (idempotent, ne casse rien)
docker compose exec -e DIRECTUS_URL=http://localhost:8055 directus node /scripts/setup-directus.mjs
```

---

## Logs et debug

```bash
# Voir les logs de tous les services
docker compose logs -f

# Logs d'un service specifique
docker compose logs -f frontend
docker compose logs -f directus
docker compose logs -f nginx
docker compose logs -f db
```

---

## Arreter / redemarrer

```bash
# Arreter tout
docker compose down

# Arreter et supprimer les volumes (reset complet de la BDD)
docker compose down -v

# Redemarrer un service
docker compose restart frontend
docker compose restart directus
```

---

## Production

```bash
# Build et deploy (sans le override dev)
docker compose -f docker-compose.yml up -d --build
```

---

## Frontend seul (hors Docker, dev rapide)

```bash
cd frontend
npm install
npm run dev
```

Necessite que Directus tourne deja (via Docker ou distant).

---

## Comptes de test

| Role       | Email                     | Mot de passe |
|------------|---------------------------|--------------|
| Directeur  | admin@legeai-editions.com | (voir .env)  |
| Employe    | employe@legeai.fr         | Test1234!    |
| Freelance  | freelance@legeai.fr       | Test1234!    |
| Alternant  | alternant@legeai.fr       | Test1234!    |
| Stagiaire  | stagiaire@legeai.fr       | Test1234!    |

---

## Fichiers de config cles

| Fichier                        | Role                                    |
|--------------------------------|-----------------------------------------|
| `.env`                         | Variables d'environnement (copier `.env.example`) |
| `docker-compose.yml`           | Stack production                        |
| `docker-compose.override.yml`  | Overrides dev (ports, logs, cache off)  |
| `nginx/nginx.conf`             | Nginx production                        |
| `nginx/nginx.dev.conf`         | Nginx dev                               |
| `frontend/nuxt.config.ts`      | Config Nuxt (proxy API, SSR, icons)     |
| `scripts/setup-directus.mjs`   | Schema + permissions + seed Directus    |
