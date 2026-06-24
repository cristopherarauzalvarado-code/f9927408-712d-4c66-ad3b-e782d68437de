import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

function RelatedProductCard({ product }: { product: HttpTypes.StoreProduct }) {
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

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const queryParams: HttpTypes.StoreProductListParams = { is_giftcard: false }
  if (region?.id) queryParams.region_id = region.id
  if (product.collection_id) queryParams.collection_id = [product.collection_id]
  if (product.tags) {
    queryParams.tag_id = product.tags.map((t) => t.id).filter(Boolean) as string[]
  }

  const products = await listProducts({ queryParams, countryCode }).then(
    ({ response }) => response.products.filter((p) => p.id !== product.id).slice(0, 4)
  )

  if (!products.length) return null

  return (
    <section>
      <h2 className="font-heading font-black text-[32px] small:text-[48px] uppercase text-black text-center mb-8 small:mb-10">
        También te puede gustar
      </h2>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-4 small:gap-5">
        {products.map((p) => (
          <li key={p.id}>
            <RelatedProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}
