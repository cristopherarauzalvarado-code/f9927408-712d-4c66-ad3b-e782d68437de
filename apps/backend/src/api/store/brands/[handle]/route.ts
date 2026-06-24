// src/api/store/brands/[handle]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Store API — single Brand (by handle) with its product ids.
// GET /store/brands/:handle → { brand: { id, name, handle }, product_ids: [] }
// The storefront uses product_ids to fetch fully-priced products for the
// current region via the standard /store/products endpoint.
// ─────────────────────────────────────────────────────────────────────────────
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { handle } = req.params
  const query = req.scope.resolve("query")

  const { data: brands } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle", "product.id"],
    filters: { handle },
  })

  const brand = brands[0]
  if (!brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with handle "${handle}" not found`
    )
  }

  res.json({
    brand: { id: brand.id, name: brand.name, handle: (brand as any).handle },
    product_ids: ((brand as any).product ?? []).map((p: any) => p.id),
  })
}
