import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  toast,
  FocusModal,
  Text,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
} from "@medusajs/ui"
import type {
  DataTableRowSelectionState,
  DataTablePaginationState,
} from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useMemo, useState } from "react"
import { DetailWidgetProps } from "@medusajs/framework/types"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/client"

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
)

const Spinner = () => (
  <svg className="animate-spin h-4 w-4 text-ui-fg-subtle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminProduct>()

const useColumns = () =>
  useMemo(
    () => [
      columnHelper.select(),
      columnHelper.accessor("title", { header: "Title" }),
      columnHelper.accessor("status", { header: "Status" }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
      }),
    ],
    []
  )

const ProductRelatedProductsWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const initialIds = useMemo<string[]>(() => {
    if (product?.metadata?.related_product_ids) {
      try {
        const ids = JSON.parse(product.metadata.related_product_ids as string)
        return Array.isArray(ids) ? ids : []
      } catch {
        return []
      }
    }
    return []
  }, [product?.metadata?.related_product_ids])

  const initialSelection = useMemo(
    () =>
      initialIds.reduce<DataTableRowSelectionState>((acc, id) => {
        acc[id] = true
        return acc
      }, {}),
    [initialIds]
  )

  const [rowSelection, setRowSelection] =
    useState<DataTableRowSelectionState>(initialSelection)
  const [searchValue, setSearchValue] = useState("")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data: displayProducts, isLoading: displayLoading } = useQuery({
    queryFn: async () => {
      if (initialIds.length === 0) return { products: [] }
      return sdk.admin.product.list({ id: initialIds, limit: initialIds.length })
    },
    queryKey: ["related-products-display", initialIds],
    enabled: initialIds.length > 0,
  })

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const { data: modalProducts, isLoading: modalLoading } = useQuery({
    queryFn: () =>
      sdk.admin.product.list({
        limit,
        offset,
        q: searchValue || undefined,
      }),
    queryKey: ["products-selection", limit, offset, searchValue],
    enabled: open,
  })

  const updateProduct = useMutation({
    mutationFn: (relatedProductIds: string[]) =>
      sdk.admin.product.update(product.id, {
        metadata: {
          ...product.metadata,
          related_product_ids: JSON.stringify(relatedProductIds),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", product.id] })
      queryClient.invalidateQueries({ queryKey: ["related-products-display"] })
      toast.success("Success", {
        description: "Related products updated",
        dismissLabel: "Close",
      })
      setOpen(false)
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to update related products",
        dismissLabel: "Close",
      })
    },
  })

  const selectedProductIds = useMemo(
    () => Object.keys(rowSelection),
    [rowSelection]
  )

  const availableProducts = useMemo(() => {
    if (!modalProducts?.products) return []
    return modalProducts.products.filter((p) => p.id !== product.id)
  }, [modalProducts?.products, product.id])

  const columns = useColumns()

  const table = useDataTable({
    data: availableProducts,
    columns,
    getRowId: (row) => row.id,
    rowCount: modalProducts?.count || 0,
    isLoading: modalLoading,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: setRowSelection,
    },
    search: {
      state: searchValue,
      onSearchChange: setSearchValue,
    },
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  const selectedProducts = displayProducts?.products || []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Related Products</Heading>
        <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
          <PencilIcon />
        </Button>
      </div>

      <div className="px-6 py-4">
        {displayLoading ? (
          <Spinner />
        ) : selectedProducts.length === 0 ? (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No related products selected
          </Text>
        ) : (
          <div className="flex flex-col gap-y-2">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <Text size="small" leading="compact" weight="plus">
                  {p.title}
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle capitalize"
                >
                  {p.status}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <Heading>Select Related Products</Heading>
            </FocusModal.Header>
            <FocusModal.Body className="flex items-start justify-center overflow-y-auto">
              <div className="w-full max-w-3xl py-8">
                <DataTable instance={table}>
                  <DataTable.Toolbar>
                    <DataTable.Search placeholder="Search products..." />
                  </DataTable.Toolbar>
                  <DataTable.Table />
                  <DataTable.Pagination />
                </DataTable>
              </div>
            </FocusModal.Body>
            <FocusModal.Footer>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button size="small" variant="secondary">
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => updateProduct.mutate(selectedProductIds)}
                  isLoading={updateProduct.isPending}
                >
                  Save ({selectedProductIds.length} selected)
                </Button>
              </div>
            </FocusModal.Footer>
          </div>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductRelatedProductsWidget
