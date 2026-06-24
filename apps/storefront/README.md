# Storefront — Next.js 15

Next.js 15 storefront for CRAIA client deployments. Runs on port 8000.

## Stack

- **Next.js** 15.5.x with Turbopack (dev) and App Router
- **React** 19
- **TypeScript**
- Talks to the Medusa backend via the JS SDK (`@medusajs/js-sdk`)

## Local Setup

```bash
# From repo root — installs all workspace deps
npm install

# Copy and fill in env vars
cp .env.template .env.local
# Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY from admin → Settings → Publishable API Keys

# Start with Turbopack
npm run dev
```

Storefront runs at `http://localhost:8000`. Requires the backend to be running at `http://localhost:9000`.

## Commands

```bash
npm run dev      # next dev --turbopack on port 8000
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from admin | — (required) |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL of the Medusa backend | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region country code | `cr` |
| `NEXT_PUBLIC_BASE_URL` | Public URL of this storefront | `http://localhost:8000` |

## Deployment

Vercel deploys automatically on push to `main` via GitHub integration. Environment variables are managed in the Vercel project dashboard. CI builds run with stub env values — see `.github/workflows/deploy.yml`.
