# Architecture Decision Record: CRAIA Multi-Client Medusa v2 Platform

**Status:** Accepted with amendments  
**Date:** 2026-06-09  
**Authors:** CRAIA Engineering  
**Medusa version evaluated:** 2.15.x

---

## Table of Contents

1. [Context](#1-context)
2. [Reality Check — What the Proposal Gets Right and Wrong](#2-reality-check)
3. [Gap Analysis — What Is Missing](#3-gap-analysis)
4. [Decision — Revised Architecture](#4-decision)
5. [Component Breakdown](#5-component-breakdown)
6. [Consequences](#6-consequences)
7. [Alternatives Considered](#7-alternatives-considered)
8. [Medusa v2 Specific Constraints](#8-medusa-v2-specific-constraints)

---

## 1. Context

CRAIA is a Costa Rica-based dev agency deploying isolated Medusa.js v2 backends per ecommerce client. The goals are:

- True data and deployment isolation per client (separate DBs, separate Railway projects)
- Minimal manual work when onboarding a new client
- A reliable mechanism to propagate shared logic updates to all client deployments
- Pre-configured baseline: CR region, CRC/USD currencies, admin@craia.net user, base shipping zones

The proposed architecture uses:
- One private GitHub repo per client, templated from `shop`
- Shared logic in versioned npm packages published to GitHub Packages (`@craiahq/medusa-plugin-base`, `@craiahq/seed-cr`)
- Railway for hosting (one project per client, managed Postgres + Redis)
- GitHub Actions in the template repo that opens sync PRs across all client repos on new releases

---

## 2. Reality Check

### 2.1 What is solid

**Polyrepo with one repo per client** is the correct isolation model for an agency. Each client gets their own GitHub Actions, secrets, deployment pipeline, and branch history. Incidents in one client's CI don't cascade. Clients can be given repo access without exposing other clients. This is harder to operate than a monorepo but the isolation it provides is worth it at the agency model.

**Versioned npm packages for shared logic** is exactly how Medusa v2's plugin system is designed to work. A plugin is just an npm package that exports modules, routes, subscribers, and workflows. Pinning versions per client repo is the right model — it lets clients stay on a known-good version while you develop the next one.

**Railway for hosting** is a reasonable choice for the agency scale (1–20 clients). Managed Postgres, managed Redis, GitHub integration, and reasonable Node.js support make it operationally viable without requiring a Kubernetes cluster.

**Seed script approach** is correct. Medusa v2 has a well-defined seeding mechanism via `ExecArgs`-style scripts or direct module service calls. Pre-seeding regions, currencies, shipping zones, and the agency admin user is idiomatic.

### 2.2 What is harder than it sounds

**The GitHub Actions PR propagation mechanism** is the highest-risk component in this proposal. Here is what actually happens at scale:

- After 3–6 months, client repos will have diverged: custom modules, modified `medusa-config.ts`, extra routes, pinned dependency overrides.
- An automated PR that replaces base files will conflict on modified files in 40–80% of cases.
- At 10 clients, every template release generates 10 PRs, each potentially requiring manual conflict resolution.
- Developers will start ignoring the PRs because they're always broken, defeating the mechanism entirely.

This is a known failure mode of the "template sync via PRs" pattern. It needs a structural mitigation (see Section 4).

**Medusa v2 database migrations across clients** is completely unaddressed in the proposal and is a production blocker. When `@craiahq/medusa-plugin-base` adds a new data model, every client's database needs `medusa db:migrate` to run. There is no native mechanism to trigger this across N Railway deployments. Railway does not run pre-start scripts by default — you must explicitly configure a release command or a separate migrator service.

**GitHub Packages authentication** requires every repo to have `NODE_AUTH_TOKEN` configured as a GitHub secret, and every developer to have a GitHub PAT with `read:packages` scope in their `.npmrc`. Manageable for a small team but requires explicit onboarding documentation and breaks silently when tokens expire.

**Plugin version coupling with Medusa core** is non-trivial. Medusa v2's packages (`@medusajs/medusa`, `@medusajs/framework`, `@medusajs/cli`) are tightly coupled — they ship at the same version and must match. Your `@craiahq/medusa-plugin-base` must declare `peerDependencies` against `@medusajs/framework` with a version range. If you ship a plugin update that accidentally pulls in an incompatible Medusa core version via the sync PR, the client deployment breaks.

### 2.3 What will break at scale (10+ clients)

| Problem | Impact | Trigger |
|---|---|---|
| Diverged client repos make template sync PRs unappliable | Sync mechanism fails entirely | Clients applying client-specific customizations |
| `medusa db:migrate` not running automatically on deploy | Data model changes break production silently | Any plugin update that adds a DB column or table |
| Railway project setup is manual (no CLI automation) | Onboarding takes 1–2 hours of manual clicking | Each new client |
| Secrets managed per-repo with no rotation strategy | Stale or compromised credentials go undetected | Time and personnel changes |
| No migration rollback path | A bad plugin version bricks a client's DB | Plugin with a destructive migration |
| `admin@craia.net` as default admin on all shops | Access control model is implicit, not documented | Client asks "who has access to my shop?" |

---

## 3. Gap Analysis

### 3.1 Database migration orchestration

Every Medusa v2 deployment needs `medusa db:migrate` to run against its database before the application starts serving traffic. The proposal has no mechanism for this. Required: a Railway "run" or release command, or a dedicated migrator service.

**Medusa v2 specific detail:** When a plugin adds a new module with data models, the migration files are NOT in the plugin package. Mikro-ORM migrations must be generated (`medusa db:generate`) and committed to each client repo. Plugin updates that introduce new data models require a two-step process: update the plugin, run `medusa db:generate` to produce the migration file, commit it to the client repo, then deploy. This must be documented and enforced.

### 3.2 Client registry

The GitHub Actions workflow that opens PRs across all client repos requires a machine-readable registry of all client repos. The proposal does not specify where this registry lives, who maintains it, or how it handles clients that have been archived or offboarded.

### 3.3 Secrets management

10 clients × (JWT_SECRET, COOKIE_SECRET, DATABASE_URL, REDIS_URL, NODE_AUTH_TOKEN, STORE_CORS, ADMIN_CORS, AUTH_CORS) = 80+ secret values spread across GitHub Secrets and Railway environment variables. No rotation strategy, no audit trail, no centralization.

### 3.4 Railway provisioning automation

The proposal describes Railway as the hosting platform but doesn't address how Railway projects are created. Manual Railway project setup (create project, add Postgres service, add Redis service, link GitHub repo, set env vars, set custom domain) takes 30–60 minutes per client. At 10 clients, this is 10 hours of repetitive work with a high error rate.

### 3.5 Rollback strategy

What is the procedure when a plugin update introduces a breaking change or a bad migration? The proposal has no rollback path. Railway supports deployment rollbacks (roll back the container), but a rolled-back container still hits a migrated database. You need a DB snapshot before every migration run.

### 3.6 Storefront deployment

The proposal only addresses the Medusa backend. The `shop` repo already contains a Next.js storefront at `apps/storefront`. Where does each client's storefront live? Is it Vercel, Railway, or something else? The answer affects CORS configuration, build pipelines, and preview URL strategy.

### 3.7 Monitoring and observability

No mention of error tracking (Sentry), uptime checks, log aggregation, or alerting. At 10+ clients you cannot watch Railway logs manually.

### 3.8 Dependency pinning strategy

The current `apps/backend/package.json` pins `@medusajs/medusa` at `2.15.5`. When you release a template sync PR that bumps Medusa to `2.16.x`, clients are automatically getting a Medusa core upgrade alongside your plugin update. These should be decoupled.

---

## 4. Decision

The polyrepo isolation model is retained. The template sync mechanism is replaced with a dependency-update-based model (Renovate). Infrastructure provisioning is automated via a dedicated ops repository with Railway CLI scripts. Migration orchestration is solved at the Railway service level.

### 4.1 Architecture diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  medusa-ops (private, agency-internal)                           │
│  ├── clients.json          (registry of all client repos)       │
│  ├── scripts/              (Railway provisioning via CLI)        │
│  ├── .github/workflows/    (release orchestration)              │
│  └── renovate.json         (shared Renovate base config)        │
└─────────────────────────────────────────────────────────────────┘
                           │
              publishes to GitHub Packages
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  @craiahq/medusa-plugin-base  (npm package, GitHub Packages)       │
│  @craiahq/seed-cr             (npm package, GitHub Packages)       │
│                                                                  │
│  Versioned independently. Client repos pin to a specific version │
│  Changelog maintained. peerDependencies against @medusajs/       │
└──────────────────────────────────────────────────────────────────┘
                           │
              installed as dependency
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  shop (private GitHub template repo)            │
│  ├── apps/backend/          (Medusa v2 backend)                  │
│  │   ├── medusa-config.ts                                        │
│  │   ├── src/scripts/seed.ts                                     │
│  │   └── ...                                                     │
│  ├── apps/storefront/        (Next.js storefront)                │
│  ├── .github/workflows/                                          │
│  │   └── deploy.yml          (build → migrate → deploy)         │
│  ├── renovate.json           (extends medusa-ops base config)     │
│  └── railway.json            (Railway service config)            │
└──────────────────────────────────────────────────────────────────┘
                           │
              "Use this template" per client
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  medusa-[client-slug] (private client repo)                      │
│  └── identical structure, client customizations on top           │
│      Railway project linked to this repo                         │
│      Renovate Bot opens PRs for @craiahq/* version bumps           │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Template sync: dependency-driven, not file-replacement

Instead of a GitHub Actions workflow that replaces files across client repos (which conflicts), use **Renovate Bot** configured with auto-merge for patch bumps of `@craiahq/*` packages. Clients get plugin updates the same way they get any npm dependency update.

**What this solves:** No more PR conflicts on customized files. The update surface is strictly `package.json` version numbers, not file content.

**What this doesn't solve:** Changes to `medusa-config.ts` structure, `railway.json`, or GitHub Actions workflow files. Those changes must be communicated as release notes and applied manually or via a separate targeted PR workflow (see TEMPLATE-SYNC.md).

### 4.3 Railway provisioning: `medusa-ops` scripts

A `scripts/provision-client.sh` in the `medusa-ops` repo uses the Railway CLI to fully provision a new client environment in under 5 minutes:

1. Create Railway project
2. Add Postgres service (Railway-managed)
3. Add Redis service (Railway-managed)
4. Set required environment variables
5. Link GitHub repo for automatic deployments

See ONBOARDING.md for the full procedure.

### 4.4 Migration orchestration: Railway release command

Every Railway service has a `startCommand` and a `releaseCommand`. The release command runs after the new image is built but before the service is promoted to production, against the live database. Configure it as:

```
npx medusa db:migrate
```

This guarantees migrations run before every deployment, without a separate service or SSH access.

### 4.5 Secrets management: Railway Variable Groups + Doppler

- **Per-client secrets** (DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET): Managed in Railway environment variables. Railway injects these at runtime; they never appear in the GitHub repo.
- **Shared secrets** (NODE_AUTH_TOKEN for GitHub Packages): Managed as a Railway shared variable group called `craia-shared` and referenced across all projects. When the token rotates, update one value.
- **Local development**: Developers use `.env` files generated via `railway variables --format dotenv > .env` (requires Railway CLI). Never committed.

---

## 5. Component Breakdown

### 5.1 `@craiahq/medusa-plugin-base`

A standard Medusa v2 plugin package. Contains:
- Custom modules specific to CRAIA clients (loyalty, reviews, etc.)
- Shared API routes
- Shared workflows
- Shared subscribers and scheduled jobs

Must declare:
```json
{
  "peerDependencies": {
    "@medusajs/framework": ">=2.15.0 <3.0.0"
  }
}
```

**Migration caveat:** This plugin can export module definitions, but generated migration files live in the consuming project. When adding a data model to the plugin, the release notes must include instructions to run `medusa db:generate` in the client repo.

### 5.2 `@craiahq/seed-cr`

A standalone seed script package that uses Medusa's `ExecArgs`-pattern script interface. Configures:
- Region: Costa Rica (`CR`)
- Currency: CRC (primary), USD (optional)
- Default shipping zones
- Admin user: `admin@craia.net` (agency admin, not client admin)
- Publishable API key for the storefront

Must be idempotent: running it twice must not create duplicates. Use `upsert`-style logic or pre-check for existing entities.

### 5.3 `shop` repo

The GitHub Template repository. Key files that **must not be modified per-client** (owned by template):
- `.github/workflows/deploy.yml`
- `renovate.json`
- `railway.json`
- `apps/backend/package.json` (only `@craiahq/*` version lines are client-variable)

Key files that **are expected to diverge**:
- `apps/backend/medusa-config.ts` (plugins added per client)
- `apps/backend/src/` (custom modules per client)
- `apps/storefront/` (client branding and customizations)

### 5.4 Railway project structure per client

```
Railway Project: [client-name]-prod
├── Service: backend
│   ├── Source: GitHub → medusa-[client-slug] (main branch)
│   ├── Build: npm run build (in apps/backend)
│   ├── Release: npx medusa db:migrate
│   ├── Start: npm run start (in apps/backend)
│   └── Variables: MEDUSA_BACKEND_URL, JWT_SECRET, COOKIE_SECRET, DATABASE_URL, REDIS_URL, ...
├── Service: postgres (Railway-managed)
└── Service: redis (Railway-managed)
```

---

## 6. Consequences

### Positive

- Client isolation is complete: separate DB, separate Redis, separate Railway project, separate GitHub repo.
- Plugin updates propagate automatically via Renovate for patch/minor bumps without manual PR management.
- Railway release commands guarantee migrations run before every deploy.
- Railway Variable Groups reduce secret sprawl.
- Provisioning script reduces new client setup from ~60 minutes to ~5 minutes of automated work.

### Negative

- **Medusa v2 migration generation is still manual.** When `@craiahq/medusa-plugin-base` adds a data model, developers must run `medusa db:generate` in each affected client repo and commit the migration file. This cannot be automated without more infrastructure.
- **No single-pane-of-glass view** across all client deployments. Railway's dashboard is per-project. At 10+ clients, monitoring requires a third-party solution.
- **Renovate PRs still need review.** Auto-merge of patch bumps is safe; minor/major bumps should require human review. This means someone on the team watches Renovate PRs.
- **Template structural changes** (workflow files, railway.json) still require manual coordination across client repos.

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Plugin update breaks client DB migration | Medium | Pre-release migration testing on a staging Railway project; DB snapshot before release command |
| NODE_AUTH_TOKEN expires, npm install fails on deploy | Medium | Railway shared variable group; set calendar reminder for token expiry |
| Client repo diverges so far that Renovate PRs conflict | Low | Renovate handles package.json version bumps only; file conflicts don't occur |
| Railway free tier limits hit | High at 10+ clients | Budget for Railway Pro; use team plan for client projects |

---

## 7. Alternatives Considered

### 7.1 Monorepo (all clients in one repo)

**Rejected.** A monorepo would simplify tooling (single Turborepo, single CI) but creates unacceptable client isolation problems: shared GitHub secrets, risk of cross-client data access bugs, inability to give a client repo access without exposing others, and a single CI failure blocking all deployments.

### 7.2 Kubernetes with Helm charts

**Rejected for current scale.** Kubernetes with one Helm release per client is the right model at 50+ clients but introduces substantial operational overhead (cluster management, cert-manager, ingress controllers, PVC management) that is not justified at 1–20 clients. Railway's abstraction level is appropriate.

### 7.3 Copier / Cookiecutter for template sync

**Considered but not adopted.** Tools like Copier (Python) support "template update" workflows that can reapply template changes to derived projects with conflict resolution. This is more powerful than the PR-based approach but introduces a Python toolchain dependency and requires developers to run the update command locally rather than through CI. Viable if the Renovate-based approach proves insufficient.

### 7.4 Single Railway project, multiple environments

**Rejected.** Railway environments share the same service definitions and are not suitable for true client isolation. Each client needs their own Postgres and Redis instances, not shared ones with different env vars.

---

## 8. Medusa v2 Specific Constraints

These constraints are not obvious from the Medusa documentation and affect the architecture directly.

**8.1 Migrations are project-local, not plugin-local**

When a Medusa v2 plugin package exports a module with a data model, the migration files are generated in the *consuming project*, not in the plugin package. Running `medusa db:generate` in the client repo scans all registered modules (including plugin modules) and generates the appropriate migration files in `apps/backend/src/migrations/`. These must be committed. A plugin version bump that adds a data model is not a zero-touch operation.

**8.2 Module names must be camelCase**

Module `name` values in `defineModule()` must be camelCase. Dashes in module names cause silent runtime errors. Plugin modules should follow the naming convention `craiaPluginBase`, not `craia-plugin-base`.

**8.3 Medusa v2 requires Redis in production**

The current `medusa-config.ts` does not configure Redis. In production, Medusa v2 requires Redis for the event bus and the workflow engine. Without it, subscribers and workflows will not function. Add to `medusa-config.ts`:

```typescript
import { Modules } from "@medusajs/framework/utils"

export default defineConfig({
  // ...
  modules: [
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl: process.env.REDIS_URL },
    },
  ],
})
```

**8.4 All Medusa packages must be the same version**

`@medusajs/medusa`, `@medusajs/framework`, `@medusajs/cli`, `@medusajs/admin-sdk`, etc. must all be pinned to the same version. The template sync PR must bump all of these together. A partial upgrade (some at 2.15.x, some at 2.16.x) will cause runtime errors.

**8.5 Seed scripts use `ExecArgs` pattern**

Medusa v2 seed scripts are executed via `medusa exec ./src/scripts/seed.ts`. They receive a `{ container }` argument of type `MedusaContainer`. The script must resolve module services from the container, not import them directly.

**8.6 Plugin registration is in `medusa-config.ts`, not auto-discovered**

Unlike some frameworks, Medusa v2 does not auto-discover plugins. Each plugin must be explicitly registered in the `plugins` array of `medusa-config.ts`. The template should include the base plugin registration, and client customizations add to it.
