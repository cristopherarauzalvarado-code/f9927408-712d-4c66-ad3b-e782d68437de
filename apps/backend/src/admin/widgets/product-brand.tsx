// src/admin/widgets/product-brand.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Product Brand Widget
// Injected into zone "product.details.before" — top of the product details page.
// Fetches the brand linked to this product via the brand-product module link.
// Requires: brand-product link (src/links/brand-product.ts) + db migration.
// ─────────────────────────────────────────────────────────────────────────────
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { clx, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/client"

// Extend AdminProduct to include the brand relation returned by "+brand.*"
type AdminProductWithBrand = AdminProduct & {
  brand?: {
    id: string
    name: string
  }
}

// Widget component — receives the current product's data as props
const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  // Re-fetch the product with brand relation expanded
  // "+brand.*" works because src/links/brand-product.ts defines the link
  const { data: queryResult, isLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+brand.*",
      }),
    queryKey: [["product", product.id, "brand"]],
  })

  // Extract brand from the enriched product response
  const brand = (queryResult?.product as AdminProductWithBrand)?.brand

  return (
    // Container + Heading from @medusajs/ui — matches the admin design system
    <Container className="divide-y p-0">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand</Heading>
      </div>

      {/* Brand name row */}
      <div
        className={clx(
          "text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4"
        )}
      >
        <Text size="small" weight="plus" leading="compact">
          Name
        </Text>
        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
        >
          {/* Show loading state, then brand name, or dash if none linked */}
          {isLoading ? "…" : (brand?.name ?? "—")}
        </Text>
      </div>
    </Container>
  )
}

// Inject at the top of product details page (before the main product form)
export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductBrandWidget
