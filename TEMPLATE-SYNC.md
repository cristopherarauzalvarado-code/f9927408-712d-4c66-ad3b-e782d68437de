# Template Sync Strategy

How updates to CRAIA's shared code propagate to all client deployments.

**Audience:** CRAIA developers maintaining the template and shared packages  
**Related:** ARCHITECTURE.md §4.2

---

## Table of Contents

1. [The Two Kinds of Changes](#1-the-two-kinds-of-changes)
2. [Path A: Plugin Updates via Renovate](#2-path-a-plugin-updates-via-renovate)
3. [Path B: Structural Template Changes via Targeted PRs](#3-path-b-structural-template-changes-via-targeted-prs)
4. [GitHub Actions Workflow Reference](#4-github-actions-workflow-reference)
5. [Renovate Configuration Reference](#5-renovate-configuration-reference)
6. [Release Checklist for `@craiahq/medusa-plugin-base`](#6-release-checklist)
7. [Handling Migration-Bearing Plugin Updates](#7-handling-migration-bearing-plugin-updates)
8. [Emergency Rollback Procedure](#8-emergency-rollback-procedure)

---

## 1. The Two Kinds of Changes

Not all updates propagate the same way. Choosing the wrong path is the main source of sync pain.

| Change type | Examples | Propagation path |
|---|---|---|
| **Plugin logic update** | New workflow, new route, bug fix in shared module, new field on existing model | Path A: Renovate auto-PR on `@craiahq/*` version bump |
| **New plugin data model** | Adds a DB table or column via a new module | Path A + manual: Renovate PR + developer runs `medusa db:generate` in client repo |
| **Infrastructure change** | New env var required, `.github/workflows/deploy.yml` update, `railway.json` change | Path B: Targeted PR via `dispatch-template-sync` workflow |
| **Medusa core upgrade** | Bumping `@medusajs/medusa` from 2.15.x to 2.16.x | Path B: Manual targeted PR; **never auto-merge** |
| **Storefront change** | New component, style update, new page | Path A if packaged; Path B if file-level |

---

## 2. Path A: Plugin Updates via Renovate

Renovate Bot is installed on every client repo (configured in step 10 of ONBOARDING.md). It watches `package.json` for new versions of `@craiahq/*` packages published to GitHub Packages.

### How it works

1. Developer publishes a new version of `@craiahq/medusa-plugin-base` to GitHub Packages (e.g., `1.2.3`).
2. Renovate detects the new version within ~1 hour.
3. Renovate opens a PR in each registered client repo that bumps the version in `package.json`.
4. For **patch** bumps (`1.2.2 → 1.2.3`): auto-merge is enabled. The PR merges automatically if CI passes.
5. For **minor** bumps (`1.2.x → 1.3.0`): Renovate opens the PR but does **not** auto-merge. A developer must review and approve.
6. For **major** bumps (`1.x.x → 2.0.0`): Renovate opens the PR with a `breaking change` label. Manual review required.

### Merge triggers Railway deploy

When the Renovate PR merges into `main`, Railway's GitHub integration detects the push and triggers a deploy. The Railway release command (`npx medusa db:migrate`) runs automatically.

### What Renovate does NOT touch

- `medusa-config.ts`
- `src/` (client custom code)
- `.github/workflows/`
- Any file other than `package.json` / `package-lock.json`

This is the entire point: the update surface is strictly version numbers, not file content. Client customizations are never overwritten.

---

## 3. Path B: Structural Template Changes via Targeted PRs

Some changes cannot be expressed as a package version bump. Examples:

- The `.github/workflows/deploy.yml` workflow needs a new step
- A new required environment variable was added
- `railway.json` service configuration changed
- A security patch requires changes to `medusa-config.ts` structure

For these, use the `dispatch-template-sync` GitHub Actions workflow in the `medusa-ops` repo. It reads `clients.json`, iterates over all registered client repos, and opens a PR with the specific changed files.

### Important limitations

This mechanism **will conflict** on files that clients have customized. That is expected and acceptable — the conflict forces a human to make a conscious decision about how to apply the structural change to their customized version. The PR description must explain what changed and why.

**Do not use Path B to propagate logic changes.** Package those in `@craiahq/medusa-plugin-base` and use Path A.

---

## 4. GitHub Actions Workflow Reference

### 4.1 `medusa-ops`: dispatch-template-sync.yml

Stored in `medusa-ops/.github/workflows/dispatch-template-sync.yml`. Triggered manually via `workflow_dispatch` with inputs.

```yaml
name: Dispatch Template Sync

on:
  workflow_dispatch:
    inputs:
      changed_files:
        description: "Space-separated list of files to sync (relative to repo root)"
        required: true
        type: string
        default: ".github/workflows/deploy.yml"
      pr_title:
        description: "PR title"
        required: true
        type: string
      pr_body:
        description: "PR body (markdown)"
        required: true
        type: string

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout medusa-ops
        uses: actions/checkout@v4
        with:
          repository: CRAIAHQ/medusa-ops
          token: ${{ secrets.CRAIA_GITHUB_TOKEN }}

      - name: Checkout template repo
        uses: actions/checkout@v4
        with:
          repository: CRAIAHQ/medusa-template
          token: ${{ secrets.CRAIA_GITHUB_TOKEN }}
          path: template

      - name: Read client registry
        id: registry
        run: |
          CLIENTS=$(jq -r '.clients[].repo' clients.json | tr '\n' ' ')
          echo "clients=$CLIENTS" >> $GITHUB_OUTPUT

      - name: Open sync PR for each client
        env:
          GH_TOKEN: ${{ secrets.CRAIA_GITHUB_TOKEN }}
          CHANGED_FILES: ${{ inputs.changed_files }}
          PR_TITLE: ${{ inputs.pr_title }}
          PR_BODY: ${{ inputs.pr_body }}
        run: |
          for REPO in ${{ steps.registry.outputs.clients }}; do
            echo "Processing $REPO"

            # Clone the client repo
            gh repo clone "$REPO" "client-repo" -- --depth=1
            cd client-repo

            # Create a sync branch
            BRANCH="template-sync-$(date +%Y%m%d-%H%M%S)"
            git checkout -b "$BRANCH"

            # Copy the changed files from the template
            for FILE in $CHANGED_FILES; do
              mkdir -p "$(dirname "$FILE")"
              cp "../template/$FILE" "$FILE"
            done

            # Commit and push
            git config user.email "github-actions@craia.io"
            git config user.name "CRAIA Template Bot"
            git add $CHANGED_FILES
            if git diff --staged --quiet; then
              echo "No changes needed in $REPO for $FILE"
            else
              git commit -m "chore(template-sync): $PR_TITLE"
              git push origin "$BRANCH"

              # Open the PR
              gh pr create \
                --repo "$REPO" \
                --title "$PR_TITLE" \
                --body "$PR_BODY" \
                --head "$BRANCH" \
                --base main \
                --label "template-sync"
            fi

            cd ..
            rm -rf client-repo
          done
```

### 4.2 Client repo: deploy.yml

Stored in each client repo at `.github/workflows/deploy.yml`. Handles CI (lint, build, test) on PRs and triggers Railway deploy on merge to `main`.

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build & Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/backend
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://npm.pkg.github.com"
          scope: "@craiahq"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      # Railway deploys automatically on push to main via GitHub integration.
      # The release command (medusa db:migrate) runs inside Railway, not here.
      # CI only validates that the build succeeds.
```

> **Why not deploy from GitHub Actions?** Railway's native GitHub integration is simpler and more reliable than deploying via `railway up` from GitHub Actions. The Railway integration handles build caching, zero-downtime deploys, and the release command (migrations) natively. GitHub Actions is used only for build validation on PRs.

---

## 5. Renovate Configuration Reference

### 5.1 Template repo `renovate.json`

Stored in the template root (`renovate.json`). Every client repo inherits this via `"extends"`.

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:base"
  ],
  "packageRules": [
    {
      "matchPackagePrefixes": ["@craiahq/"],
      "groupName": "CRAIA shared packages",
      "automerge": true,
      "automergeType": "pr",
      "matchUpdateTypes": ["patch"],
      "minimumReleaseAge": "0 days"
    },
    {
      "matchPackagePrefixes": ["@craiahq/"],
      "matchUpdateTypes": ["minor"],
      "automerge": false,
      "labels": ["dependencies", "craia-update"],
      "reviewers": ["CRAIAHQ/backend-team"]
    },
    {
      "matchPackagePrefixes": ["@craiahq/"],
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["dependencies", "breaking-change"],
      "reviewers": ["CRAIAHQ/backend-team"]
    },
    {
      "matchPackagePrefixes": ["@medusajs/"],
      "groupName": "Medusa core",
      "automerge": false,
      "labels": ["dependencies", "medusa-upgrade"],
      "reviewers": ["CRAIAHQ/backend-team"],
      "schedule": ["before 9am on Monday"]
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "matchUpdateTypes": ["patch", "minor"]
    }
  ],
  "schedule": ["after 10pm every weekday", "every weekend"],
  "timezone": "America/Costa_Rica",
  "labels": ["dependencies"],
  "prConcurrentLimit": 3,
  "prHourlyLimit": 2
}
```

### Key decisions in this config

- **`@craiahq/` patch bumps auto-merge.** This is safe because patch releases should be non-breaking bug fixes. CI must pass.
- **`@medusajs/` never auto-merges.** Medusa core upgrades require all packages to bump together (see ARCHITECTURE.md §8.4) and should be reviewed manually.
- **Schedule is Costa Rica timezone.** Renovate PRs open after 10pm CR time on weekdays, so developers see them the next morning.
- **`prConcurrentLimit: 3`** prevents Renovate from flooding the client repo with too many open PRs at once.

---

## 6. Release Checklist for `@craiahq/medusa-plugin-base`

Run through this before publishing a new version to GitHub Packages.

**Pre-release**

- [ ] Run `npm run build` in the plugin package — zero errors
- [ ] Run `npm run test` — all tests pass
- [ ] `peerDependencies` in `package.json` still compatible with the Medusa version used in client repos
- [ ] If adding a new data model: document that `medusa db:generate` must be run in client repos (see §7)
- [ ] Changelog entry written in `CHANGELOG.md`
- [ ] Version bumped appropriately:
  - Patch (`x.x.N`): bug fixes, no new public API surface
  - Minor (`x.N.0`): new functionality, backwards compatible
  - Major (`N.0.0`): breaking changes to module interfaces or removed functionality
- [ ] Tested locally against a client repo via yalc (see below)

**Testing locally before publishing**

Use `yalc` to validate the change end-to-end in a client repo without touching the registry:

```bash
# In medusa-ops:
npm run build && yalc push

# In the client repo's apps/backend (one-time link if not already done):
yalc add @craiahq/medusa-plugin-base

# Start the backend and verify behavior, then remove before publishing:
yalc remove @craiahq/medusa-plugin-base && npm install
```

See ONBOARDING.md §11 for the full yalc workflow.

**Publish**

```bash
# From the medusa-ops directory:
npm version patch   # or minor, or major
npm publish --registry https://npm.pkg.github.com --access restricted
git push origin main --follow-tags
```

**Post-release**

- [ ] Verify the package appears in GitHub Packages UI
- [ ] Create a GitHub Release with the changelog entry
- [ ] Monitor Renovate: within ~1 hour, PRs should open on client repos
- [ ] Check that CI passes on the first few client repo Renovate PRs before auto-merge completes on all

---

## 7. Handling Migration-Bearing Plugin Updates

When `@craiahq/medusa-plugin-base` adds a new data model (a new Mikro-ORM entity in a registered module), every client repo must generate and commit the migration file before deploying. This cannot be automated.

### Step 1: Release the plugin with the new model

Follow the normal release checklist (§6). Mark the release as **minor** (new functionality).

In the Release notes, include:

```markdown
## ⚠️ Migration required

This release adds the `[ModelName]` data model to the `[ModuleName]` module.

Before deploying to production, each client repo must generate the migration file:

1. Pull the Renovate PR that bumps `@craiahq/medusa-plugin-base` to this version
2. Run locally: `DATABASE_URL=<local-db-url> npx medusa db:generate`
3. Commit the generated migration file in `src/migrations/`
4. Push — this will trigger the Railway deploy which runs `medusa db:migrate`
```

### Step 2: Update client repos

For each client repo, after the Renovate PR is opened:

```bash
# Do NOT auto-merge migration-bearing releases until this step is done.
# Renovate will not auto-merge minor bumps (configured in renovate.json).

cd medusa-$CLIENT_SLUG/apps/backend

# Pull the Renovate branch
git fetch origin
git checkout renovate/craia-medusa-plugin-base-x.x.x

# Generate the migration
DATABASE_URL="postgresql://localhost:5432/medusa-dev" npx medusa db:generate

# Stage and commit the new migration file
git add src/migrations/
git commit -m "chore: generate migration for @craiahq/medusa-plugin-base x.x.x"
git push origin HEAD

# The PR will now pass CI. Approve and merge it.
```

### Why this cannot be automated

Mikro-ORM generates migration files by diffing the current schema definitions against the database. This requires a database connection at generation time. The migration file content depends on the state of that specific client's database — two clients could have slightly different schemas if they have applied different plugin versions historically. Therefore, migration generation is always a per-client, per-database operation.

---

## 8. Emergency Rollback Procedure

When a deployed update causes a production issue and must be reverted.

### 8a. Roll back the Railway deployment (code-only issue)

```bash
# In Railway dashboard:
# Project → Service → Deployments → select previous deployment → "Redeploy"

# Or via CLI:
railway redeploy --deployment <previous-deployment-id> --project $CLIENT_SLUG-prod
```

This rolls back the code but **not** the database. If the new deployment ran a migration, rolling back the code does not reverse the migration.

### 8b. If a destructive migration ran

A migration that drops a column or table cannot be reversed by Railway redeployment alone.

1. **Do not panic.** Railway Postgres services have automatic daily backups.
2. In Railway Dashboard → Postgres service → Backups → select the backup from before the bad deploy → Restore.
3. This restores the entire database to the backup point. **All data written after the backup is lost.** Communicate with the client immediately.
4. After DB restore, redeploy the previous code version (step 8a).

### 8c. Prevention

Before any migration-bearing release, create a manual snapshot:

```bash
# Via Railway CLI (if snapshot feature is available on your plan):
railway snapshot create --project $CLIENT_SLUG-prod --service postgres

# Or pg_dump via Railway's connection URL:
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql
```

This is not automated in the current architecture. Consider adding a pre-deploy snapshot step if clients have strict RPO requirements.

### 8d. Rolling back a `@craiahq/` package via Renovate

If an auto-merged Renovate PR caused a regression (e.g., a patch bump broke something):

1. Revert the Renovate PR merge commit in the client repo:

```bash
git revert <merge-commit-sha>
git push origin main
```

2. This triggers a Railway redeploy with the previous package version.
3. Pin the bad version in `renovate.json` until the issue is fixed:

```json
{
  "packageRules": [
    {
      "matchPackageNames": ["@craiahq/medusa-plugin-base"],
      "allowedVersions": "<=1.2.1"
    }
  ]
}
```

4. Fix the issue in `@craiahq/medusa-plugin-base`, publish a new patch version, remove the pin.
