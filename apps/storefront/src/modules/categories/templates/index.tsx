import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getStoreFilters } from "@lib/data/store-filters"
import { ProductFilters } from "@lib/util/product-filter"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import FilterSidebar from "@modules/store/components/filter-sidebar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const parseList = (value?: string): string[] =>
  value ? value.split(",").filter(Boolean) : []

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  colors,
  sizes,
  minPrice,
  maxPrice,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  colors?: string
  sizes?: string
  minPrice?: string
  maxPrice?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const availableFilters = await getStoreFilters(countryCode, {
    categoryId: category.id,
  })

  // Filtros del sidebar (color/talla/precio) que se combinan con la categoría.
  const filters: ProductFilters = {
    colors: parseList(colors),
    sizes: parseList(sizes),
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  }
  const filterKey = JSON.stringify({ filters, sort, pageNumber })

  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (cat: HttpTypes.StoreProductCategory) => {
    if (cat.parent_category) {
      parents.push(cat.parent_category)
      getParents(cat.parent_category)
    }
  }
  getParents(category)
  parents.reverse()

  return (
    <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] py-6" data-testid="category-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-black/60 mb-6 flex-wrap">
        <LocalizedClientLink href="/" className="hover:text-black transition-colors">Home</LocalizedClientLink>
        <ChevronRight />
        {parents.map((parent) => (
          <>
            <LocalizedClientLink
              key={parent.id}
              href={`/categories/${parent.handle}`}
              className="hover:text-black transition-colors"
            >
              {parent.name}
            </LocalizedClientLink>
            <ChevronRight key={`chevron-${parent.id}`} />
          </>
        ))}
        <span className="text-black font-medium" data-testid="category-page-title">
          {category.name}
        </span>
      </div>

      <div className="flex flex-col small:flex-row gap-6 small:gap-8 small:items-start">
        {/* Sidebar */}
        <div className="w-full small:w-[295px] shrink-0">
          <FilterSidebar
            availableFilters={availableFilters}
            showCategories={false}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="font-heading font-black text-[32px] small:text-[40px] uppercase text-black">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-sm text-black/60">{category.description}</p>
          )}
          <Suspense
            key={filterKey}
            fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}
          >
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category.id}
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
