# Backend — Medusa v2

Medusa v2 backend for CRAIA client deployments. Runs on port 9000, admin dashboard at `/app`.

## Stack

- **Medusa** 2.15.x (all `@medusajs/*` packages must be the same version)
- **Node.js** 22+
- **PostgreSQL** 15+ (Railway-managed in production)
- **Redis** (Railway-managed in production — required for event bus and workflow engine)
- **`@craiahq/medusa-plugin-base`** — shared CRAIA plugin (installed from GitHub Packages)

## Local Setup

```bash
# From repo root — installs all workspace deps
npm install

# Copy and fill in env vars
cp .env.template .env

# Run pending migrations
npx medusa db:migrate

# Seed baseline data (CR region, CRC/USD, shipping zones, publishable key)
npm run seed

# Start with hot reload
npm run dev
```

Requires `NODE_AUTH_TOKEN` in your shell to install `@craiahq/medusa-plugin-base` from GitHub Packages. Get the token from the team password manager.

## Commands

```bash
npm run dev                          # medusa develop (hot reload)
npm run build                        # medusa build
npm run seed                         # medusa exec src/scripts/seed.ts
npm run start                        # production start
npm run test:unit
npm run test:integration:http
npm run test:integration:modules
npx medusa db:migrate                # run pending migrations
npx medusa db:generate               # generate migrations after data model changes
npx medusa user -e <email> -p <pw>  # create admin user
```

## Environment Variables

See `.env.template` for the full list with descriptions. Required variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Random 32-byte hex (`openssl rand -hex 32`) |
| `COOKIE_SECRET` | Random 32-byte hex (`openssl rand -hex 32`) |
| `STORE_CORS` | Storefront origin (e.g. `http://localhost:8000`) |
| `ADMIN_CORS` | Admin origin (e.g. `http://localhost:9000`) |
| `AUTH_CORS` | Auth origin (same as admin in most cases) |
| `MEDUSA_BACKEND_URL` | Public URL of this backend |

## Project Structure

```
src/
├── admin/          # Admin dashboard extensions (widgets, routes)
├── api/            # Custom API routes
├── jobs/           # Scheduled jobs
├── links/          # Module links
├── modules/        # Custom Medusa modules
├── scripts/
│   └── seed.ts     # Idempotent seed script
├── subscribers/    # Event subscribers
└── workflows/      # Custom workflows
```

## Key Constraints

- All `@medusajs/*` packages must be pinned to the same version. Partial upgrades cause runtime errors.
- Module names in `defineModule()` must be camelCase. Dashes cause silent runtime errors.
- Migrations live in this project, not in the plugin. After bumping `@craiahq/medusa-plugin-base` to a version that adds a data model, run `npx medusa db:generate` and commit the generated file.
- Redis is required in production. The event bus and workflow engine will not function without it.
- Seed scripts receive `{ container: MedusaContainer }` — resolve services from the container, do not import them directly.

## Deployment

Railway deploys automatically on push to `main`. The release command runs `npx medusa db:migrate` before traffic cutover. See `railway.json` for the full service configuration.
