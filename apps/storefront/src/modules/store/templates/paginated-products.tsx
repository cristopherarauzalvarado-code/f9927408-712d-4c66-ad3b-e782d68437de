import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { ProductFilters } from "@lib/util/product-filter"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import ShopCoPagination from "@modules/store/components/pagination"
import SortDropdown from "@modules/store/components/sort-dropdown"

const PRODUCT_LIMIT = 9

function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      <div className="bg-[#F0EEED] rounded-[13px] small:rounded-[20px] overflow-hidden mb-3 aspect-square relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured
        />
      </div>
      <h3 className="font-bold text-sm small:text-base text-black uppercase mb-1 line-clamp-1 group-hover:underline">
        {product.title}
      </h3>
      <div className="flex items-center gap-2 mb-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#FFC633">
              <path d="M10 1l2.39 4.843L18 6.79l-4 3.898.944 5.505L10 13.75l-4.944 2.443L6 10.688 2 6.79l5.61-.947L10 1z" />
            </svg>
          ))}
        </div>
        <span className="text-xs text-black">4.5/5</span>
      </div>
      {cheapestPrice && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base small:text-lg text-black">
            {cheapestPrice.calculated_price}
          </span>
          {cheapestPrice.original_price !== cheapestPrice.calculated_price && (
            <>
              <span className="text-sm text-black/40 line-through">
                {cheapestPrice.original_price}
              </span>
              <span className="bg-red-100 text-[#FF3333] text-[10px] font-medium px-2 py-0.5 rounded-full">
                -{cheapestPrice.percentage_diff}%
              </span>
            </>
          )}
        </div>
      )}
    </LocalizedClientLink>
  )
}

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  filters?: ProductFilters
}) {
  const queryParams: PaginatedProductsParams = { limit: PRODUCT_LIMIT }

  if (collectionId) queryParams["collection_id"] = [collectionId]
  if (categoryId) queryParams["category_id"] = [categoryId]
  if (productsIds) queryParams["id"] = productsIds
  if (sortBy === "created_at") queryParams["order"] = "created_at"

  const region = await getRegion(countryCode)
  if (!region) return null

  const { products, count } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    filters,
  })
    .then(({ response }) => response)
    .catch(() => ({ products: [] as HttpTypes.StoreProduct[], count: 0 }))

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const startItem = count > 0 ? (page - 1) * PRODUCT_LIMIT + 1 : 0
  const endItem = Math.min(page * PRODUCT_LIMIT, count)

  return (
    <div className="flex flex-col gap-6">
      {/* Count + sort bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-black/60">
          Mostrando {count > 0 ? `${startItem}-${endItem}` : "0"} de {count} productos
        </span>
        <div className="flex items-center gap-1 text-sm text-black/60">
          <span>Ordenar por:</span>
          <SortDropdown sortBy={sortBy} />
        </div>
      </div>

      {/* Product grid — 2 cols mobile, 3 cols desktop */}
      {count > 0 ? (
        <ul
          className="grid grid-cols-2 small:grid-cols-3 gap-4 small:gap-5"
          data-testid="products-list"
        >
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-2">
          <p className="font-bold text-lg text-black">No hay productos</p>
          <p className="text-sm text-black/60">
            Ningún producto coincide con los filtros seleccionados.
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <ShopCoPagination page={page} totalPages={totalPages} />
      )}
    </div>
  )
}
