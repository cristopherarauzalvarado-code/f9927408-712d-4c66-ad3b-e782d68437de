# CRAIA Ecommerce Template

[![CI](https://github.com/CRAIAHQ/medusa-template/actions/workflows/deploy.yml/badge.svg)](https://github.com/CRAIAHQ/medusa-template/actions/workflows/deploy.yml)

Private GitHub Template used by CRAIA to spin up isolated Medusa v2 ecommerce deployments for each client. Each client gets their own private repo created from this template.

## Estado — Fase de prueba (rama `setup/fase-de-prueba`)

> Trabajo en curso en esta rama (no mergeado a `main`). Detalle completo en [docs/SETUP-FASE-PRUEBA.md](./docs/SETUP-FASE-PRUEBA.md) y [docs/DEPLOY-PRODUCCION.md](./docs/DEPLOY-PRODUCCION.md).

- ✅ **ONVO Pay funcionando end-to-end** en local (test mode). Se corrigió un bug del plugin en el webhook (`payment-intent.succeeded` con guion + `session_id`/`amount`) — override local en `apps/backend/src/modules/onvo-pay/` y fix upstream en `medusa-ops` (rama `fix/onvo-webhook-capture`).
- ✅ **Diseño del storefront** migrado desde `CRAIAHQ/Ecommerce-test` + rediseño del paso de pago.
- ✅ **Backend desplegado en Railway** (`craia-prod`): https://medusa-template-production.up.railway.app — incluye 8 fixes al `railway.json` necesarios para Medusa v2 en Railway (documentados en DEPLOY-PRODUCCION.md).
- ⏸️ **Storefront (Vercel) pausado** — Vercel pide plan Pro para repos privados de org; decisión de plan pendiente con el equipo.

## Stack

| Layer | Tech |
|---|---|
| Backend | Medusa v2 (2.15.x) — Node.js, TypeScript |
| Storefront | Next.js 15 + React 19 |
| Database | PostgreSQL (Railway-managed) |
| Cache / Events | Redis (Railway-managed) |
| Backend hosting | Railway |
| Storefront hosting | Vercel |
| Shared plugin | `@craiahq/medusa-plugin-base` (GitHub Packages) |
| Dependency updates | Renovate Bot |

## Repo Structure

```
.
├── apps/
│   ├── backend/       # Medusa v2 backend (port 9000, admin at /app)
│   └── storefront/    # Next.js 15 storefront (port 8000)
├── package.json       # npm workspaces root
├── turbo.json
└── renovate.json
```

## Local Setup

**Prerequisites:** Node.js 22+, PostgreSQL 15+, Redis, `NODE_AUTH_TOKEN` set in your shell (GitHub PAT with `read:packages` — get it from the team password manager).

```bash
# 1. Install dependencies
npm install

# 2. Set up backend env
cp apps/backend/.env.template apps/backend/.env
# Fill in DATABASE_URL, REDIS_URL, and CORS vars

# 3. Set up storefront env
cp apps/storefront/.env.template apps/storefront/.env.local
# Fill in NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (from admin after seeding)

# 4. Run migrations
cd apps/backend && npx medusa db:migrate

# 5. Seed baseline data (CR region, CRC/USD, shipping options)
cd ../.. && npm run backend:seed

# 6. Create admin user
cd apps/backend && npx medusa user -e admin@craia.net -p <password>

# 7. Start everything
cd ../.. && npm run dev
```

Backend: `http://localhost:9000` — Admin: `http://localhost:9000/app`
Storefront: `http://localhost:8000`

## Commands

```bash
npm run dev              # start both apps
npm run backend:dev      # backend only
npm run storefront:dev   # storefront only
npm run build            # build both via turbo
npm run backend:seed     # run seed script
```

## Deployment

- **Backend:** Railway deploys automatically on push to `main` via GitHub integration. The release command (`npx medusa db:migrate`) runs before traffic cutover.
- **Storefront:** Vercel deploys automatically on push to `main`.
- **CI:** GitHub Actions validates both builds on every push and PR touching `apps/`. Docs-only changes are skipped.

## Creating a New Client

See [ONBOARDING.md](./ONBOARDING.md) for the full procedure. The short version: use this repo as a GitHub Template, run the provisioning script from `medusa-ops`, set env vars in Railway, deploy.

## Template Ownership

Some files are owned by this template and should not be modified per-client:

- `.github/workflows/deploy.yml`
- `renovate.json`
- `apps/backend/railway.json`

Files expected to diverge per client:

- `apps/backend/medusa-config.ts`
- `apps/backend/src/`
- `apps/storefront/`

See [TEMPLATE-SYNC.md](./TEMPLATE-SYNC.md) for how updates propagate to existing client repos.
