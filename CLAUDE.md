# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

This is the **CRAIA agency GitHub Template** for client ecommerce deployments. Each client gets a private repo created from this template. The repo is a monorepo (npm workspaces + Turborepo) with two apps:

- `apps/backend` — Medusa v2 backend (port 9000, admin at `/app`)
- `apps/storefront` — Next.js 15 storefront (port 8000)

Shared logic lives in the `@craiahq/medusa-plugin-base` npm package (hosted on GitHub Packages under the CRAIAHQ org). Client repos receive plugin updates via Renovate Bot PRs rather than file-replacement sync PRs.

## Commands

All commands use `npm` (not pnpm — the README is outdated on this).

**From repo root:**
```bash
npm run dev              # start both apps
npm run backend:dev      # backend only
npm run storefront:dev   # storefront only
npm run build            # build both via turbo
npm run backend:seed     # run seed script
```

**Backend (`apps/backend`):**
```bash
npm run dev              # medusa develop (hot reload)
npm run build            # medusa build
npm run seed             # medusa exec src/scripts/seed.ts
npm run test:unit
npm run test:integration:http
npm run test:integration:modules
npx medusa db:migrate    # run pending migrations
npx medusa db:generate   # generate migration files after data model changes
npx medusa user -e admin@craia.net -p <password>  # create admin user (never done in seed)
```

**Storefront (`apps/storefront`):**
```bash
npm run dev              # next dev --turbopack on port 8000
npm run lint
npm run build
```

## Local Setup

1. Copy `apps/backend/.env.template` → `apps/backend/.env` and fill in `DATABASE_URL`, `REDIS_URL`, CORS vars.
2. Set `NODE_AUTH_TOKEN` in your shell (`~/.zshrc`) to the shared bot token from the team password manager. This authenticates npm to install `@craiahq/medusa-plugin-base` from GitHub Packages. The root `.npmrc` and `apps/backend/.npmrc` both read this variable automatically.
3. Copy `apps/storefront/.env.template` → `apps/storefront/.env.local` and set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (retrieved from admin → Settings → Publishable API Keys after seeding).
4. Run `npx medusa db:migrate` in `apps/backend` before first start.
5. Run seed: `npm run backend:seed` from root.
6. Create admin user manually (seed script intentionally skips this to avoid plaintext password storage).

## Architecture

### Deployment

Railway hosts the backend. `apps/backend/railway.json` configures:
- Build: `npm ci && npm run build`
- Release (runs before traffic cutover): `npx medusa db:migrate`
- Start: `npm run start`

GitHub Actions (`.github/workflows/deploy.yml`) only validates builds on push to `main`. Actual deployment is triggered by Railway's GitHub integration, not by CI.

The storefront deploys separately (Vercel).

### Plugin System

`medusa-config.ts` explicitly registers `@craiahq/medusa-plugin-base`. Additional plugins for a specific client are added to the `plugins` array here. Medusa v2 does **not** auto-discover plugins.

### Seed Script

`apps/backend/src/scripts/seed.ts` is idempotent and configures:
- Store currencies: CRC (default) + USD
- Region: Costa Rica (`cr`), currency CRC
- Tax region: `cr` via `tp_system`
- Stock location: Bodega Central CR, San José
- Fulfillment set: Entrega Costa Rica (shipping, geo: CR)
- Shipping options: Envío Estándar (₡3,500 / $8) and Envío Express (₡8,000 / $18)
- Publishable API key linked to default sales channel
- Inventory levels for all existing product variants (qty: 1,000,000)
- CRC prices on all existing product variants

Admin user creation is deliberately excluded — use `npx medusa user` CLI instead.

## Medusa v2 Constraints

- **All `@medusajs/*` packages must be the same version** (currently `2.15.5`). Partial upgrades cause runtime errors.
- **Migrations are project-local, not plugin-local.** When `@craiahq/medusa-plugin-base` adds a data model, run `medusa db:generate` in `apps/backend` and commit the generated migration file. Plugin version bumps that add data models are not zero-touch.
- **Module names must be camelCase** in `defineModule()`. Dashes cause silent runtime errors.
- **Redis is required in production.** Already configured in `medusa-config.ts` via `event-bus-redis` and `cache-redis` modules.
- **Seed scripts receive `{ container: MedusaContainer }`.** Resolve services from the container — do not import them directly.

## Environment Variables

Whenever you add or modify an environment variable in code (e.g. in `medusa-config.ts`, a module, or a workflow), update `apps/backend/.env.template` to reflect the change — add the new var with an empty or sensible default value and a comment explaining what it is.

## Files: Template-Owned vs. Client-Variable

These files should **not** be modified per-client (owned by template releases):
- `.github/workflows/deploy.yml`
- `renovate.json`
- `apps/backend/railway.json`

These files **are expected to diverge** per client:
- `apps/backend/medusa-config.ts` (add client plugins here)
- `apps/backend/src/` (custom modules, routes, workflows)
- `apps/storefront/` (client branding)
