import { Suspense } from "react"

import { getStoreFilters } from "@lib/data/store-filters"
import { ProductFilters } from "@lib/util/product-filter"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import FilterSidebar from "@modules/store/components/filter-sidebar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import PaginatedProducts from "./paginated-products"

const parseList = (value?: string): string[] =>
  value ? value.split(",").filter(Boolean) : []

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  categories,
  colors,
  sizes,
  minPrice,
  maxPrice,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categories?: string
  colors?: string
  sizes?: string
  minPrice?: string
  maxPrice?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const filters: ProductFilters = {
    categories: parseList(categories),
    colors: parseList(colors),
    sizes: parseList(sizes),
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }

  const availableFilters = await getStoreFilters(countryCode)

  // Clave que cambia con los filtros: fuerza el skeleton al re-filtrar.
  const filterKey = JSON.stringify({ filters, sort, pageNumber })

  return (
    <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] py-6" data-testid="category-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-black/60 mb-6 flex-wrap">
        <LocalizedClientLink href="/" className="hover:text-black transition-colors">Inicio</LocalizedClientLink>
        <ChevronRight />
        <span className="text-black font-medium">Tienda</span>
      </div>

      <div className="flex flex-col small:flex-row gap-6 small:gap-8 small:items-start">
        {/* Sidebar */}
        <div className="w-full small:w-[295px] shrink-0">
          <FilterSidebar availableFilters={availableFilters} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="font-heading font-black text-[32px] small:text-[40px] uppercase text-black" data-testid="store-page-title">
            Todos los productos
          </h1>
          <Suspense key={filterKey} fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              countryCode={countryCode}
              filters={filters}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="-rotate-90 opacity-60">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default StoreTemplate
