// src/admin/routes/overview/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// CRAIA Admin — Dashboard Overview Page
// Route: /app/overview
//
// Renderiza DENTRO del chrome nativo de Medusa (sidebar/navbar reales) — no
// reimplementa una barra lateral falsa. Sigue el tema (claro/oscuro) del admin.
//
// DATOS (todos reales):
//   • Stat cards (Ingresos/Clientes/Transacciones/Productos) → SDK + analytics
//   • Gráfica mensual, best-sellers, pies, pedidos recientes → GET /admin/analytics/dashboard
//   • Meta de ventas → GET/POST /admin/analytics/sales-target (store.metadata)
// ─────────────────────────────────────────────────────────────────────────────
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts"
import { sdk } from "../../lib/client"

// ─────────────────────────────────────────────────────────────────────────────
// API TYPES — GET /admin/analytics/dashboard
// ─────────────────────────────────────────────────────────────────────────────
type DashboardAnalytics = {
  revenue: { total: number; trendPct: number; year: number }
  orders: { trendPct: number }
  ordersByMonth: { month: string; revenue: number; orders: number }[]
  bestSellers: { product_id: string; title: string; thumbnail: string | null; units: number; revenue: number }[]
  salesByCategory: { name: string; units: number }[]
  customers: { new: number; returning: number; guests: number }
  recentOrders: {
    id: string; display_id: number; email: string | null
    status: string; fulfillment_status: string | null
    total: number; created_at: string
  }[]
}

const PIE_COLORS = ["#1A71F6", "#BCF328", "#5A4AFF", "#FF8A1A", "#28B652", "#EC4747", "#9B8AFF", "#1AC5F6"]

// Opciones compartidas de React Query: sin refetch al enfocar la ventana
// (era lo que hacía parpadear/recargar el dashboard) y cache de 1 min.
const QUERY_OPTS = { staleTime: 60_000, refetchOnWindowFocus: false } as const

// ─────────────────────────────────────────────────────────────────────────────
// THEME — sigue el modo claro/oscuro real del admin de Medusa (clase `dark`
// en <html>), en vez de un toggle propio.
// ─────────────────────────────────────────────────────────────────────────────
function useMedusaDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  )
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setDark(el.classList.contains("dark")))
    obs.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function getT(dark: boolean) {
  return {
    surface:      dark ? "#1A1A1B" : "#FFFFFF",
    bg:           dark ? "#101011" : "#F7F7F7",
    tableHeader:  dark ? "#101011" : "#F9F9F9",
    border:       dark ? "#3D3D3D" : "#E7E7E7",
    blue:         "#1A71F6",
    textPrimary:  dark ? "#F6F6F6" : "#2A2A2A",
    textSub:      dark ? "#B0B0B0" : "#888888",
    textMuted:    dark ? "#737373" : "#737373",
    posGreen:     dark ? "#09DE13" : "#04910C",
    red:          "#FF1A1A",
    font:         "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    radiusCard:   "20px",
    radiusSm:     "12px",
  }
}
type Theme = ReturnType<typeof getT>

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}
// Medusa guarda los totales en la unidad mínima de la moneda (céntimos)
function fmtCurrency(cents: number): string {
  const amount = cents / 100
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(0)}`
}
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CR", { day: "2-digit", month: "short" })
  } catch { return "" }
}

// ─────────────────────────────────────────────────────────────────────────────
// ICONS (solo los que usan las cards)
// ─────────────────────────────────────────────────────────────────────────────
const GridIcon = ({ color = "#454545", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4"/>
  </svg>
)
const ArrowUpRightIcon = ({ color = "#F6F6F6", size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 17L17 7M17 7H7M17 7v10" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const TrendUpIcon = ({ color = "#09DE13", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 14l5-5 3 3 6-7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 6h3v3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const TrendDownIcon = ({ color = "#FF1A1A", size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path d="M3 6l5 5 3-3 6 7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14h3v-3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD — métrica resumen. Si recibe `to`, toda la card enlaza a esa página.
// ─────────────────────────────────────────────────────────────────────────────
type StatCardProps = {
  title: string
  value: string
  subtitle: string
  trend?: "up" | "down"
  trendLabel?: string
  isBlue?: boolean
  isLoading?: boolean
  to?: string
  T: Theme
}

const StatCard = ({ title, value, subtitle, trend, trendLabel, isBlue, isLoading, to, T }: StatCardProps) => {
  const bg = isBlue ? T.blue : T.surface
  const txtPri = isBlue ? "#FFFFFF" : T.textPrimary
  const txtSub = isBlue ? "rgba(255,255,255,0.7)" : T.textSub
  const arrowColor = isBlue ? "#FFFFFF" : T.blue

  const inner = (
    <div style={{
      background: bg,
      border: isBlue ? "none" : `1px solid ${T.border}`,
      borderRadius: T.radiusSm,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: "12px",
      flex: "1 1 160px",
      minWidth: "160px",
      height: "100%",
      boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "15px", color: txtPri }}>{title}</span>
        <ArrowUpRightIcon color={arrowColor} size={20} />
      </div>
      <div>
        <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: "28px", lineHeight: "130%",
          color: isBlue ? "#FFFFFF" : T.blue, marginBottom: "4px" }}>
          {isLoading ? "…" : value}
        </div>
        {trend && trendLabel && !isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
            {trend === "up" ? <TrendUpIcon color={isBlue ? "#09DE13" : T.posGreen} /> : <TrendDownIcon color={T.red} />}
            <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: "12px",
              color: trend === "up" ? (isBlue ? "#09DE13" : T.posGreen) : T.red }}>
              {trendLabel}
            </span>
          </div>
        )}
        <span style={{ fontFamily: T.font, fontSize: "11px", color: txtSub }}>{subtitle}</span>
      </div>
    </div>
  )

  if (!to) return inner
  return (
    <Link to={to} style={{ textDecoration: "none", flex: "1 1 160px", minWidth: "160px", display: "flex" }}>
      {inner}
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PIE BLOCK — donut + leyenda con porcentajes
// ─────────────────────────────────────────────────────────────────────────────
type PieBlockProps = { data: { name: string; value: number }[]; loading?: boolean; unit?: string; T: Theme }

const PieBlock = ({ data, loading, unit, T }: PieBlockProps) => {
  const total = data.reduce((a, b) => a + b.value, 0)
  if (loading) return <CenteredNote text="Cargando…" T={T} />
  if (!data.length || total === 0) return <CenteredNote text="Sin datos todavía." T={T} />

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* Tamaño FIJO (no ResponsiveContainer) — evita el bucle del ResizeObserver
          que provocaba el warning width(-1)/height(-1) y re-renders en cadena. */}
      <div style={{ width: "112px", height: "112px", flexShrink: 0 }}>
        <PieChart width={112} height={112}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={34} outerRadius={52} paddingAngle={2} stroke="none" isAnimationActive={false}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <Tooltip
            formatter={(v: any, n: any) => [`${v} ${unit}`.trim(), n]}
            contentStyle={{ background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: "10px", fontFamily: T.font, fontSize: "12px", color: T.textPrimary }}
          />
        </PieChart>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: 0 }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", flexShrink: 0,
              background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span style={{ fontFamily: T.font, fontSize: "12px", color: T.textSub, flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
            <span style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 700, color: T.textPrimary }}>
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CenteredNote = ({ text, T }: { text: string; T: Theme }) => (
  <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: T.font, fontSize: "13px", color: T.textSub }}>{text}</div>
)

// Tarjeta contenedora reutilizable
const Card = ({ children, T, style }: { children: React.ReactNode; T: Theme; style?: React.CSSProperties }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radiusCard,
    padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxSizing: "border-box", ...style,
  }}>{children}</div>
)

const CardTitle = ({ title, hint, T }: { title: string; hint?: string; T: Theme }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "16px", color: T.textPrimary }}>{title}</span>
    {hint && <span style={{ fontFamily: T.font, fontSize: "12px", color: T.textSub }}>{hint}</span>}
  </div>
)

// Badge de estado de orden
function orderStatusStyle(status: string, fulfillment: string | null, T: Theme) {
  const f = fulfillment ?? ""
  if (status === "canceled" || status === "cancelled") return { bg: `${T.red}22`, color: T.red, label: "Cancelada" }
  if (f === "fulfilled" || f === "delivered" || f === "shipped") return { bg: "#B2FFB4", color: "#04910C", label: "Cumplida" }
  return { bg: `${T.blue}22`, color: T.blue, label: "Pendiente" }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const DashboardOverview = () => {
  const T = getT(useMedusaDark())
  const queryClient = useQueryClient()

  // ── Conteos (SDK) ──────────────────────────────────────────────────────────
  const { data: productStats, isLoading: loadingProducts } = useQuery({
    queryKey: ["dashboard-products-count"],
    queryFn: () => sdk.admin.product.list({ limit: 1 }),
    ...QUERY_OPTS,
  })
  const { data: customerStats, isLoading: loadingCustomers } = useQuery({
    queryKey: ["dashboard-customers-count"],
    queryFn: () => sdk.admin.customer.list({ limit: 1 }),
    ...QUERY_OPTS,
  })
  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard-orders-count"],
    queryFn: () => sdk.admin.order.list({ limit: 1 }),
    ...QUERY_OPTS,
  })

  // ── Analítica agregada ─────────────────────────────────────────────────────
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<DashboardAnalytics>({
    queryKey: ["dashboard-analytics"],
    queryFn: () => sdk.client.fetch<DashboardAnalytics>("/admin/analytics/dashboard"),
    ...QUERY_OPTS,
  })

  // ── Meta de ventas ─────────────────────────────────────────────────────────
  const { data: salesTarget } = useQuery<{ target: number | null; year: number }>({
    queryKey: ["dashboard-sales-target"],
    queryFn: () => sdk.client.fetch<{ target: number | null; year: number }>("/admin/analytics/sales-target"),
    ...QUERY_OPTS,
  })
  const saveTarget = useMutation({
    mutationFn: (target: number) =>
      sdk.client.fetch("/admin/analytics/sales-target", { method: "POST", body: { target } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-sales-target"] }),
  })
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState("")

  // ── Derivados ──────────────────────────────────────────────────────────────
  const totalRevenueCents = analytics?.revenue.total ?? 0
  const revenueTrend = analytics?.revenue.trendPct ?? 0
  const ordersTrend = analytics?.orders.trendPct ?? 0
  const targetValue = salesTarget?.target ?? null
  const progressPct = targetValue && targetValue > 0 ? Math.min(100, (totalRevenueCents / targetValue) * 100) : 0
  const bestSellers = analytics?.bestSellers ?? []
  const recentOrders = analytics?.recentOrders ?? []

  const categoryData = useMemo(
    () => (analytics?.salesByCategory ?? []).map((c) => ({ name: c.name, value: c.units })),
    [analytics]
  )
  const customerData = useMemo(() => {
    const c = analytics?.customers
    if (!c) return []
    return [
      { name: "Nuevos", value: c.new },
      { name: "Recurrentes", value: c.returning },
    ].filter((d) => d.value > 0)
  }, [analytics])

  const year = analytics?.revenue.year ?? new Date().getFullYear()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: T.font }}>

      {/* Fila 1: Meta + Gráfica (izq) | Stat cards + Pedidos recientes (der) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>

        {/* Columna izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: "1 1 420px", minWidth: "320px" }}>

          {/* Meta de ventas */}
          <Card T={T} style={{ minHeight: "150px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "16px", color: T.textPrimary }}>
                Meta de ventas {year}
              </span>
              <span
                onClick={() => { setTargetInput(targetValue ? String(targetValue / 100) : ""); setEditingTarget(v => !v) }}
                style={{ background: `${T.blue}22`, color: T.blue, fontFamily: T.font, fontSize: "11px",
                  fontWeight: 600, padding: "4px 10px", borderRadius: "8px", cursor: "pointer", whiteSpace: "nowrap" }}>
                {editingTarget ? "Cancelar" : "⚙ Configurar"}
              </span>
            </div>

            {editingTarget ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number" value={targetInput} onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="Meta anual (ej. 50000)"
                  style={{ flex: 1, padding: "10px 12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`,
                    background: T.bg, color: T.textPrimary, fontFamily: T.font, fontSize: "14px" }}
                />
                <button
                  disabled={saveTarget.isPending}
                  onClick={() => {
                    const v = Number(targetInput)
                    if (Number.isFinite(v) && v >= 0) { saveTarget.mutate(Math.round(v * 100)); setEditingTarget(false) }
                  }}
                  style={{ background: T.blue, color: "#FFF", border: "none", borderRadius: T.radiusSm,
                    padding: "10px 16px", fontFamily: T.font, fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  {saveTarget.isPending ? "…" : "Guardar"}
                </button>
              </div>
            ) : targetValue ? (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "28px", color: T.blue }}>
                    {fmtCurrency(totalRevenueCents)}
                  </span>
                  <span style={{ fontFamily: T.font, fontSize: "13px", color: T.textSub }}>
                    de {fmtCurrency(targetValue)}
                  </span>
                </div>
                <div style={{ background: T.border, borderRadius: "80px", height: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${progressPct}%`, height: "100%",
                    background: progressPct >= 100 ? T.posGreen : T.blue, borderRadius: "80px", transition: "width 0.4s" }} />
                </div>
                <span style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 700, color: T.posGreen }}>
                  {progressPct.toFixed(1)}% alcanzado
                </span>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, justifyContent: "center" }}>
                <span style={{ fontFamily: T.font, fontSize: "13px", color: T.textSub }}>
                  Aún no has definido una meta de ventas anual.
                </span>
                <span style={{ fontFamily: T.font, fontSize: "13px", color: T.blue, fontWeight: 600, cursor: "pointer" }}
                  onClick={() => { setTargetInput(""); setEditingTarget(true) }}>
                  Configurar meta →
                </span>
              </div>
            )}
          </Card>

          {/* Gráfica de ingresos mensual */}
          <Card T={T} style={{ flex: 1, minHeight: "320px" }}>
            <CardTitle title="Tus ventas este año" hint="Ingresos por mes" T={T} />
            <div style={{ width: "100%" }}>
              {loadingAnalytics ? (
                <CenteredNote text="Cargando…" T={T} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analytics?.ordersByMonth ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="month" stroke={T.textSub} tick={{ fontSize: 11, fontFamily: T.font }} tickLine={false} />
                    <YAxis stroke={T.textSub} tick={{ fontSize: 11, fontFamily: T.font }} tickLine={false}
                      tickFormatter={(v) => fmtCurrency(Number(v))} width={48} />
                    <Tooltip
                      formatter={(v: any) => [fmtCurrency(Number(v)), "Ingresos"]}
                      contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px",
                        fontFamily: T.font, fontSize: "12px", color: T.textPrimary }}
                      labelStyle={{ color: T.textPrimary }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke={T.blue} strokeWidth={2.5}
                      dot={{ r: 3, fill: T.blue }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", flex: "1 1 360px", minWidth: "320px" }}>

          {/* Stat cards (enlazan a páginas reales) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <StatCard title="Ingresos" value={fmtCurrency(totalRevenueCents)} subtitle={`Año ${year}`}
              trend={revenueTrend >= 0 ? "up" : "down"} trendLabel={`${Math.abs(revenueTrend).toFixed(1)}%`}
              isBlue isLoading={loadingAnalytics} to="/orders" T={T} />
            <StatCard title="Clientes" value={fmt(customerStats?.count ?? 0)} subtitle="Histórico"
              isLoading={loadingCustomers} to="/customers" T={T} />
            <StatCard title="Transacciones" value={fmt(orderStats?.count ?? 0)} subtitle="Todas las órdenes"
              trend={ordersTrend >= 0 ? "up" : "down"} trendLabel={`${Math.abs(ordersTrend).toFixed(1)}%`}
              isLoading={loadingOrders || loadingAnalytics} to="/orders" T={T} />
            <StatCard title="Productos" value={fmt(productStats?.count ?? 0)} subtitle="Catálogo"
              isLoading={loadingProducts} to="/products" T={T} />
          </div>

          {/* Pedidos recientes — antes era el banner promocional (slop) */}
          <Card T={T} style={{ flex: 1 }}>
            <CardTitle title="Pedidos recientes" hint="Últimos 5" T={T} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {loadingAnalytics ? (
                <CenteredNote text="Cargando…" T={T} />
              ) : recentOrders.length ? (
                recentOrders.map((o, idx) => {
                  const st = orderStatusStyle(o.status, o.fulfillment_status, T)
                  return (
                    <Link key={o.id} to={`/orders/${o.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 4px",
                        borderTop: idx === 0 ? "none" : `1px solid ${T.border}` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.font, fontWeight: 700, fontSize: "13px", color: T.textPrimary }}>
                            #{o.display_id}
                          </div>
                          <div style={{ fontFamily: T.font, fontSize: "11px", color: T.textSub,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {o.email ?? "Invitado"} · {fmtDate(o.created_at)}
                          </div>
                        </div>
                        <span style={{ background: st.bg, color: st.color, fontFamily: T.font, fontSize: "10px",
                          fontWeight: 600, padding: "3px 8px", borderRadius: "8px", whiteSpace: "nowrap" }}>
                          {st.label}
                        </span>
                        <span style={{ fontFamily: T.font, fontWeight: 700, fontSize: "13px", color: T.blue, whiteSpace: "nowrap" }}>
                          {fmtCurrency(o.total)}
                        </span>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <CenteredNote text="Aún no hay pedidos." T={T} />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Fila 2: Distribución (pies) | Más vendidos */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "stretch" }}>

        {/* Pies */}
        <Card T={T} style={{ flex: "1 1 340px", minWidth: "300px", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "15px", color: T.textPrimary }}>
              Ventas por categoría
            </span>
            <PieBlock data={categoryData} loading={loadingAnalytics} unit="uds" T={T} />
          </div>
          <div style={{ height: "1px", background: T.border }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: T.font, fontWeight: 600, fontSize: "15px", color: T.textPrimary }}>Clientes</span>
            <PieBlock data={customerData} loading={loadingAnalytics} unit="" T={T} />
          </div>
        </Card>

        {/* Más vendidos */}
        <Card T={T} style={{ flex: "1 1 420px", minWidth: "320px" }}>
          <CardTitle title="Más vendidos" hint="Últimos 30 días · por unidades" T={T} />
          <div style={{ border: `1px solid ${T.border}`, borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ display: "flex", background: T.tableHeader, borderBottom: `1px solid ${T.border}` }}>
              {[{ label: "Producto", flex: "0 0 220px" }, { label: "Unidades", flex: "1" }, { label: "Ingresos", flex: "0 0 100px" }].map(col => (
                <div key={col.label} style={{ flex: col.flex, padding: "12px", fontFamily: T.font,
                  fontWeight: 700, fontSize: "12px", color: T.textSub }}>{col.label}</div>
              ))}
            </div>
            {loadingAnalytics ? (
              [0,1,2,3].map(i => (
                <div key={i} style={{ padding: "16px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ width: "41px", height: "41px", background: T.border, borderRadius: "6px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "10px", background: T.border, borderRadius: "4px", width: "60%", marginBottom: "6px" }} />
                    <div style={{ height: "14px", background: T.border, borderRadius: "4px", width: "80%" }} />
                  </div>
                </div>
              ))
            ) : bestSellers.length ? (
              bestSellers.map((p, idx) => (
                <div key={p.product_id || p.title}>
                  <div style={{ display: "flex", alignItems: "center", padding: "12px", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "0 0 220px" }}>
                      <div style={{ width: "41px", height: "41px", background: T.border, borderRadius: "6px",
                        overflow: "hidden", flexShrink: 0 }}>
                        {p.thumbnail && <img src={p.thumbnail} alt={p.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: T.font, fontSize: "11px", color: T.blue }}>#{idx + 1}</div>
                        <div style={{ fontFamily: T.font, fontWeight: 600, fontSize: "13px", color: T.textPrimary,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }}>{p.title}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, fontFamily: T.font, fontWeight: 700, fontSize: "14px", color: T.textPrimary }}>{p.units}</div>
                    <div style={{ flex: "0 0 100px", fontFamily: T.font, fontWeight: 700, fontSize: "13px", color: T.blue }}>{fmtCurrency(p.revenue)}</div>
                  </div>
                  {idx < bestSellers.length - 1 && <div style={{ height: "1px", background: T.border, margin: "0 12px" }} />}
                </div>
              ))
            ) : (
              <CenteredNote text="Aún no hay ventas en los últimos 30 días." T={T} />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Dashboard",
  icon: GridIcon,
})

export default DashboardOverview
