# Plan de Deploy a Producción — Backend (Railway) + Storefront (Vercel)

> **Objetivo:** Pasar de la fase de prueba local a producción: backend Medusa en Railway, storefront Next.js en Vercel, con ONVO Pay funcionando.
> **Estado de partida:** Todo funciona en local (ver [SETUP-FASE-PRUEBA.md](./SETUP-FASE-PRUEBA.md)). Trabajo en la rama `setup/fase-de-prueba`.

⚠️ **Antes de pagos reales:** este plan despliega la infraestructura. Para cobrar dinero real falta además (a) activar modo **live** en ONVO y (b) cambiar las llaves `test` → `live` (ver Fase 5). Se recomienda desplegar primero con llaves `test`, validar todo el flujo en producción, y recién entonces pasar a `live`.

---

## 📍 ESTADO ACTUAL (2026-06-22) — para coordinar con el equipo

### ✅ Backend en Railway — DESPLEGADO Y VIVO
- Proyecto **`craia-prod`** (workspace `Cristopher_Devug's Projects`, cuenta **TRIAL** con ~$5 de crédito).
- Servicios: **Postgres**, **Redis**, **medusa-template** (backend). ⚠️ Hay un **Postgres duplicado `Postgres-xiZU`** sin usar — borrar en el dashboard cuando se pueda.
- Backend: **https://medusa-template-production.up.railway.app** → `/health` 200, `/app` 200.
- Root Directory `apps/backend`, branch **`setup/fase-de-prueba`** (NO main), región US West.
- Migraciones corridas (región CR, productos demo, publishable key). **ONVO enlazado a la región CR** (verificado vía API). Usuario admin creado (`admin@craia.net`).
- Publishable key de prod: `pk_ec27363a396b28553b48f43e46f6f3786b296bb2cad17833ebe47aee2845a34c`.

### 🐛 Bugs del template corregidos para que Railway funcione (commiteados en la rama)
El `apps/backend/railway.json` original no servía para un deploy real de Medusa v2 en Railway. Se corrigió (8 blockers):
1. **Root Directory** debe ser `apps/backend` (dashboard) — sin esto Nixpacks buildea todo el monorepo.
2. **`npm ci && npm run build` → `npm run build`** — el `npm ci` reinstalaba todo de nuevo y el build excedía el límite de tiempo (DeadlineExceeded).
3. **`NPM_CONFIG_PRODUCTION=false`** (var en Railway) — sin esto `npm i` omite devDependencies que `medusa build` necesita.
4. **`STORE_CORS` (y ADMIN/AUTH)** son `requireEnv` → deben estar seteadas o el build falla al cargar `medusa-config.ts`.
5. **Typecheck estricto** de `medusa build` — se corrigió el tipado en `src/scripts/link-onvo-region.ts`.
6. **`releaseCommand` → `preDeployCommand`** — `releaseCommand` no es campo válido de Railway (es de Render/Heroku); las migraciones nunca corrían.
7. **`startCommand: cd .medusa/server && npm run start`** — Medusa v2 genera el build en `.medusa/server`; arrancar desde la raíz no encuentra el admin (`index.html`).
8. **`PORT=9000`** (var en Railway) — alinear con el puerto del dominio público generado.

> TODO equipo: portar estos fixes de `railway.json` al template base (`main` / repo template) para futuros clientes, y aplicar el mismo fix de webhook ONVO upstream (rama `fix/onvo-webhook-capture` en `medusa-ops`).

### ⏸️ Storefront en Vercel — PAUSADO (decisión de plan pendiente)
Bloqueante: **Vercel exige plan Pro para desplegar repos privados de organización** (`CRAIAHQ/medusa-template`). La cuenta está en **Hobby**. Opciones a decidir con el equipo:
- **Pro Trial** (14 días gratis) — para probar ya.
- **Pro** (de paga).
- **Storefront en Railway** en vez de Vercel (evita el requisito de Pro; usa más crédito trial de Railway).

Además, al importar en Vercel, el **Root Directory** debe cambiarse a `apps/storefront` (venía como `apps/backend`).

### Pendiente cuando se retome el storefront
1. Elegir plan/plataforma del storefront y desplegarlo (root `apps/storefront`, branch `setup/fase-de-prueba`, env vars de la Fase 2).
2. Obtener la URL pública del storefront.
3. En Railway, actualizar `STORE_CORS`, `AUTH_CORS`, `STOREFRONT_HOST` (hoy `STORE_CORS` es un placeholder) con esa URL → redeploy backend.
4. Agregar `NEXT_PUBLIC_BASE_URL` en el storefront.
5. Crear el **webhook ONVO de producción** → `https://medusa-template-production.up.railway.app/hooks/payment/onvo-pay_onvo-pay` y poner su secret en `ONVO_WEBHOOK_SECRET` (Railway).
6. Compra de prueba end-to-end en prod (modo test) → validar captura.
7. (Fase 5) Pasar a llaves `live` para pagos reales.

---

## Decisiones a confirmar antes de empezar

1. **Repo a desplegar:** ¿este mismo repo (`medusa-template`) o se crea uno nuevo por cliente (`medusa-<slug>`) como dice el ONBOARDING? → Este plan asume **este repo**.
2. **Rama:** Railway despliega desde `main`. Hay que **mergear `setup/fase-de-prueba` → `main`** (Fase 0) o apuntar Railway a la rama.
3. **Dominios:** ¿usamos los subdominios gratis (`*.up.railway.app`, `*.vercel.app`) o un dominio custom? → El plan usa los gratis; dominio custom es opcional al final.

---

## Fase 0 — Preparar el repo (local)

- [ ] **0.1** Verificar que el build de ambos apps pasa en limpio:
  ```bash
  npm run build
  ```
- [ ] **0.2** Commitear todo el trabajo pendiente de la rama (diseño + rediseño de pago).
- [ ] **0.3** Mergear `setup/fase-de-prueba` → `main` y push:
  ```bash
  git checkout main && git merge setup/fase-de-prueba && git push origin main
  ```
  > Railway/Vercel despliegan desde `main`. Alternativa: configurar Railway/Vercel para observar la rama.

---

## Fase 1 — Backend en Railway

- [ ] **1.1** Instalar y autenticar CLIs:
  ```bash
  npm install -g @railway/cli
  railway login
  ```
- [ ] **1.2** Crear el proyecto Railway:
  ```bash
  railway init --name "craia-prod"
  ```
- [ ] **1.3** Agregar servicios gestionados:
  ```bash
  railway add --database postgres
  railway add --database redis
  ```
- [ ] **1.4** En el Dashboard de Railway → crear el servicio **backend** desde el repo de GitHub:
  - Source: GitHub repo (este repo)
  - **Root Directory:** `apps/backend`
  - **Watch Paths:** `apps/backend/**`
  - Branch: `main`
- [ ] **1.5** Settings → Deploy del servicio backend:
  - Build Command: `npm run build`
  - Release Command: `npx medusa db:migrate`
  - Start Command: `npm run start`
  > (Ya está en `apps/backend/railway.json`, pero conviene verificar en el dashboard.)
- [ ] **1.6** Variables de entorno del servicio backend (Dashboard → Variables):

  | Variable | Valor |
  |---|---|
  | `NODE_ENV` | `production` |
  | `NODE_AUTH_TOKEN` | el PAT `p3rcha-craiabot` (read:packages) |
  | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
  | `REDIS_URL` | `${{Redis.REDIS_URL}}` |
  | `JWT_SECRET` | `openssl rand -hex 32` (nuevo, único) |
  | `COOKIE_SECRET` | `openssl rand -hex 32` (nuevo, único) |
  | `STORE_CORS` | URL del storefront en Vercel (se llena en Fase 2) |
  | `ADMIN_CORS` | `https://<backend>.up.railway.app` |
  | `AUTH_CORS` | `<storefront-vercel>,https://<backend>.up.railway.app` |
  | `MEDUSA_BACKEND_URL` | `https://<backend>.up.railway.app` |
  | `ONVO_SECRET_KEY` | llave ONVO (test primero, luego live) |
  | `ONVO_PUBLISHABLE_KEY` | llave ONVO |
  | `ONVO_WEBHOOK_SECRET` | se obtiene al crear el webhook de prod (Fase 3) |
  | `STOREFRONT_HOST` | host del storefront sin protocolo, ej. `craia-store.vercel.app` |

  > Genera secrets NUEVOS para producción — no reutilices los de local.
- [ ] **1.7** Generar el dominio público del backend (Settings → Networking → Generate Domain) y actualizar `MEDUSA_BACKEND_URL` / `ADMIN_CORS` con ese valor.
- [ ] **1.8** Primer deploy (push a `main` o deploy manual). Ver logs:
  ```bash
  railway logs
  ```
  Secuencia esperada: `npm ci` → `npm run build` → `db:migrate` → `npm run start`.
- [ ] **1.9** Verificar:
  ```bash
  curl https://<backend>.up.railway.app/health    # 200
  ```
  > Nota: las migraciones incluyen el seed inicial (región CR, productos demo). Igual conviene correr el seed para crear la **publishable key** y enlazar ONVO:
  ```bash
  railway run npx medusa exec src/scripts/seed.ts
  railway run npx medusa exec src/scripts/link-onvo-region.ts
  ```
- [ ] **1.10** Crear usuario admin en producción:
  ```bash
  railway run npx medusa user -e admin@craia.net -p <password-seguro>
  ```
- [ ] **1.11** Entrar a `https://<backend>.up.railway.app/app`, login, y copiar la **Publishable API Key** (Settings → Publishable API Keys) para el storefront.

---

## Fase 2 — Storefront en Vercel

- [ ] **2.1** En Vercel → New Project → importar este repo de GitHub.
- [ ] **2.2** Configurar el proyecto:
  - **Root Directory:** `apps/storefront`
  - Framework Preset: Next.js
  - > ⚠️ **Gotcha monorepo:** como es un workspace npm, el install puede resolver dependencias de todo el repo (incluido `@craiahq/medusa-plugin-base` del backend). Hay que agregar `NODE_AUTH_TOKEN` también en las env vars de Vercel para que el install no falle con 401. Si el storefront NO necesita ese paquete, alternativamente ajustar el Install Command para instalar solo el workspace del storefront.
- [ ] **2.3** Variables de entorno en Vercel:

  | Variable | Valor |
  |---|---|
  | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<backend>.up.railway.app` |
  | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | `pk_...` (de Fase 1.11) |
  | `NEXT_PUBLIC_DEFAULT_REGION` | `cr` |
  | `NEXT_PUBLIC_BASE_URL` | `https://<storefront>.vercel.app` |
  | `NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY` | misma publishable de ONVO que el backend |
  | `NODE_AUTH_TOKEN` | PAT (solo si el install lo requiere, ver 2.2) |
- [ ] **2.4** Deploy. Obtener la URL final `https://<storefront>.vercel.app`.
- [ ] **2.5** Volver a Railway y actualizar en el backend: `STORE_CORS`, `AUTH_CORS` y `STOREFRONT_HOST` con la URL real de Vercel. Redeploy del backend.

---

## Fase 3 — Webhook ONVO de producción

- [ ] **3.1** En ONVO Dashboard → Desarrolladores → Webhooks → Agregar webhook:
  ```
  https://<backend>.up.railway.app/hooks/payment/onvo-pay_onvo-pay
  ```
- [ ] **3.2** Copiar el `webhook_secret_...` que genera y ponerlo en `ONVO_WEBHOOK_SECRET` en Railway. Redeploy del backend.

---

## Fase 4 — Validación end-to-end en producción (modo test)

- [ ] **4.1** Compra de prueba completa en `https://<storefront>.vercel.app` con tarjeta sandbox de ONVO.
- [ ] **4.2** Confirmar en los logs de Railway que llega el webhook y la orden queda autorizada/pagada.
- [ ] **4.3** Verificar la orden en el admin.

---

## Fase 5 — Pasar a pagos reales (live)

- [ ] **5.1** Completar el onboarding/KYC de ONVO para habilitar **modo live**.
- [ ] **5.2** Reemplazar en Railway y Vercel las llaves `onvo_test_*` → `onvo_live_*`.
- [ ] **5.3** Crear el webhook **live** en ONVO (apuntando a la misma URL) y actualizar `ONVO_WEBHOOK_SECRET`.
- [ ] **5.4** Hacer una transacción real pequeña de verificación y confirmar el cobro.

---

## Fase 6 — Opcional / hardening

- [ ] Dominio custom (Railway + Vercel) y actualizar CORS / URLs.
- [ ] `GitHub Secrets` (`NODE_AUTH_TOKEN`, `RAILWAY_TOKEN`) si se usa el workflow de CI/CD de `.github/workflows/deploy.yml`.
- [ ] Backups de Postgres en Railway.
- [ ] Cambiar/rotar el password de `admin@craia.net`.

---

## Notas

- El `.github/workflows/deploy.yml` solo **valida** el build; el deploy real lo dispara la integración de GitHub de Railway/Vercel.
- `apps/backend/railway.json` ya define build/release/start.
- Mantener las versiones `@medusajs/*` alineadas (2.15.5).
