# Brands — Plan de Implementación (Plugin compartido)

> Documento generado a partir de una sesión de _grilling_ (stress-test del diseño).
> Destino del código: **`@craiahq/medusa-plugin-base`** (repo/paquete separado en GitHub Packages),
> salvo las migraciones, que son **project-local** (`apps/backend`) por las reglas de Medusa v2.

---

## 1. Decisiones tomadas en el grilling

| # | Decisión | Elección |
|---|----------|----------|
| 1 | Propósito de la feature | **De cara al storefront** — el comprador navega productos por marca |
| 2 | Cómo se asigna una marca a un producto | **Widget de producto editable** + endpoint de link dedicado (relación 1-a-1) |
| 3 | Generación del `handle` | **Auto-slug desde `name` al crear, editable después** + modal de creación + validación de unicidad |
| 4 | Páginas de storefront | **Ambas**: `/[countryCode]/brands` (listado) y `/[countryCode]/brands/[handle]` (detalle) |
| 5 | `brands-bar` del home | **Dinámico y clickable** (lee de `/store/brands`, enlaza a cada marca); se acepta estilo tipográfico uniforme |
| 6 | Dónde vive el código | **Plugin compartido** `@craiahq/medusa-plugin-base` (una sola fuente de verdad, llega a clientes vía Renovate) |
| 7 | Eliminar marcas en admin | **Sí, con desenlace automático** de productos + limpieza de links colgantes (soft-delete de Medusa) |
| 8 | Validación de endpoints admin | **Zod completo** en `POST`/`PUT` vía `validateAndTransformBody` (consistente con `GetBrandsSchema`) |
| 9 | Seed de marcas | **Sembrar 2-3 marcas de ejemplo enlazadas a productos**, idempotente por `handle` |
| 10 | `handle` nullable u obligatorio | **Backfill + `not null unique`**, eliminar la rama de fallback `?? id` |
| 11 | Versionado/propagación del plugin | **Minor version** + nota de release explícita con el paso `db:generate && db:migrate` |

---

## 2. Arquitectura: qué vive en el plugin y qué es project-local

Por la regla de tu `CLAUDE.md` («Migrations are project-local, not plugin-local»), la feature
se reparte así:

| Pieza | Ubicación | Nota |
|-------|-----------|------|
| Módulo `brand` (modelo, servicio, `index.ts`) | **Plugin** | `BRAND_MODULE`, modelo `Brand` |
| Link `brand ↔ product` | **Plugin** | `defineLink`, `isList: false` |
| API admin (`/admin/brands`, link producto↔brand) | **Plugin** | rutas + middlewares de validación |
| API store (`/store/brands`, `/store/brands/[handle]`) | **Plugin** | ya implementadas en este repo, se trasladan |
| Admin UI (página brands, widget de producto) | **Plugin** | extensiones de admin se empaquetan en el plugin |
| **Migraciones** del modelo y del link | **`apps/backend` (project-local)** | se **regeneran** con `npx medusa db:generate brand` tras instalar el plugin |
| Storefront (páginas + `brands-bar`) | **`apps/storefront`** | el storefront no consume el plugin de backend; consume las store APIs por HTTP |

> ⚠️ **Implicación clave:** las migraciones que hoy existen en
> `apps/backend/src/modules/brand/migrations/` **no se mueven tal cual** al plugin.
> Una vez que el modelo viva en el plugin y el plugin esté instalado en `apps/backend`,
> se corre `npx medusa db:generate brand` para regenerar la migración project-local y se commitea.

---

## 3. Restricciones de Medusa v2 que aplican (de `CLAUDE.md`)

- **Todos los `@medusajs/*` a la misma versión** (hoy `2.15.5`) — el plugin debe alinear su `peerDependency`.
- **Migraciones project-local** — ver §2.
- **Nombres de módulo en camelCase** en `defineModule()` — `BRAND_MODULE = "brand"` ok.
- **Redis requerido en producción** — no afecta a brands.
- **Seed recibe `{ container }`** — resolver servicios del contenedor, no importar directo.
- **Al añadir/modificar env vars** → actualizar `apps/backend/.env.template`. (Brands no añade env vars.)

---

## 4. Implementación por capa

### 4.1 Módulo `brand` (plugin)

Modelo actual (se mantiene):

```ts
export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  handle: model.text().unique(),   // not-null (decisión #10)
})
```

- `handle` pasa a ser **obligatorio y único** (decisión #10). Migración de backfill rellena los
  handles faltantes (slug del `name`) antes de aplicar el `not null`. Se **elimina** la rama de
  fallback `?? b.id` de las store APIs.

### 4.2 Link `brand ↔ product` (plugin)

Se mantiene `defineLink(Product, { linkable: Brand, isList: false })`.
`isList: false` = un producto tiene a lo sumo una marca → coincide con la decisión #2.

### 4.3 Generación de `handle` + creación (decisión #3)

**`POST /admin/brands`** pasa a:

1. Recibir `{ name, handle? }`, validado con **zod** (nuevo schema en `middlewares.ts`).
2. Si no viene `handle`, **auto-slug** desde `name`:
   - lowercase, quitar acentos/diacríticos, espacios → `-`, quitar caracteres no `[a-z0-9-]`.
   - Utilidad propia (sin dependencia nueva), p.ej. `toHandle(name: string): string`.
3. **Garantizar unicidad**: si el slug existe, sufijar `-2`, `-3`, …
4. Crear la marca con `name` + `handle`.

**Edición** (`PUT/POST /admin/brands/:id`): permite cambiar `name` y `handle` (re-valida unicidad).

### 4.4 Asignación producto ↔ marca (decisión #2)

Nuevo endpoint admin, p.ej. **`POST /admin/products/:id/brand`** con body `{ brand_id | null }`:

- Resuelve el `Link` service del contenedor.
- Si `brand_id` → crea/reemplaza el link `product ↔ brand`.
- Si `null` → elimina el link existente (des-asignar).

> El widget de producto (4.6) consume este endpoint.

### 4.5 Admin UI — página `/app/brands` (plugin)

Hoy solo lista `id` + `name`. Se amplía con:

- **Botón "Crear marca"** → modal con campo `name` (y `handle` opcional editable) → `POST /admin/brands`.
- Columna **`handle`** en la tabla.
- Acciones de fila: **Editar** (modal) y **Eliminar** (con confirmación). Eliminar borra la marca
  (soft-delete) **y limpia los links `brand-product`** de esa marca para no dejar links colgantes;
  los productos quedan sin marca (estado válido) — decisión #7.
- Mantiene paginación con `DataTable` + TanStack Query.

### 4.6 Admin UI — widget de producto (plugin)

Hoy es **solo-lectura**. Se vuelve **editable**:

- Muestra la marca actual.
- Dropdown/select que lista las marcas (`GET /admin/brands`) para asignar/cambiar.
- Opción de **quitar** la marca (envía `null`).
- Al guardar → `POST /admin/products/:id/brand`; invalida la query del producto.

### 4.7 Store API (plugin) — ya implementada

- `GET /store/brands` → lista con `product_count`, ordenada por nombre. ✅
- `GET /store/brands/[handle]` → `{ brand, product_ids }`. ✅
- **Diseño confirmado (two-step):** la API por handle devuelve `product_ids`, y el storefront
  hace una segunda llamada a `/store/products?id=...` para traer **precios por región/moneda**.
  Es correcto: el módulo brand no conoce la región del comprador; el pricing vive en el flujo estándar.

### 4.8 Storefront — páginas (decisión #4)

- **`/[countryCode]/brands`**: consume `GET /store/brands`, renderiza grid de marcas con su
  conteo, cada una enlaza a su detalle.
- **`/[countryCode]/brands/[handle]`**: consume `GET /store/brands/[handle]` → toma `product_ids`
  → `GET /store/products?id=...&region_id=...` para precios → renderiza con el grid de producto existente.
- Reusar componentes de listado/precio ya existentes del storefront.

### 4.9 Storefront — `brands-bar` dinámico (decisión #5)

- Reemplazar el array hardcodeado por fetch a `GET /store/brands`.
- Cada marca enlaza a `/[countryCode]/brands/[handle]`.
- Estilo tipográfico **uniforme** (se pierde el per-marca de lujo, aceptado en el grilling).
- Manejar estado vacío (sin marcas) → no renderizar el bar.

### 4.10 Seed (decisión #9)

El seed de `apps/backend` crea **2-3 marcas de ejemplo** y las **enlaza a productos ya sembrados**,
para que la feature sea demoable out-of-the-box. Idempotente (no duplica si ya existe el `handle`),
resolviendo servicios del contenedor. El cliente luego borra las de ejemplo y pone las suyas.

---

## 5. Pasos para llevar el código de este repo → al plugin

1. En el repo del plugin `@craiahq/medusa-plugin-base`:
   - Copiar `src/modules/brand/{models,service,index.ts}` (sin `migrations/`).
   - Copiar `src/links/brand-product.ts`.
   - Copiar rutas `src/api/admin/brands/*`, `src/api/store/brands/*` y `middlewares.ts` (mergear).
   - Copiar admin UI `src/admin/routes/brands/*` y `src/admin/widgets/product-brand.tsx`.
   - Implementar lo nuevo: slug util, validación zod, edición, endpoint de link, widget editable.
   - Alinear `@medusajs/*` a `2.15.5` como peer dependency.
   - Publicar nueva versión.
2. En `apps/backend` de este template (y de cada cliente, vía Renovate):
   - Actualizar `@craiahq/medusa-plugin-base`.
   - **Borrar** `src/modules/brand/`, `src/links/brand-product.ts`, `src/api/.../brands/`, las
     extensiones de admin y `middlewares.ts` (ahora vienen del plugin).
   - Correr `npx medusa db:generate brand` → commitear la migración **project-local** regenerada.
   - `npx medusa db:migrate`.
3. Storefront: implementar §4.8 y §4.9 (no depende del plugin de backend, solo de las store APIs).

---

## 6. Versionado y propagación del plugin (decisión #11)

Brands añade **data models nuevos**, y por la regla de `CLAUDE.md` los bumps que agregan data
models **no son zero-touch**.

- La feature entra como **minor version** del plugin (no es semver-major real: las tablas viejas
  siguen funcionando, es un módulo aditivo).
- La **nota de release debe incluir, imposible de ignorar**, el paso manual por cliente:

  > ⚠️ Esta versión añade el módulo **Brands**. Tras mergear el PR de Renovate, en `apps/backend`:
  > `npx medusa db:generate brand && npx medusa db:migrate`

- Documentar en `TEMPLATE-SYNC.md` que los bumps del plugin con migración requieren ese paso
  (Renovate solo abre el PR; no corre migraciones).
- Propaga a **todos** los clientes vía Renovate, pero cada uno ejecuta la migración manualmente.

---

## 7. Checklist de implementación

- [ ] Plugin: módulo brand (modelo + servicio + index)
- [ ] Plugin: link brand-product
- [ ] Plugin: slug util + auto-handle + unicidad
- [ ] Plugin: validación zod en middlewares
- [ ] Plugin: `POST/PUT /admin/brands` (crear/editar con handle)
- [ ] Plugin: `POST /admin/products/:id/brand` (asignar/quitar)
- [ ] Plugin: página `/app/brands` con crear/editar/eliminar
- [ ] Plugin: widget de producto editable
- [ ] Plugin: store APIs (trasladar las existentes)
- [ ] Plugin: publicar versión
- [ ] Backend: actualizar plugin, borrar código local, regenerar migración, migrar
- [ ] Storefront: página `/brands`
- [ ] Storefront: página `/brands/[handle]`
- [ ] Storefront: `brands-bar` dinámico
- [ ] (Opcional) Seed de marcas de ejemplo
