# Dashboard de Analítica — Plan de Implementación

> Documento generado a partir de una sesión de _grilling_ (stress-test del diseño).
> Convierte el dashboard `/app/overview` (hoy con cards-placeholder) en analítica real.
> Reparto de código: **endpoints → plugin `@craiahq/medusa-plugin-base`**, **UI → plantilla `apps/backend`**.

---

## 1. Decisiones tomadas en el grilling

| # | Tema | Elección |
|---|------|----------|
| 1 | Estrategia de datos | **Endpoints on-the-fly** (`GET /admin/analytics/*`), agregan órdenes en el request — datos siempre frescos |
| 2 | Librería de gráficas | **Recharts**, cargada solo en la página del dashboard (no global) |
| 3 | "Productos más vendidos" | **Por unidades vendidas, últimos 30 días, top 5-10** (agregando line items de órdenes) |
| 4 | Pie charts | **Productos por categoría** + **clientes nuevos vs recurrentes** |
| 5 | Dónde vive el código | **Híbrido**: endpoints de analítica → plugin; UI del dashboard → plantilla |
| 6 | Alcance del v1 | **Sales Target SÍ**, **Customer Map FUERA** (mapa caro + clientes mono-país CR) |
| 7 | Control de período | **Ventanas fijas por card** (sin date-picker en v1) |
| 8 | Meta de Sales Target | Guardada en **`store.metadata`** (sin módulo ni migración) |

---

## 2. Estado actual vs. lo que falta

**Ya real** (en [`apps/backend/src/admin/routes/overview/page.tsx`](../apps/backend/src/admin/routes/overview/page.tsx), vía SDK):
Total Products, Total Customers, Total Orders, Recent Revenue (suma de últimas 50 órdenes).

**Placeholder / a construir:**
- "Popular Products" — hoy lista 4 productos **sin orden real** → reemplazar por best-sellers reales (decisión #3).
- "Sales this year" (gráfica mensual) → endpoint de agregación.
- "Sales Target" → meta en metadata + cálculo de progreso.
- Pie charts (productos por categoría, clientes nuevos/recurrentes) → no existen.
- ~~Customer Map~~ → **descartado del v1**.

---

## 3. Arquitectura: plugin vs. plantilla (decisión #5)

| Pieza | Ubicación |
|-------|-----------|
| Endpoints `GET /admin/analytics/*` (lógica de agregación) | **Plugin** |
| Endpoint/lectura-escritura de la meta en `store.metadata` | **Plugin** |
| Página `/app/overview` (UI, tokens Figma, branding) | **Plantilla** `apps/backend` |
| Formulario "Goal configuration" (UI) | **Plantilla** |
| Dependencia Recharts | **Plantilla** (es UI) |

> Mismo principio que en brands: lógica reutilizable al plugin, presentación/branding (que varía por
> cliente) en la plantilla. No requiere migraciones (no hay data models nuevos — la meta vive en metadata).

---

## 4. Endpoints de analítica a construir (plugin)

Todos on-the-fly, ventanas **fijas** (decisión #7), sin params de fecha en v1.

| Endpoint | Devuelve | Fuente / agregación |
|----------|----------|---------------------|
| `GET /admin/analytics/revenue` | Total de ingresos + % de tendencia | Suma de totales de órdenes (ventana fija) |
| `GET /admin/analytics/orders-by-month` | Serie mensual Ene–Dic del año actual | Órdenes agrupadas por mes |
| `GET /admin/analytics/best-sellers` | Top 5-10 productos por **unidades**, últimos **30 días** | Agregación de `order_line_item.quantity` por producto/variante |
| `GET /admin/analytics/sales-by-category` | Participación de unidades por categoría (pie) | Line items → producto → categoría, sumando `quantity` |
| `GET /admin/analytics/customers-breakdown` | `{ new, returning }` (pie) | Órdenes agrupadas por `customer_id`: 1 orden = nuevo, >1 = recurrente |

Métricas que **no** necesitan endpoint nuevo (ya salen del SDK con `count`): Total Products, Total
Customers, Total Orders.

> **Nota de rendimiento (decisión #1):** on-the-fly es correcto para el volumen de estos clientes.
> Si algún cliente escala a cientos de miles de órdenes, migrar a un módulo de analítica con
> pre-cómputo (subscribers/cron) — explícitamente **v2**, no ahora.

---

## 5. Sales Target (decisión #6 + #8)

- La meta anual se guarda en `store.metadata`, p.ej. `{ "sales_target_2026": 50000 }`.
- **Lectura**: el card calcula progreso = `revenue_del_año / meta`.
- **Escritura**: el link "Goal configuration" abre un formulario que actualiza `store.metadata`
  (vía `sdk.admin.store.update` o un endpoint custom delgado en el plugin).
- Cero módulo, cero migración. Si en el futuro se necesitan metas por mes/canal/histórico → módulo `goal` (v2).

---

## 6. Gráficas (decisión #2 + #4)

- **Recharts** como única dependencia de gráficas, importada solo en la página del dashboard.
- **Línea** "Sales this year" → `orders-by-month`.
- **Pie 1 — Productos por categoría** → `sales-by-category`.
- **Pie 2 — Clientes nuevos vs recurrentes** → `customers-breakdown`.
- **Tabla best-sellers** (no es gráfica) → `best-sellers`.
- Manejar estados: loading (skeleton), vacío (sin órdenes → mensaje, no pie en blanco).

---

## 7. Restricciones de Medusa v2 que aplican

- Endpoints admin custom → resolver `query`/servicios del contenedor (no importar directo).
- Validación de cualquier query param con zod si se añaden filtros (v2).
- `@medusajs/*` a versión única (`2.15.5`) en el plugin.
- Recharts: añadir a `apps/backend` (UI), no al plugin.
- No se añaden env vars → no hay que tocar `.env.template`.

---

## 8. Pasos de implementación

1. **Plugin** — crear los 5 endpoints de `/admin/analytics/*` (§4) + helper para leer/escribir la meta en `store.metadata`. Publicar minor version (sin migración → bump zero-touch, a diferencia de brands).
2. **Plantilla** — `apps/backend`:
   - `npm i recharts` en el backend (es UI del admin).
   - Reescribir `src/admin/routes/overview/page.tsx`: conectar cada card a su endpoint, reemplazar
     "Popular Products" por best-sellers reales, añadir los 2 pie charts y la línea mensual.
   - Quitar el placeholder de Customer Map.
   - Añadir el formulario "Goal configuration" (escribe `store.metadata`).
3. Verificar con datos sembrados (idealmente tras tener órdenes de ejemplo en el seed).

---

## 9. Checklist

- [ ] Plugin: `GET /admin/analytics/revenue`
- [ ] Plugin: `GET /admin/analytics/orders-by-month`
- [ ] Plugin: `GET /admin/analytics/best-sellers` (unidades, 30 días)
- [ ] Plugin: `GET /admin/analytics/sales-by-category`
- [ ] Plugin: `GET /admin/analytics/customers-breakdown`
- [ ] Plugin: lectura/escritura de meta en `store.metadata`
- [ ] Plugin: publicar minor version
- [ ] Backend: `npm i recharts`
- [ ] Backend: cards reales (revenue, totales, best-sellers)
- [ ] Backend: gráfica de línea mensual
- [ ] Backend: pie productos por categoría
- [ ] Backend: pie clientes nuevos/recurrentes
- [ ] Backend: card + formulario Sales Target
- [ ] Backend: quitar Customer Map
- [ ] Estados de loading/vacío en todas las cards

---

## 10. Diferida explícitamente a v2

- Date-range picker global (decisión #7 fijó ventanas fijas).
- Módulo de analítica con pre-cómputo (decisión #1 fijó on-the-fly).
- Customer Map / analítica geográfica (decisión #6).
- Metas por mes/canal/histórico (decisión #8).
