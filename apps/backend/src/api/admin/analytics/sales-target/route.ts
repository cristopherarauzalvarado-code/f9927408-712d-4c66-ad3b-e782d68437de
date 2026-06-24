// src/api/admin/analytics/sales-target/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API — Sales Target (meta de ventas anual)
// GET  /admin/analytics/sales-target  → { target, year }
// POST /admin/analytics/sales-target  → guarda { target } para el año en curso
//
// Decisión de grilling #8: la meta vive en `store.metadata` (sin módulo ni
// migración). Clave: `sales_target_<año>`.
// ─────────────────────────────────────────────────────────────────────────────
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const keyFor = (year: number) => `sales_target_${year}`

// Resuelve el primer store y su metadata
async function getStore(req: MedusaRequest) {
  const storeService: any = req.scope.resolve(Modules.STORE)
  const [store] = await storeService.listStores({}, { take: 1 })
  return { storeService, store }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const year = new Date().getFullYear()
  const { store } = await getStore(req)
  const raw = store?.metadata?.[keyFor(year)]
  const target = typeof raw === "number" ? raw : raw ? Number(raw) : null

  res.json({ target: Number.isFinite(target as number) ? target : null, year })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const year = new Date().getFullYear()
  const body = (req.body ?? {}) as { target?: number | string }
  const target = Number(body.target)

  if (!Number.isFinite(target) || target < 0) {
    return res.status(400).json({ message: "`target` debe ser un número >= 0" })
  }

  const { storeService, store } = await getStore(req)
  if (!store) {
    return res.status(404).json({ message: "No se encontró el store" })
  }

  await storeService.updateStores(store.id, {
    metadata: { ...(store.metadata ?? {}), [keyFor(year)]: target },
  })

  res.json({ target, year })
}
