// src/api/admin/brands/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Admin API — Brands
// GET  /admin/brands  → paginated list of brands (powers the Brands admin page)
// POST /admin/brands  → create a brand
// Pagination config is injected via validateAndTransformQuery middleware in middlewares.ts
// ─────────────────────────────────────────────────────────────────────────────
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"
import BrandModuleService from "../../../modules/brand/service"

// GET /admin/brands — list brands with pagination
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Resolve brand service from the Medusa container
  const brandService: BrandModuleService = req.scope.resolve(BRAND_MODULE)

  // Use Query for pagination support (injected by validateAndTransformQuery middleware)
  const query = req.scope.resolve("query")

  const {
    data: brands,
    metadata: { count, take, skip } = {},
  } = await query.graph({
    entity: "brand",
    ...req.queryConfig, // pagination + fields from middleware
  })

  res.json({
    brands,
    count,
    limit: take,
    offset: skip,
  })
}

// POST /admin/brands — create a new brand
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const brandService: BrandModuleService = req.scope.resolve(BRAND_MODULE)

  // req.body is validated by the admin auth middleware
  const brand = await brandService.createBrands(req.body as { name: string })

  res.status(201).json({ brand })
}
