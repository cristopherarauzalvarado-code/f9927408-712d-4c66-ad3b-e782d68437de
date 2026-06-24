import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block">
      {/* Card image */}
      <div className="bg-[#F0EEED] rounded-[13px] small:rounded-[20px] overflow-hidden mb-3 aspect-square relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured
        />
      </div>

      {/* Info */}
      <h3 className="font-bold text-sm small:text-base text-black uppercase mb-1 line-clamp-1 group-hover:underline">
        {product.title}
      </h3>

      {/* Stars */}
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

      {/* Price */}
      {cheapestPrice && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-base small:text-xl text-black">
            {cheapestPrice.calculated_price}
          </span>
          {cheapestPrice.original_price !== cheapestPrice.calculated_price && (
            <>
              <span className="text-sm small:text-lg text-black/40 line-through">
                {cheapestPrice.original_price}
              </span>
              <span className="bg-red-100 text-[#FF3333] text-[10px] small:text-xs font-medium px-2 py-0.5 rounded-full">
                -{cheapestPrice.percentage_diff}%
              </span>
            </>
          )}
        </div>
      )}
    </LocalizedClientLink>
  )
}

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const pricedProducts = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
      limit: 4,
    },
  })
    .then(({ response }) => response.products)
    .catch(() => [] as HttpTypes.StoreProduct[])

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 small:px-6 py-10 small:py-16">
      {/* Section heading */}
      <h2 className="font-heading font-black text-[32px] small:text-[48px] uppercase text-black text-center mb-8 small:mb-10">
        {collection.title}
      </h2>

      {/* Product grid — 2 cols mobile, 4 cols desktop */}
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-5">
        {pricedProducts.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>

      {/* View All button */}
      <div className="flex justify-center mt-8 small:mt-10">
        <LocalizedClientLink
          href={`/collections/${collection.handle}`}
          className="border border-black/10 rounded-full px-10 small:px-14 py-3 small:py-4 text-sm small:text-base font-medium hover:bg-black hover:text-white transition-colors"
        >Ver todo</LocalizedClientLink>
      </div>
    </section>
  )
}
