# CRAIA Multi-Client Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the two missing repos (`@craia/medusa-plugin-base` and `medusa-ops`) that complete the multi-client Medusa v2 platform described in ARCHITECTURE.md, making new client onboarding a ~5-minute automated operation.

**Architecture:** `@craia/medusa-plugin-base` is a standalone Medusa v2 plugin npm package published to GitHub Packages — every client repo installs it as a dependency and Renovate keeps it updated automatically. `medusa-ops` is a private agency ops repo containing the client registry, Railway provisioning script, and structural template sync workflow. The `shop` template repo (already complete) consumes the plugin and reads its config from `medusa-ops`.

**Tech Stack:** Medusa v2.15.x, TypeScript, GitHub Packages (npm), GitHub Actions, Railway CLI, Renovate Bot

---

## Legend

- 🤖 **Claude does this** — run in this session
- 👤 **You do this** — manual action required outside this codebase
- ⏱ **Reminder set** — a scheduled agent will ping you for this item

---

## Phase 0 — Prerequisites (All 👤)

These must be done before any code is written. None take more than 5 minutes each.

### Task 0.1 — GitHub org exists ⏱

- [ ] **👤 Verify or create the `CRAIAHQ` GitHub organization**

  Go to https://github.com/organizations/new. If `CRAIAHQ` already exists and you own it, skip.

- [ ] **👤 Create a GitHub PAT (classic) with these scopes:**
  - `repo` (full repo access — needed to open PRs in client repos)
  - `read:packages` + `write:packages` (publish and install from GitHub Packages)
  - `workflow` (needed to trigger/create GitHub Actions workflows)

  Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token.
  Save the token value — you will use it in Tasks 0.2, 1.5, and 2.4.

  Label it: `CRAIA_GITHUB_TOKEN` — expires in 1 year, set a calendar reminder.

- [ ] **👤 Commit: nothing to commit here — this is setup only.**

---

### Task 0.2 — Railway team account ⏱

- [ ] **👤 Sign in to Railway and create or confirm you have a team plan**

  Railway free tier caps at 1 project. Client isolation requires one project per client.
  Team plan: https://railway.com/pricing

- [ ] **👤 Install the Railway CLI locally:**

  ```bash
  npm install -g @railway/cli
  railway login
  ```

  Verify: `railway whoami` should print your account email.

- [ ] **👤 Create a Railway shared variable group called `craia-shared`:**

  Dashboard → your team → Settings → Shared Variables → New Group → name it `craia-shared`.
  Add variable: `NODE_AUTH_TOKEN` = the GitHub PAT from Task 0.1.

  This single value is referenced in all client projects as `${{craia-shared.NODE_AUTH_TOKEN}}`.

---

## Phase 1 — `@craia/medusa-plugin-base` package

This is a new repository — not a subdirectory of `shop`. It gets created at `/Users/josue/Documents/code/craia/medusa-plugin-base/`.

### Task 1.1 — Scaffold the plugin package 🤖

**Files to create:**
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `.npmrc`
- `.gitignore`
- `CHANGELOG.md`
- `.github/workflows/publish.yml`

- [ ] **🤖 Claude creates the full scaffold**

  Run: ask Claude to execute Task 1.1.

---

### Task 1.2 — Add plugin to the template repo 🤖

**Files to modify:**
- `apps/backend/package.json` — add `@craia/medusa-plugin-base` to dependencies
- `apps/backend/medusa-config.ts` — register the plugin in the `plugins` array

- [ ] **🤖 Claude adds the dependency and registration**

  After this task, the template backend imports and registers the plugin. The version
  pin starts at `0.1.0`.

---

### Task 1.3 — Create the GitHub repo 👤 ⏱

- [ ] **👤 Create a new private repo: `CRAIAHQ/medusa-plugin-base`**

  ```bash
  cd /Users/josue/Documents/code/craia/medusa-plugin-base
  git init
  git add .
  git commit -m "feat: initial plugin scaffold"
  gh repo create CRAIAHQ/medusa-plugin-base --private --source=. --push
  ```

- [ ] **👤 Add the `NODE_AUTH_TOKEN` secret to the repo:**

  ```bash
  gh secret set NODE_AUTH_TOKEN \
    --repo CRAIAHQ/medusa-plugin-base \
    --body "<your-PAT-from-Task-0.1>"
  ```

---

### Task 1.4 — Publish v0.1.0 to GitHub Packages 👤 ⏱

- [ ] **👤 Create and push the v0.1.0 tag — this triggers the publish workflow:**

  ```bash
  cd /Users/josue/Documents/code/craia/medusa-plugin-base
  git tag v0.1.0
  git push origin v0.1.0
  ```

- [ ] **👤 Watch the Actions tab on GitHub until the publish job succeeds.**

  Expected: green checkmark on the `publish` workflow.

- [ ] **👤 Verify the package is visible:**

  Go to `https://github.com/orgs/CRAIAHQ/packages` — `medusa-plugin-base` should be listed.

---

### Task 1.5 — Install Renovate on the GitHub org 👤 ⏱

Renovate is a GitHub App. It watches repos and opens PRs when dependencies have new versions.

- [ ] **👤 Install the Renovate GitHub App:**

  https://github.com/apps/renovate → Install → select `CRAIAHQ` → grant access to all repos.

- [ ] **👤 Verify Renovate runs on the template repo:**

  Within ~1 hour of install, Renovate opens a "Configure Renovate" PR in the `shop` repo.
  This PR will be a no-op (renovate.json already exists) — just merge it to onboard the repo.

---

## Phase 2 — `medusa-ops` repo

New repo at `/Users/josue/Documents/code/craia/medusa-ops/`.

### Task 2.1 — Scaffold the ops repo 🤖

**Files to create:**
- `clients.json` — client registry
- `renovate.json` — base Renovate config (client repos extend this)
- `scripts/provision-client.sh` — Railway provisioning automation
- `.github/workflows/dispatch-template-sync.yml` — structural sync across client repos
- `.gitignore`

- [ ] **🤖 Claude creates the full scaffold**

---

### Task 2.2 — Add the first client entry 👤

- [ ] **👤 After onboarding your first real client, edit `clients.json`:**

  ```json
  {
    "clients": [
      {
        "slug": "your-first-client",
        "repo": "CRAIAHQ/medusa-your-first-client",
        "railway_project": "your-first-client-prod",
        "onboarded": "2026-06-10",
        "contact": "client@email.com"
      }
    ]
  }
  ```

  Commit and push. Renovate and `dispatch-template-sync` both read this file.

---

### Task 2.3 — Create the GitHub repo 👤 ⏱

- [ ] **👤 Create the ops repo:**

  ```bash
  cd /Users/josue/Documents/code/craia/medusa-ops
  git init
  git add .
  git commit -m "feat: initial medusa-ops scaffold"
  gh repo create CRAIAHQ/medusa-ops --private --source=. --push
  ```

- [ ] **👤 Add `CRAIA_GITHUB_TOKEN` secret (the PAT from Task 0.1):**

  ```bash
  gh secret set CRAIA_GITHUB_TOKEN \
    --repo CRAIAHQ/medusa-ops \
    --body "<your-PAT-from-Task-0.1>"
  ```

  This secret lets the `dispatch-template-sync` workflow open PRs in client repos.

---

## Phase 3 — End-to-End Validation

Run through the full onboarding flow with a real or test client to confirm the entire chain works.

### Task 3.1 — Create first client repo from template 👤 ⏱

- [ ] **👤 Use the `shop` template to create a test client:**

  ```bash
  CLIENT_SLUG="test-client"
  gh repo create CRAIAHQ/medusa-$CLIENT_SLUG \
    --template CRAIAHQ/shop \
    --private \
    --clone
  cd medusa-$CLIENT_SLUG
  ```

- [ ] **👤 Update package names:**

  Edit `apps/backend/package.json`: `"name": "@craia/test-client-backend"`
  Edit `apps/storefront/package.json`: `"name": "@craia/test-client-storefront"`

  ```bash
  git add apps/backend/package.json apps/storefront/package.json
  git commit -m "chore: set client slug to test-client"
  git push origin main
  ```

---

### Task 3.2 — Provision Railway project 👤 ⏱

- [ ] **👤 Run the provisioning script from `medusa-ops`:**

  ```bash
  cd /Users/josue/Documents/code/craia/medusa-ops
  ./scripts/provision-client.sh test-client
  ```

  Expected output: Railway project `test-client-prod` created with Postgres + Redis services.

- [ ] **👤 Set env vars in Railway dashboard per ONBOARDING.md §5:**

  Required: `NODE_ENV`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `MEDUSA_BACKEND_URL`.

  For `JWT_SECRET` and `COOKIE_SECRET` run: `openssl rand -hex 32`

- [ ] **👤 Set Railway release command:** `npx medusa db:migrate`

- [ ] **👤 Link the GitHub repo to the Railway backend service** (ONBOARDING.md §4).

---

### Task 3.3 — First deploy and seed 👤

- [ ] **👤 Trigger the first deploy** (push any commit to main or use Railway dashboard).

- [ ] **👤 Watch Railway logs — expected sequence:**
  1. `npm ci` installs including `@craia/medusa-plugin-base`
  2. `npm run build` compiles
  3. `npx medusa db:migrate` runs all migrations
  4. `npm run start` — server up

- [ ] **👤 Run the seed:**

  ```bash
  railway run --project test-client-prod --service backend \
    npx medusa exec src/scripts/seed.ts
  ```

- [ ] **👤 Create the admin user:**

  ```bash
  railway run --project test-client-prod --service backend \
    npx medusa user -e admin@craia.net -p <choose-a-password>
  ```

- [ ] **👤 Verify health endpoint:**

  ```bash
  curl https://test-client.up.railway.app/health
  # Expected: {"status":"ok"}
  ```

- [ ] **👤 Log in to admin dashboard** at `https://test-client.up.railway.app/app`.
  Verify: Costa Rica region, CRC currency, shipping options exist.

---

### Task 3.4 — Verify Renovate plugin update flow 👤

This confirms the entire sync chain works end-to-end.

- [ ] **👤 Publish a patch bump of `@craia/medusa-plugin-base`:**

  ```bash
  cd /Users/josue/Documents/code/craia/medusa-plugin-base
  # Make any trivial change (e.g. add a log line to index.ts)
  git add .
  git commit -m "fix: trivial patch to test Renovate flow"
  git tag v0.1.1
  git push origin main --follow-tags
  ```

- [ ] **👤 Wait ~1 hour.** Renovate should open a PR in `CRAIAHQ/medusa-test-client` bumping `@craia/medusa-plugin-base` from `0.1.0` → `0.1.1`.

- [ ] **👤 Confirm the PR auto-merges** (patch bump + CI pass = auto-merge per renovate.json config).

- [ ] **👤 Confirm Railway deploys** after the merge.

If all steps pass: the full multi-client model is operational. 🎉

---

## Summary — Who Does What

| Task | Owner | When |
|---|---|---|
| Create GitHub PAT | 👤 You | Before anything else |
| Railway team + shared vars | 👤 You | Before first client |
| 1.1 Plugin scaffold | 🤖 Claude | Now |
| 1.2 Add plugin to template | 🤖 Claude | Now |
| 1.3 Create plugin GitHub repo | 👤 You | After 1.1 |
| 1.4 Publish v0.1.0 | 👤 You | After 1.3 |
| 1.5 Install Renovate | 👤 You | After 1.4 |
| 2.1 medusa-ops scaffold | 🤖 Claude | Now |
| 2.3 Create medusa-ops GitHub repo | 👤 You | After 2.1 |
| 3.1–3.4 First client onboarding | 👤 You | After all above |
