import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import RelatedProducts from "@modules/products/components/related-products"
import ProductReviews from "@modules/products/components/product-reviews"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  reviewsPage?: number
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  reviewsPage = 1,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] pt-6 pb-4">
        <div className="flex items-center gap-2 text-sm text-black/60 flex-wrap">
          <LocalizedClientLink href="/" className="hover:text-black transition-colors">
            Inicio
          </LocalizedClientLink>
          <ChevronRight />
          <LocalizedClientLink href="/store" className="hover:text-black transition-colors">
            Tienda
          </LocalizedClientLink>
          {product.collection && (
            <>
              <ChevronRight />
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="hover:text-black transition-colors"
              >
                {product.collection.title}
              </LocalizedClientLink>
            </>
          )}
          <ChevronRight />
          <span className="text-black font-medium">{product.title}</span>
        </div>
      </div>

      {/* Product section */}
      <div
        className="max-w-[1440px] mx-auto px-4 small:px-[100px] flex flex-col small:flex-row gap-8 small:gap-10 pb-10"
        data-testid="product-container"
      >
        {/* Image gallery */}
        <div className="w-full small:w-[610px] shrink-0">
          <ImageGallery images={images} />
        </div>

        {/* Product info */}
        <div className="flex-1 flex flex-col gap-5">
          <h1 className="font-heading font-black text-[24px] small:text-[40px] text-black leading-tight uppercase">
            {product.title}
          </h1>

          {/* Stars */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-[3px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill={i < 4 ? "#FFC633" : "none"} stroke="#FFC633" strokeWidth="1">
                  <path d="M10 1l2.39 4.843L18 6.79l-4 3.898.944 5.505L10 13.75l-4.944 2.443L6 10.688 2 6.79l5.61-.947L10 1z" />
                </svg>
              ))}
              <svg width="10" height="20" viewBox="0 0 10 20" fill="#FFC633">
                <path d="M10 1l2.39 4.843L18 6.79l-4 3.898.944 5.505L10 13.75V1z" />
              </svg>
            </div>
            <span className="text-sm text-black">4.5/5</span>
          </div>

          {/* Price + options + add to cart */}
          <Suspense
            fallback={
              <ProductActions disabled={true} product={product} region={region} />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1440px] mx-auto px-4 small:px-[100px]">
        <div className="border-t border-black/10" />
        <div className="flex items-center justify-around small:justify-start small:gap-16">
          <span className="py-4 text-sm small:text-lg text-black/60 cursor-pointer hover:text-black transition-colors">
            Detalles del producto
          </span>
          <div className="relative py-4">
            <span className="text-sm small:text-lg font-medium text-black">
              Calificación y reseñas
            </span>
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black rounded-t-full" />
          </div>
          <span className="py-4 text-sm small:text-lg text-black/60 cursor-pointer hover:text-black transition-colors">
            Preguntas frecuentes
          </span>
        </div>
        <div className="border-t border-black/10" />
      </div>

      {/* Reviews */}
      <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] py-8 small:py-10">
        <Suspense fallback={<div className="h-40 animate-pulse bg-gray-100 rounded-xl" />}>
          <ProductReviews productId={product.id!} page={reviewsPage} />
        </Suspense>
      </div>

      {/* You might also like */}
      <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] py-10">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="-rotate-90 opacity-60">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default ProductTemplate
