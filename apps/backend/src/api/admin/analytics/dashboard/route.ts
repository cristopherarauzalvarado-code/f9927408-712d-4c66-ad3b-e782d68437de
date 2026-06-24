// src/api/admin/analytics/dashboard/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API — Dashboard Analytics (on-the-fly aggregation)
// GET /admin/analytics/dashboard
//
// Agrega las órdenes reales para alimentar el dashboard /app/overview:
//   • revenue        → ingresos del año en curso + tendencia mes vs mes anterior
//   • ordersByMonth  → serie mensual Ene–Dic del año en curso (revenue + nº órdenes)
//   • bestSellers    → top productos por UNIDADES vendidas, últimos 30 días
//   • salesByCategory→ participación de unidades por categoría (año en curso) → pie
//   • customers      → nuevos vs recurrentes (ventana cargada) → pie
//
// Decisión de grilling #1: cálculo on-the-fly (sin pre-cómputo). Adecuado para el
// volumen de tiendas de agencia. Si un cliente escala a cientos de miles de órdenes,
// migrar a un módulo de analítica con subscribers/cron (v2).
//
// NOTA DE ARQUITECTURA: este endpoint es project-local para que funcione hoy.
// El plan (docs/DASHBOARD-ANALITICA-IMPLEMENTACION.md) es moverlo al plugin
// compartido @craiahq/medusa-plugin-base. No añade data models → bump zero-touch.
// ─────────────────────────────────────────────────────────────────────────────
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Etiquetas de mes para la serie anual (índice 0 = Enero)
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// Ingreso de una orden: usa `total` si viene calculado; si no, suma los line items.
function orderRevenue(order: any): number {
  if (typeof order.total === "number" && !Number.isNaN(order.total)) return order.total
  const items: any[] = order.items ?? []
  return items.reduce((sum, it) => {
    const lineTotal = typeof it.total === "number"
      ? it.total
      : (it.unit_price ?? 0) * (it.quantity ?? 0)
    return sum + (lineTotal ?? 0)
  }, 0)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  // Cargamos desde el inicio del año o 30 días atrás, lo que sea más temprano,
  // para cubrir a la vez las métricas anuales y la ventana de 30 días.
  const since = startOfYear < days30Ago ? startOfYear : days30Ago

  // ── Órdenes con sus line items (ventana acotada) ──────────────────────────
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "fulfillment_status",
      "currency_code",
      "created_at",
      "customer_id",
      "total",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.product_id",
      "items.product_title",
      "items.title",
      "items.thumbnail",
    ],
    filters: { created_at: { $gte: since.toISOString() } as any },
    pagination: { take: 5000, skip: 0 },
  })

  // Excluimos órdenes canceladas de todas las métricas de ingresos/ventas
  const valid = (orders ?? []).filter(
    (o: any) => o.status !== "canceled" && o.status !== "cancelled"
  )

  // ── 1) Serie mensual del año en curso (revenue + nº de órdenes) ───────────
  const monthRevenue = new Array(12).fill(0)
  const monthOrders = new Array(12).fill(0)
  const year = now.getFullYear()
  for (const o of valid) {
    const d = new Date(o.created_at)
    if (d.getFullYear() !== year) continue
    const m = d.getMonth()
    monthRevenue[m] += orderRevenue(o)
    monthOrders[m] += 1
  }
  const ordersByMonth = MONTHS.map((label, i) => ({
    month: label,
    revenue: monthRevenue[i],
    orders: monthOrders[i],
  }))

  // Revenue del año = suma de la serie mensual
  const revenueYear = monthRevenue.reduce((a, b) => a + b, 0)

  // Tendencia: mes actual vs mes anterior (del mismo año)
  const curM = now.getMonth()
  const prevRev = curM > 0 ? monthRevenue[curM - 1] : 0
  const curRev = monthRevenue[curM]
  const trendPct = prevRev > 0
    ? ((curRev - prevRev) / prevRev) * 100
    : (curRev > 0 ? 100 : 0)
  const ordersPrev = curM > 0 ? monthOrders[curM - 1] : 0
  const ordersCur = monthOrders[curM]
  const ordersTrendPct = ordersPrev > 0
    ? ((ordersCur - ordersPrev) / ordersPrev) * 100
    : (ordersCur > 0 ? 100 : 0)

  // ── 2) Best-sellers por unidades, últimos 30 días ─────────────────────────
  const byProduct = new Map<string, { product_id: string; title: string; thumbnail: string | null; units: number; revenue: number }>()
  for (const o of valid) {
    if (new Date(o.created_at) < days30Ago) continue
    for (const it of (o.items ?? [])) {
      if (!it) continue
      const pid = it.product_id ?? it.title ?? "unknown"
      const prev = byProduct.get(pid) ?? {
        product_id: it.product_id ?? "",
        title: it.product_title ?? it.title ?? "Producto",
        thumbnail: it.thumbnail ?? null,
        units: 0,
        revenue: 0,
      }
      prev.units += it.quantity ?? 0
      prev.revenue += typeof it.total === "number" ? it.total : (it.unit_price ?? 0) * (it.quantity ?? 0)
      byProduct.set(pid, prev)
    }
  }
  const bestSellers = [...byProduct.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 8)

  // ── 3) Ventas por categoría (año en curso) → pie ──────────────────────────
  // Recolecta product_ids del año, resuelve sus categorías y suma unidades.
  const yearItems: { product_id: string; quantity: number }[] = []
  for (const o of valid) {
    if (new Date(o.created_at).getFullYear() !== year) continue
    for (const it of (o.items ?? [])) {
      if (it?.product_id) yearItems.push({ product_id: it.product_id, quantity: it.quantity ?? 0 })
    }
  }
  const productIds = [...new Set(yearItems.map((i) => i.product_id))]
  const productCategory = new Map<string, string>()
  if (productIds.length) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "categories.name"],
      filters: { id: productIds },
    })
    for (const p of (products ?? [])) {
      const catName = (p as any).categories?.[0]?.name ?? "Sin categoría"
      productCategory.set(p.id, catName)
    }
  }
  const categoryUnits = new Map<string, number>()
  for (const it of yearItems) {
    const cat = productCategory.get(it.product_id) ?? "Sin categoría"
    categoryUnits.set(cat, (categoryUnits.get(cat) ?? 0) + it.quantity)
  }
  const salesByCategory = [...categoryUnits.entries()]
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => b.units - a.units)

  // ── 4) Clientes nuevos vs recurrentes (ventana cargada) ───────────────────
  const ordersPerCustomer = new Map<string, number>()
  let guestOrders = 0
  for (const o of valid) {
    if (!o.customer_id) { guestOrders += 1; continue }
    ordersPerCustomer.set(o.customer_id, (ordersPerCustomer.get(o.customer_id) ?? 0) + 1)
  }
  let newCustomers = 0
  let returningCustomers = 0
  for (const count of ordersPerCustomer.values()) {
    if (count > 1) returningCustomers += 1
    else newCustomers += 1
  }

  // ── 5) Pedidos recientes (últimos 5) ──────────────────────────────────────
  const recentOrders = [...valid]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((o: any) => ({
      id: o.id,
      display_id: o.display_id,
      email: o.email ?? null,
      status: o.status,
      fulfillment_status: o.fulfillment_status ?? null,
      total: orderRevenue(o),
      created_at: o.created_at,
    }))

  res.json({
    revenue: {
      total: revenueYear,
      trendPct: Math.round(trendPct * 10) / 10,
      year,
    },
    recentOrders,
    orders: {
      trendPct: Math.round(ordersTrendPct * 10) / 10,
    },
    ordersByMonth,
    bestSellers,
    salesByCategory,
    customers: {
      new: newCustomers,
      returning: returningCustomers,
      guests: guestOrders,
    },
  })
}
