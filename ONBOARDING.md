# Client Onboarding Guide

**Audience:** CRAIA developers spinning up a new ecommerce client  
**Time to complete:** ~30 minutes (automated) + ~15 minutes (manual config steps)  
**Prerequisites:** See Section 0

---

## Table of Contents

0. [Prerequisites](#0-prerequisites)
1. [Create the Client GitHub Repo](#1-create-the-client-github-repo)
2. [Configure GitHub Secrets](#2-configure-github-secrets)
3. [Provision Railway Project](#3-provision-railway-project)
4. [Link GitHub Repo to Railway](#4-link-github-repo-to-railway)
5. [Configure Environment Variables in Railway](#5-configure-environment-variables-in-railway)
6. [Configure Railway Release Command (Migrations)](#6-configure-railway-release-command-migrations)
7. [First Deploy and Seed](#7-first-deploy-and-seed)
8. [Verify Deployment](#8-verify-deployment)
9. [Configure Storefront](#9-configure-storefront)
10. [Register Client in medusa-ops](#10-register-client-in-medusa-ops)
11. [Local Development Against medusa-ops](#11-local-development-against-medusa-ops)
12. [Handoff Checklist](#12-handoff-checklist)

---

## 0. Prerequisites

Before starting, ensure you have the following installed and authenticated:

```bash
# Node.js >= 20
node --version   # must be >= 20.0.0

# Railway CLI
npm install -g @railway/cli
railway login    # authenticates via browser

# GitHub CLI
brew install gh  # macOS
gh auth login    # authenticates via browser
```

You also need:
- Write access to the CRAIA GitHub organization
- Access to the `medusa-ops` private repo
- `NODE_AUTH_TOKEN` set in your environment — see below
- Access to the CRAIA Railway team account

### Setting up NODE_AUTH_TOKEN

`NODE_AUTH_TOKEN` is a GitHub PAT for the `p3rcha-craiabot` account with `read:packages` scope. Get it from the team password manager.

Add it in **two places** so both npm CLI and shell subprocesses see it:

```bash
# 1. Shell environment (new terminal sessions)
echo 'export NODE_AUTH_TOKEN=<token>' >> ~/.zshrc

# 2. Global npmrc (overrides project-level placeholder when env var is not yet loaded)
echo '//npm.pkg.github.com/:_authToken=<token>' >> ~/.npmrc

# Apply immediately in the current session
source ~/.zshrc
```

> The project's `.npmrc` references `${NODE_AUTH_TOKEN}`. If that env var is empty (e.g. before sourcing `.zshrc`), the global `~/.npmrc` entry acts as a fallback.

---

## 1. Create the Client GitHub Repo

### 1a. Use the GitHub template

```bash
CLIENT_SLUG="acme"   # use kebab-case, e.g., "farmacia-san-jose"

gh repo create CRAIAHQ/medusa-$CLIENT_SLUG \
  --template CRAIAHQ/medusa-template \
  --private \
  --clone
```

This creates a private repo under the CRAIA GitHub organization using the template. The `--clone` flag checks it out locally.

```bash
cd medusa-$CLIENT_SLUG
```

### 1b. Update project metadata

Open `apps/backend/package.json` and update the `name` field:

```json
{
  "name": "@craiahq/$CLIENT_SLUG-backend"
}
```

Open `apps/storefront/package.json` and update similarly:

```json
{
  "name": "@craiahq/$CLIENT_SLUG-storefront"
}
```

Commit and push:

```bash
git add apps/backend/package.json apps/storefront/package.json
git commit -m "chore: set client slug to $CLIENT_SLUG"
git push origin main
```

### 1c. Configure `.npmrc` for GitHub Packages

The `.npmrc` in the template already contains:

```
@craiahq:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Do not change this. `NODE_AUTH_TOKEN` must be the `p3rcha-craiabot` GitHub PAT (get it from the team password manager). Set it in your shell for local dev (see §0) and as a secret in Railway and GitHub Actions for CI/CD.

---

## 2. Configure GitHub Secrets

GitHub Actions needs secrets for CI (building the app, publishing to Railway).

```bash
# Set the GitHub Packages token so npm install can fetch @craiahq/* packages
gh secret set NODE_AUTH_TOKEN \
  --repo CRAIAHQ/medusa-$CLIENT_SLUG \
  --body "$(railway variables get NODE_AUTH_TOKEN --project craia-shared)"

# Set the Railway token for deployment
gh secret set RAILWAY_TOKEN \
  --repo CRAIAHQ/medusa-$CLIENT_SLUG \
  --body "<railway-project-token>"   # get this in step 3
```

> Note: `RAILWAY_TOKEN` is a per-project token. You will get it after creating the Railway project in step 3. Come back to set it.

---

## 3. Provision Railway Project

Use the provisioning script from the `medusa-ops` repo:

```bash
# From the medusa-ops directory:
./scripts/provision-client.sh $CLIENT_SLUG

# This script does the following:
# 1. Creates a new Railway project named "$CLIENT_SLUG-prod"
# 2. Adds a Postgres service (Railway-managed)
# 3. Adds a Redis service (Railway-managed)
# 4. Outputs the project ID and service IDs
```

If you need to provision manually, use the Railway CLI:

```bash
# Create the project
railway init --name "$CLIENT_SLUG-prod"

# Add Postgres (Railway-managed template)
railway add --plugin postgresql

# Add Redis (Railway-managed template)
railway add --plugin redis

# Get the project token (needed for GitHub Actions)
railway whoami  # find your project in the Railway dashboard to get the token
```

After creating the project, go to **Railway Dashboard → Project → Settings → Tokens** and generate a deployment token. This is the `RAILWAY_TOKEN` you set in step 2.

---

## 4. Link GitHub Repo to Railway

In Railway Dashboard:

1. Open the `$CLIENT_SLUG-prod` project
2. Click on the **backend** service (the Node.js app, not Postgres or Redis)
3. Under **Source**, select **GitHub Repo**
4. Search for and select `CRAIAHQ/medusa-$CLIENT_SLUG`
5. Set the **Root Directory** to `apps/backend`
6. Set the **Watch Paths** to `apps/backend/**`
7. Set branch to `main`

Railway will now deploy automatically on every push to `main`.

---

## 5. Configure Environment Variables in Railway

In Railway Dashboard → `$CLIENT_SLUG-prod` project → backend service → Variables:

### Required variables

| Variable | Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `NODE_AUTH_TOKEN` | `${{craia-shared.NODE_AUTH_TOKEN}}` | Railway shared variable reference |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-populated by Railway from the Postgres service |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Auto-populated by Railway from the Redis service |
| `JWT_SECRET` | Generate with `openssl rand -hex 32` | Never reuse across clients |
| `COOKIE_SECRET` | Generate with `openssl rand -hex 32` | Never reuse across clients |
| `STORE_CORS` | `https://$CLIENT_SLUG.store.craia.io` | Update when storefront URL is known |
| `ADMIN_CORS` | `https://$CLIENT_SLUG.admin.craia.io` | Update when admin URL is known |
| `AUTH_CORS` | `https://$CLIENT_SLUG.store.craia.io,https://$CLIENT_SLUG.admin.craia.io` | |
| `MEDUSA_BACKEND_URL` | `https://$CLIENT_SLUG.up.railway.app` | Railway auto-generates this domain |

### Generating secrets

```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate COOKIE_SECRET
openssl rand -hex 32
```

**Never copy these from another client.** Each client must have unique secrets.

### Shared variable references

Railway supports shared variable groups. The CRAIA team maintains a shared group called `craia-shared` that contains `NODE_AUTH_TOKEN`. Reference it in client projects as `${{craia-shared.NODE_AUTH_TOKEN}}` so that when the token rotates, all projects pick up the update automatically.

---

## 6. Configure Railway Release Command (Migrations)

This is critical. Without this step, database migrations will not run on deploy.

In Railway Dashboard → `$CLIENT_SLUG-prod` → backend service → Settings → Deploy:

- **Build Command:** `npm run build`
- **Release Command:** `npx medusa db:migrate`
- **Start Command:** `npm run start`

The release command runs after the build, against the live database, before traffic is switched to the new deployment. This ensures migrations always run before the new code goes live.

> **Important:** The first time you set this up on a fresh database, the release command will run all pending migrations. This is the intended behavior.

---

## 7. First Deploy and Seed

### 7a. Trigger the first deploy

Push a commit to `main` (the package.json update from step 1b works) or trigger a manual deploy from the Railway dashboard.

Watch the deploy logs:
```bash
railway logs --project $CLIENT_SLUG-prod
```

Expected sequence:
1. `npm ci` — installs dependencies (including `@craiahq/medusa-plugin-base`)
2. `npm run build` — compiles TypeScript
3. `npx medusa db:migrate` — runs all pending migrations against the Postgres DB
4. `npm run start` — starts the Medusa server

If the release command fails, the old version continues serving traffic. Check logs for migration errors.

### 7b. Generate migration files for plugin modules

If `@craiahq/medusa-plugin-base` introduces custom data models, you must generate migration files locally before the first deploy:

```bash
# In apps/backend directory
DATABASE_URL="<client-staging-or-local-db>" npx medusa db:generate

# This creates migration files in src/migrations/
# Commit them:
git add src/migrations/
git commit -m "chore: generate initial migrations for @craiahq/medusa-plugin-base"
git push origin main
```

This step must be repeated whenever `@craiahq/medusa-plugin-base` adds a new data model.

### 7c. Run the seed script

After the first successful deploy, run the seed script to pre-configure the CR baseline:

```bash
# From the Railway CLI, run a one-off command against the production environment
railway run --project $CLIENT_SLUG-prod --service backend \
  npx medusa exec src/scripts/seed.ts
```

Or SSH into the Railway service if the CLI run command is not available:

```bash
railway shell --project $CLIENT_SLUG-prod --service backend
# Inside the shell:
npx medusa exec src/scripts/seed.ts
```

The seed script configures:
- Region: Costa Rica (country code `CR`)
- Currency: CRC (primary), USD (secondary, optional)
- Base shipping zones for Costa Rica
- Admin user: `admin@craia.net` (CRAIA agency admin)

After seeding, the client should create their own admin user via the Medusa admin dashboard.

---

## 8. Verify Deployment

### 8a. Check the health endpoint

```bash
BACKEND_URL="https://$(railway domain --project $CLIENT_SLUG-prod)"
curl $BACKEND_URL/health
# Expected: {"status":"ok"}
```

### 8b. Access the admin dashboard

Open `$BACKEND_URL/app` in your browser. Log in with:
- Email: `admin@craia.net`
- Password: (set during seed — check `src/scripts/seed.ts`)

Verify:
- [ ] Login succeeds
- [ ] Costa Rica region exists
- [ ] CRC currency is set as default
- [ ] USD currency is available
- [ ] Shipping zones are configured

### 8c. Check Redis connection

In the Medusa admin, attempt to perform an action that triggers an event (e.g., create a product). If Redis is not connected, you'll see errors in Railway logs. The log line to look for on successful Redis connection:

```
[EventBus] Connected to Redis at redis://...
```

---

## 9. Configure Storefront

The storefront lives at `apps/storefront/` in the same repo. It's a Next.js application.

### 9a. Set storefront environment variables

In Railway, add a new service for the storefront (or deploy to Vercel — see team preference):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://$CLIENT_SLUG.up.railway.app` |
| `NEXT_PUBLIC_BASE_URL` | `https://$CLIENT_SLUG-store.up.railway.app` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `cr` |

### 9b. Create a Publishable API Key

In the Medusa admin → Settings → Publishable API Keys → Create. Name it `storefront-prod`. Copy the key.

Add it to storefront environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` |

### 9c. Update CORS in backend

Once the storefront URL is known (Railway domain or custom domain), update `STORE_CORS` and `AUTH_CORS` in the Railway backend service variables.

---

## 10. Register Client in medusa-ops

Add the client to the registry so it receives template sync notifications:

```bash
# In the medusa-ops repo, edit clients.json:
{
  "clients": [
    {
      "slug": "$CLIENT_SLUG",
      "repo": "CRAIAHQ/medusa-$CLIENT_SLUG",
      "railway_project": "$CLIENT_SLUG-prod",
      "onboarded": "2026-06-09",
      "contact": "client-contact@email.com"
    }
  ]
}
```

Commit and push to `medusa-ops`. This ensures the client repo receives Renovate PRs and template sync notifications.

---

## 11. Local Development Against medusa-ops

When iterating on `@craiahq/medusa-plugin-base` locally alongside a client repo, use `yalc` instead of publishing to GitHub Packages each time. `yalc` is already in `apps/backend` devDependencies.

**One-time setup** (per machine):
```bash
npm install -g yalc
```

**Workflow:**

```bash
# In medusa-ops — after any change:
npm run build && yalc push
# yalc push rebuilds and hot-updates all linked consumers automatically
```

```bash
# In medusa-template/apps/backend — first time only:
yalc add @craiahq/medusa-plugin-base
# This rewrites the dependency to file:.yalc/@craiahq/medusa-plugin-base
# Subsequent `yalc push` calls update it in place — no re-linking needed
```

**Before committing / deploying** — restore the registry version:
```bash
cd medusa-template/apps/backend
yalc remove @craiahq/medusa-plugin-base
npm install
```

> `.yalc/` and `yalc.lock` are in `.gitignore`. Never commit them.

---

## 12. Handoff Checklist

Before marking onboarding as complete:

**Infrastructure**
- [ ] GitHub repo created at `CRAIAHQ/medusa-$CLIENT_SLUG`
- [ ] `NODE_AUTH_TOKEN` GitHub secret set
- [ ] `RAILWAY_TOKEN` GitHub secret set
- [ ] Railway project `$CLIENT_SLUG-prod` created
- [ ] Postgres service running
- [ ] Redis service running
- [ ] GitHub repo linked to Railway backend service

**Configuration**
- [ ] All required environment variables set in Railway
- [ ] JWT_SECRET and COOKIE_SECRET are unique (not copied from another client)
- [ ] Release command set to `npx medusa db:migrate`
- [ ] Build and start commands correct

**Deployment**
- [ ] First deploy succeeded (check Railway logs)
- [ ] Migrations ran successfully
- [ ] Seed script ran (`/health` returns 200, admin login works)
- [ ] CR region and CRC currency visible in admin

**Storefront**
- [ ] Storefront deployed (Railway or Vercel)
- [ ] `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` set
- [ ] CORS updated in backend to allow storefront URL

**Registry**
- [ ] Client added to `medusa-ops/clients.json`
- [ ] Renovate PRs will appear within 24 hours of next `@craiahq/*` release

**Client**
- [ ] Client has created their own admin user
- [ ] `admin@craia.net` password changed or account purpose communicated to client
