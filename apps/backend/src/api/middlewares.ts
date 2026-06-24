// src/api/middlewares.ts
// ─────────────────────────────────────────────────────────────────────────────
// Global middleware registration for all custom API routes.
// ─────────────────────────────────────────────────────────────────────────────
import {
  defineMiddlewares,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

// Zod schema for GET /admin/brands query params
export const GetBrandsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    // ─── Admin: brands list with pagination ───────────────────────────────
    // Applies to GET /admin/brands — injects req.queryConfig with defaults
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetBrandsSchema, {
          defaults: ["id", "name"],  // fields returned by default
          isList: true,              // enables pagination metadata
        }),
      ],
    },
  ],
})
