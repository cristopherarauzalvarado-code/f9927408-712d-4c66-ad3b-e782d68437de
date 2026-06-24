// src/admin/routes/brands/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Brands Admin Page — /app/brands
// Lists all brands with pagination.
// Data source: GET /admin/brands (src/api/admin/brands/route.ts)
// Uses Medusa UI DataTable + TanStack Query for data fetching.
// ─────────────────────────────────────────────────────────────────────────────
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { useMemo, useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape of a single brand record from GET /admin/brands
type Brand = {
  id: string
  name: string
}

// Shape of the full API response
type BrandsResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

// ─── Table column definitions ─────────────────────────────────────────────────

// createDataTableColumnHelper generates type-safe column accessors for Brand
const columnHelper = createDataTableColumnHelper<Brand>()

const columns = [
  // ID column — useful for referencing in product-brand links
  columnHelper.accessor("id", {
    header: "ID",
  }),
  // Brand name — primary display field
  columnHelper.accessor("name", {
    header: "Name",
  }),
]

// ─── Page component ───────────────────────────────────────────────────────────

const BrandsPage = () => {
  // ── Pagination state ──────────────────────────────────────────────────────
  const limit = 15
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  })

  // Compute offset from current page index (used in API query)
  const offset = useMemo(
    () => pagination.pageIndex * limit,
    [pagination.pageIndex]
  )

  // ── Data fetching ──────────────────────────────────────────────────────────
  // Fetches from GET /admin/brands — refetches whenever offset changes
  const { data, isLoading } = useQuery<BrandsResponse>({
    queryFn: () =>
      sdk.client.fetch<BrandsResponse>(`/admin/brands`, {
        // Pass pagination params; middleware's validateAndTransformQuery handles them
        query: { limit, offset },
      }),
    queryKey: [["brands", limit, offset]],
  })

  // ── Table configuration ────────────────────────────────────────────────────
  // useDataTable wires columns, data, and pagination into a DataTable instance
  const table = useDataTable({
    columns,
    data: data?.brands ?? [],
    getRowId: (row) => row.id,       // unique key per row
    rowCount: data?.count ?? 0,      // total count drives page count
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    // Container matches Medusa admin card style
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        {/* Toolbar with page heading */}
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Brands</Heading>
        </DataTable.Toolbar>

        {/* Table grid — columns defined above */}
        <DataTable.Table />

        {/* Pagination controls */}
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

// Register in sidebar under Extensions with a tag icon
export const config = defineRouteConfig({
  label: "Brands",
  icon: TagSolid,
})

export default BrandsPage
