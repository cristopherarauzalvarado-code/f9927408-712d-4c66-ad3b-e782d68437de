# CRAIA Platform — Architecture Diagrams

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph CRAIAHQ["CRAIAHQ GitHub Org"]
        OPS["medusa-ops\n─────────────\nclients.json\nscripts/provision-client.sh\n.github/workflows/dispatch-template-sync.yml\nrenovate.json (base config)"]
        PKG["@craiahq/medusa-plugin-base\n─────────────\nnpm package → GitHub Packages\nShared modules, routes, workflows\nVersioned independently"]
        TMPL["shop (GitHub Template)\n─────────────\napps/backend/ (Medusa v2)\napps/storefront/ (Next.js 15)\n.github/workflows/deploy.yml\nrenovate.json (extends ops base)"]
    end

    subgraph CLIENTS["Per-Client Repos (1 per client)"]
        C1["medusa-client-a"]
        C2["medusa-client-b"]
        CN["medusa-client-n"]
    end

    subgraph RAILWAY["Railway (1 project per client)"]
        R1["client-a-prod\n├─ backend service\n├─ postgres (managed)\n└─ redis (managed)"]
        R2["client-b-prod\n├─ backend service\n├─ postgres (managed)\n└─ redis (managed)"]
    end

    subgraph VERCEL["Vercel (per client)"]
        V1["client-a storefront"]
        V2["client-b storefront"]
    end

    OPS -->|"reads clients.json\nopens PRs via CRAIA_GITHUB_TOKEN"| CLIENTS
    PKG -->|"installed as npm dep\npinned version"| TMPL
    TMPL -->|"'Use this template'\nper new client"| CLIENTS
    PKG -->|"Renovate detects new version\nopens PR in each client repo"| CLIENTS
    CLIENTS -->|"push to main →\nRailway GitHub integration"| RAILWAY
    CLIENTS -->|"push to main →\nVercel integration"| VERCEL
```

---

## 2. Update Propagation — Path A vs Path B

```mermaid
flowchart TD
    CHANGE["A change is made\nto shared CRAIA code"]

    CHANGE --> Q1{{"What kind\nof change?"}}

    Q1 -->|"Logic: new route,\nbug fix, workflow,\nnew field on existing model"| PA["PATH A\nPackage update via Renovate"]
    Q1 -->|"Infrastructure:\nworkflow file, railway.json,\nnew required env var,\nMedusa core upgrade"| PB["PATH B\nStructural sync via dispatch-template-sync"]

    subgraph PathA["Path A — Automated"]
        PA --> PA1["1. Bump version in\n@craiahq/medusa-plugin-base"]
        PA1 --> PA2["2. Publish to GitHub Packages\n(tag → publish.yml workflow)"]
        PA2 --> PA3["3. Renovate detects\nnew version within ~1 hour"]
        PA3 --> PA4{{"Semver bump?"}}
        PA4 -->|"patch (x.x.N)"| PA5["Auto-merge PR\nif CI passes"]
        PA4 -->|"minor (x.N.0)"| PA6["PR opened,\nmanual review required"]
        PA4 -->|"major (N.0.0)"| PA7["PR opened with\n'breaking-change' label,\nmanual review required"]
        PA5 --> PA8["Railway deploys automatically"]
        PA6 --> PA8
        PA7 --> PA8
    end

    subgraph PathB["Path B — Semi-manual"]
        PB --> PB1["1. Update file in\nshop template repo"]
        PB1 --> PB2["2. Trigger dispatch-template-sync\nworkflow in medusa-ops\n(workflow_dispatch with changed_files input)"]
        PB2 --> PB3["3. Workflow reads clients.json,\niterates all client repos"]
        PB3 --> PB4["4. Opens a PR per client\nwith the changed files"]
        PB4 --> PB5{{"File was\ncustomized?"}}
        PB5 -->|"no"| PB6["PR merges cleanly"]
        PB5 -->|"yes"| PB7["Merge conflict —\nhuman resolves manually"]
        PB6 --> PB8["Railway deploys"]
        PB7 --> PB8
    end
```

---

## 3. Deploy Flow (per client push to main)

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant RW as Railway
    participant DB as Postgres (Railway)
    participant APP as Backend Service

    Dev->>GH: git push origin main
    
    par GitHub Actions CI (parallel jobs)
        GH->>GH: build-backend job<br/>npm ci → npm run build
    and
        GH->>GH: build-storefront job<br/>npm ci → next build<br/>(uses .next/cache)
    end

    GH-->>Dev: ✅ CI passes (or ❌ blocks deploy)

    GH->>RW: GitHub integration detects push to main
    RW->>RW: Pull new image<br/>npm ci && npm run build

    Note over RW,DB: Release command (before traffic cutover)
    RW->>DB: npx medusa db:migrate
    DB-->>RW: Migrations applied ✅

    Note over RW,APP: Start command
    RW->>APP: npm run start
    APP-->>RW: Server up on port 9000

    RW-->>Dev: 🚀 Deployment live
```

---

## 4. New Client Onboarding

```mermaid
flowchart LR
    START(["New client\nagreed ✅"])

    START --> S1["1️⃣ Create repo from template\ngh repo create CRAIAHQ/medusa-client\n--template CRAIAHQ/medusa-template --private"]
    S1 --> S2["2️⃣ Add NODE_AUTH_TOKEN\nsecret to new repo\n(from Railway craia-shared group)"]
    S2 --> S3["3️⃣ Run provisioning script\nfrom medusa-ops:\n./scripts/provision-client.sh client-slug"]

    S3 --> S3A["Railway creates:\n• Project: client-prod\n• Postgres service\n• Redis service"]

    S3A --> S4["4️⃣ Set env vars in Railway\nJWT_SECRET, COOKIE_SECRET,\nSTORE_CORS, ADMIN_CORS,\nMEDUSA_BACKEND_URL, ..."]
    S4 --> S5["5️⃣ Link GitHub repo to\nRailway backend service"]
    S5 --> S6["6️⃣ Set Railway release command:\nnpx medusa db:migrate"]

    S6 --> S7["7️⃣ Trigger first deploy\n(push any commit to main)"]
    S7 --> S8["8️⃣ Run seed script\nrailway run npx medusa exec\nsrc/scripts/seed.ts"]
    S8 --> S9["9️⃣ Create admin user\nnpx medusa user\n-e admin@craia.net -p password"]
    S9 --> S10["🔟 Add client to\nmedusa-ops/clients.json"]
    S10 --> S11["1️⃣1️⃣ Deploy storefront\nto Vercel"]

    S11 --> DONE(["Client live 🎉\n~5 min automated\n+ ~30 min manual setup"])
```

---

## 5. Migration-Bearing Plugin Update (special case)

```mermaid
flowchart TD
    START(["New data model added\nto @craiahq/medusa-plugin-base"])

    START --> P1["Publish as MINOR bump\n(e.g. 1.2.0 → 1.3.0)"]
    P1 --> P2["Write release notes with\n⚠️ Migration required notice"]
    P2 --> P3["Renovate opens PR per client\n(minor = no auto-merge)"]

    P3 --> PER_CLIENT

    subgraph PER_CLIENT["Per-client repo (repeat for each)"]
        PC1["Checkout the Renovate branch"]
        PC1 --> PC2["Run locally:\nDATABASE_URL=local-db\nnpx medusa db:generate"]
        PC2 --> PC3["Commit migration file\nin src/migrations/"]
        PC3 --> PC4["Push → PR CI passes"]
        PC4 --> PC5["Approve & merge PR"]
        PC5 --> PC6["Railway deploys →\nnpx medusa db:migrate runs"]
    end

    PC6 --> DONE(["Data model live\nin client DB ✅"])

    WARNING["⚠️ Why not automated?\nMikro-ORM generates migrations\nby diffing schema vs live DB.\nEach client DB may differ.\nAlways per-client, per-database."]
    DONE -.->|"understand this"| WARNING
```

---

## 6. Emergency Rollback Decision Tree

```mermaid
flowchart TD
    INCIDENT(["🚨 Production issue\nafter deploy"])

    INCIDENT --> Q1{{"Did a DB\nmigration run?"}}

    Q1 -->|"No (code-only issue)"| CODE["Railway dashboard:\nDeployments → previous build\n→ Redeploy\n\nCode rolls back instantly.\nDB untouched."]

    Q1 -->|"Yes"| Q2{{"Was the migration\ndestructive?\n(dropped column/table)"}}

    Q2 -->|"No (additive migration)"| CODEBACK["1. Redeploy previous code\n2. Migration columns remain\n(harmless for old code)\n3. Fix forward in next release"]

    Q2 -->|"Yes"| DBRESTORE["⚠️ Data loss path:\n1. Railway → Postgres → Backups\n2. Restore snapshot from before deploy\n3. All data after snapshot is LOST\n4. Notify client immediately\n5. Redeploy previous code version"]

    CODEBACK --> RENOVATE_PIN["Pin bad version in renovate.json:\n'allowedVersions': '<=1.2.1'\nuntil fix is published"]
    CODE --> RENOVATE_PIN

    RENOVATE_PIN --> FIX["Fix in @craiahq/medusa-plugin-base\npublish new patch version\nremove version pin"]

    DBRESTORE --> FIX

    PREVENTION["🛡️ Prevention:\nBefore migration-bearing releases:\npg_dump DB_URL > backup-YYYYMMDD.sql"]
    INCIDENT -.->|"next time"| PREVENTION
```

---

## 7. Secrets Architecture

```mermaid
graph TB
    subgraph RAILWAY_SHARED["Railway — craia-shared variable group"]
        NS["NODE_AUTH_TOKEN\n(GitHub PAT, read:packages)\nRotate annually — set calendar reminder"]
    end

    subgraph PER_CLIENT_VARS["Railway — per-client env vars"]
        DB["DATABASE_URL (Railway-managed Postgres)"]
        RD["REDIS_URL (Railway-managed Redis)"]
        JW["JWT_SECRET (openssl rand -hex 32)"]
        CK["COOKIE_SECRET (openssl rand -hex 32)"]
        CO["STORE_CORS, ADMIN_CORS, AUTH_CORS"]
        MB["MEDUSA_BACKEND_URL"]
    end

    subgraph GH_SECRETS["GitHub — per-repo secrets"]
        GHN["NODE_AUTH_TOKEN\n(same PAT, for CI npm install)"]
        CRG["CRAIA_GITHUB_TOKEN\n(medusa-ops only — opens PRs in client repos)"]
    end

    NS -->|"referenced as\n${{craia-shared.NODE_AUTH_TOKEN}}"| PER_CLIENT_VARS
    NS -.->|"same value, set manually\nin each GitHub repo"| GH_SECRETS

    NOTE["💡 One rotation point for NODE_AUTH_TOKEN:\nUpdate Railway craia-shared group → all Railway projects updated.\nGitHub repo secrets must be updated separately (not linked)."]
```
