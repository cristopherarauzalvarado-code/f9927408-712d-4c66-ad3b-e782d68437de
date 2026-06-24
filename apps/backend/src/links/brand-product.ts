// src/links/brand-product.ts
// ─────────────────────────────────────────────────────────────────────────────
// Module Link: Brand ↔ Product
// One product has at most one brand (isList: false on the brand side).
// This link enables `fields: "+brand.*"` when retrieving products via Query.
// After adding this file run: npx medusa db:generate brand && npx medusa db:migrate
// ─────────────────────────────────────────────────────────────────────────────
import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import BrandModule from "../modules/brand"

export default defineLink(
  ProductModule.linkable.product,
  {
    // isList: false → one product maps to one brand, not an array
    linkable: BrandModule.linkable.brand,
    isList: false,
  }
)
