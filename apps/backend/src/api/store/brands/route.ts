// src/api/store/brands/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Store API — Brands (public; requires the publishable API key, added by the SDK)
// GET /store/brands → list all brands with a product count.
// Powers the storefront /[countryCode]/brands page.
// ─────────────────────────────────────────────────────────────────────────────
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve("query")

  // `product` is the field name for the brand → products link (verified).
  const { data: brands } = await query.graph({
    entity: "brand",
    fields: ["id", "name", "handle", "product.id"],
  })

  const result = brands
    .map((b: any) => ({
      id: b.id,
      name: b.name,
      // Fall back to the id when a brand has no handle yet (pre-seed).
      handle: b.handle ?? b.id,
      product_count: (b.product ?? []).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  res.json({ brands: result, count: result.length })
}
