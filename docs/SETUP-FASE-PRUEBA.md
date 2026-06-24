# Setup — Fase de Prueba (ONVO Checkout en Local)

> **Objetivo:** Validar el flujo de pago ONVO de punta a punta en local (test mode) antes de desplegar a producción.
> **Rama:** `setup/fase-de-prueba`
> **Inicio:** 2026-06-18

Este documento es el **plan + changelog** de la fase de prueba. Se actualiza cada vez que avanzamos un paso (ver sección [Changelog](#changelog) al final).

---

## Contexto

Entorno local ya levantado:
- Backend Medusa v2 en `localhost:9000` (admin en `/app`)
- Storefront Next.js en `localhost:8000`
- Postgres 16 + Redis 7 en Docker (`medusa-postgres`, `medusa-redis`)
- Data base sembrada (región CR, CRC/USD, envíos, productos demo, inventario)
- Usuario admin: `admin@craia.net`

Pago: **ONVO Pay** (procesador de tarjetas de Costa Rica), no Stripe.

---

## Hallazgos del análisis de código

### 🔴 Bug bloqueante: ONVO no enlazado a la región CR
La región Costa Rica solo tiene `pp_system_default` como método de pago en la DB; **falta `pp_onvo-pay_onvo-pay`**. Sin esto el checkout no ofrece ONVO.

- **Causa raíz:** la migración `initial-data-seed.ts:94` crea la región solo con `["pp_system_default"]`. El script `seed.ts:145` sí incluye ONVO, pero hace `if (crRegion) { skip }` y no actualiza una región existente. Como la migración corre primero, ONVO nunca se enlaza.
- **Fix:** agregar `pp_onvo-pay_onvo-pay` a la región CR (vía admin o script `medusa exec`).

### 🟡 Ruta correcta del webhook
El provider id real es `pp_onvo-pay_onvo-pay` (no `pp_onvo-pay`). Medusa arma la ruta como `pp_{param}`, por lo tanto:

```
/hooks/payment/onvo-pay_onvo-pay
```

### ✅ Ya listo (no se toca)
- Provider ONVO registrado en `medusa-config.ts:47` y habilitado en DB.
- Componentes ONVO del checkout cableados en el storefront (payment-wrapper, payment-button, tokenización).
- CORS para `localhost:8000`.
- `STOREFRONT_HOST=localhost` → host del return URL de 3DS permitido.

---

## Plan de ejecución

| # | Paso | Responsable | Estado |
|---|------|-------------|--------|
| 1 | Crear rama `setup/fase-de-prueba` | Claude | ✅ Hecho |
| 2 | Crear este documento (plan + changelog) | Claude | ✅ Hecho |
| 3 | Enlazar ONVO `pp_onvo-pay_onvo-pay` a la región CR | Claude | ✅ Hecho |
| 4 | Levantar túnel cloudflared → `localhost:9000` | Claude | ✅ Hecho |
| 5 | Crear webhook en ONVO con `https://<tunnel>/hooks/payment/onvo-pay_onvo-pay` | Usuario | ⬜ Pendiente |
| 6 | Cargar 4 llaves ONVO en los `.env` (3 API keys + webhook secret) | Usuario → Claude | ✅ Hecho |
| 7 | Reiniciar backend (lee `requireEnv` al arrancar) | Claude | ✅ Hecho |
| 8 | Compra de prueba end-to-end | Juntos | 🔄 En curso |
| 9 | Documentar resultados y plan de deploy a producción | Claude | ⬜ Pendiente |

### Llaves ONVO requeridas (test mode)

| Variable | Archivo | Origen en ONVO |
|----------|---------|----------------|
| `ONVO_SECRET_KEY` | `apps/backend/.env` | Desarrolladores → Llaves API → Secret |
| `ONVO_PUBLISHABLE_KEY` | `apps/backend/.env` | Desarrolladores → Llaves API → Publishable |
| `NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY` | `apps/storefront/.env.local` | misma publishable key |
| `ONVO_WEBHOOK_SECRET` | `apps/backend/.env` | sale al crear el webhook |

---

## Notas / Riesgos
- La URL del túnel cloudflared es **efímera**: cambia al reiniciar el túnel → habría que reconfigurar el webhook en ONVO.
- Las llaves ONVO van en `.env` (ignorados por git), nunca se commitean.
- Para producción el webhook debe apuntar al backend desplegado (Railway), no a craia.net (que es un sitio estático, no el backend Medusa).

---

## Changelog

### 2026-06-18
- **Rama `setup/fase-de-prueba` creada** desde `main`.
- **Documento de plan + changelog creado** (`docs/SETUP-FASE-PRUEBA.md`).
- **Análisis de código completado:** identificado bug bloqueante (ONVO no enlazado a región CR) y corregida la ruta del webhook a `/hooks/payment/onvo-pay_onvo-pay`.
- **Paso 3 ✅ — ONVO enlazado a la región CR.** Creado script idempotente `apps/backend/src/scripts/link-onvo-region.ts` y ejecutado. DB verificada: región Costa Rica ahora tiene `pp_system_default` + `pp_onvo-pay_onvo-pay`.
- **Paso 4 ✅ — Túnel cloudflared levantado.** URL pública: `https://postal-velocity-teams-professor.trycloudflare.com` → `localhost:9000`. Verificado: `/health` → 200 y `POST /hooks/payment/onvo-pay_onvo-pay` → `OK` 200 (alcanza el backend Medusa real).
  - ⚠️ URL efímera: si se reinicia el túnel, cambia y hay que reconfigurar el webhook en ONVO.
  - **URL del webhook para pegar en ONVO:** `https://postal-velocity-teams-professor.trycloudflare.com/hooks/payment/onvo-pay_onvo-pay`
- **Pasos 6 y 7 ✅ — Llaves ONVO cargadas y backend reiniciado.** Las 3 llaves (secret, publishable, webhook secret) en `apps/backend/.env` y la publishable también en `apps/storefront/.env.local`. Se removieron los comentarios inline de las líneas para evitar ambigüedad de parseo en dotenv. Backend reinició sin error de `requireEnv`.
  - **Verificado:** `GET /store/payment-providers?region_id=<CR>` devuelve `pp_onvo-pay_onvo-pay` (enabled) — el checkout ya ofrece ONVO.
- **Paso 8 🔄 — Compra de prueba end-to-end** (en curso).
- **🐛 Fix: ONVO no aparecía en el checkout.** Causa: `apps/storefront/src/lib/data/payment.ts:24` pide `/store/payment-providers` con `cache: "force-cache"` + tag de Next. El storefront había cacheado la lista de providers ANTES de enlazar ONVO a la región, y ese data-cache (`.next/cache/fetch-cache`, 336K) sobrevive a los reinicios. Solución aplicada: borrar `.next/cache/fetch-cache` y reiniciar el storefront. La API ya devolvía ONVO correctamente; era puro caché de Next.
  - Nota para producción: tras cambios de configuración de región/pago, hay que invalidar el tag `payment_providers` (o limpiar cache) para que el storefront lo refleje.
- **Repo de referencia `CRAIAHQ/Ecommerce-test`** clonado en `../Ecommerce-test`. Es un storefront Medusa estándar SIN integración ONVO — sirve como referencia de UI de checkout, no como base de pago. La integración ONVO real vive en este `medusa-template`.
- **Commit `7a45fcd`** — setup de fase de prueba (script link-onvo-region, este doc, package-lock).
- **🎨 Migración de diseño del storefront de referencia.** Hallazgo: ambos storefronts parten de la MISMA base; el template = base + ONVO, la referencia = base + diseño. Estrategia: `rsync REF/src → TPL/src` excluyendo los 6 archivos con ONVO (constants.tsx, cart.ts, payment-button, payment-container, payment-wrapper, payment/index) + copia de `tailwind.config.js`. Se conservó `check-env-variables.js` del template (valida más vars).
  - **Traído:** 25 archivos de diseño (home, hero, nav, footer, templates de store/products/cart/categories/collections, layout, globals.css) + 8 componentes/datos nuevos (brands-bar, browse-by-style, testimonials, announcement-bar, product-reviews, filter-sidebar, sort-dropdown, reviews.ts).
  - **Verificado:** build del storefront OK (sin errores de tipos/imports), checkout compila con ONVO (26.8 kB), ONVO intacto en los 6 archivos protegidos, home `/cr` → 200.
  - **Pendiente:** verificación visual por el usuario + commit del diseño.
- **💳 Rediseño del paso de pago (ONVO).** El checkout usaba el estilo default de Medusa (`bg-ui-bg-field`, `border-ui-border-interactive`, `shadow-borders-*`). Rediseñado en `payment-container/index.tsx` acorde al tema nuevo (negro/blanco, `rounded-lg`, bordes `gray-200`, focus ring `gray-900`):
  - Tarjetas de método de pago: seleccionable con borde negro + ring, hover suave, ícono en chip.
  - Formulario de tarjeta ONVO: panel gris con inputs limpios, detección de marca (Visa/Mastercard/Amex), y nota de "Pago seguro · cifrado por ONVO" con ícono de candado.
  - `StripeCardContainer` actualizado al mismo estilo de input por consistencia.
  - Sin cambios de lógica (mismos estados, handlers, nombres de campo). Typecheck OK.
- **Reinicio del entorno local** (Docker + dev servers + túnel). ⚠️ El túnel cloudflared cambió de URL al reiniciar → el webhook de ONVO con la URL vieja quedó obsoleto (irrelevante de cara a producción).
- **📄 Plan de deploy a producción creado:** [DEPLOY-PRODUCCION.md](./DEPLOY-PRODUCCION.md) — Railway (backend) + Vercel (storefront) + webhook ONVO, adaptado a este repo e incluyendo las vars de ONVO que el ONBOARDING original no tenía.
- **🚂 Backend desplegado en Railway (`craia-prod`).** https://medusa-template-production.up.railway.app vivo (`/health`, `/app` → 200). Migraciones + seed + admin + ONVO enlazado a región, todo en prod. Para lograrlo se corrigieron 8 bugs del `railway.json` del template (ver [DEPLOY-PRODUCCION.md → Estado actual](./DEPLOY-PRODUCCION.md)). Publishable key prod creada.
- **⏸️ Storefront en Vercel PAUSADO** — Vercel exige plan Pro para repos privados de org; pendiente decidir plan (Pro Trial / Pro / mover storefront a Railway) con el equipo. Detalle y pasos pendientes en [DEPLOY-PRODUCCION.md](./DEPLOY-PRODUCCION.md).
- **✅ Paso 8 — Compra de prueba validada (parcial).** Flujo end-to-end funciona: tokenización (probada directo contra ONVO → 201, tarjeta Visa activa), `POST /store/onvo/set-payment-method → 200`, orden creada (`order_01KVKJDBNQQM5ANVN6NK3TW9W5`), página de confirmación OK.
  - ⚠️ Pago quedó en **`authorized`**, NO `captured` (`captured_at` null, monto ₡18,500). Causa: el webhook de ONVO apunta a la URL vieja del túnel (cambió al reiniciar) → ONVO no pudo confirmar la captura. Para cerrar el ciclo en local: actualizar el webhook a la URL actual del túnel y repetir. En producción (URL fija de Railway) no aplica.
  - Observación menor: `GET /store/locales → 404` en el backend (el storefront de referencia pide ese endpoint que no existe en el backend; no afecta el pago).
- **🐛🔧 Bug del webhook ONVO encontrado y arreglado.** El pago se cobraba en ONVO pero Medusa quedaba en `authorized`. Capturando el payload real de ONVO (ruta temporal `/debug-onvo`) se confirmó que ONVO envía `{ type: "payment-intent.succeeded", data: { ...intent, metadata.session_id, amount } }`. El `getWebhookActionAndData` del plugin `@craiahq/medusa-plugin-base@0.2.0` tenía 2 bugs: (1) comparaba `payment_intent.succeeded` (guion bajo) vs el real `payment-intent.succeeded` (guion); (2) no devolvía `data.session_id`/`amount` que Medusa exige para correlacionar el pago.
  - **Fix aplicado (override local):** `apps/backend/src/modules/onvo-pay/{service.ts,index.ts}` extiende el servicio del plugin y corrige `getWebhookActionAndData` (tipo con guion + `session_id`/`amount` desde `event.data`), manteniendo id `onvo-pay`. `medusa-config.ts` ahora resuelve `./src/modules/onvo-pay`. Sobrevive a `npm ci` → funciona en producción sin esperar release del plugin.
  - **Fix upstream:** misma corrección hecha en el source del plugin (`medusa-ops/src/modules/onvo-pay/service.ts`) para publicar después (requiere token `write:packages`). Al publicar y bumpear, se puede quitar el override local.
  - **Validado:** webhook simulado con formato real → pago pasó de `authorized` a `completed` con `captured_at` seteado. ✅
  - Descartado: ruta custom del plugin `/store/webhooks/onvo` está rota para ONVO (espera header `x-webhook-secret` que ONVO no envía + exige publishable key). La ruta correcta es la estándar `/hooks/payment/onvo-pay_onvo-pay`.
  - Nota seguridad (follow-up): el path `/hooks/payment/...` no verifica firma del webhook. Conviene endurecerlo validando la firma de ONVO en el futuro.
