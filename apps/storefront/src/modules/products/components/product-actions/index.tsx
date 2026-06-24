"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null
    if (params.get("v_id") === value) return
    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }
    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (selectedVariant?.manage_inventory && (selectedVariant?.inventory_quantity || 0) > 0) return true
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    await addToCart({ variantId: selectedVariant.id, quantity, countryCode })
    setIsAdding(false)
  }

  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
  })
  const selectedPrice = selectedVariant ? variantPrice : cheapestPrice

  return (
    <div className="flex flex-col gap-5" ref={actionsRef}>
      {/* Price */}
      {selectedPrice && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-[28px] small:text-[32px] text-black">
            {!selectedVariant && "From "}
            {selectedPrice.calculated_price}
          </span>
          {selectedPrice.price_type === "sale" && (
            <>
              <span className="font-bold text-[28px] small:text-[32px] text-black/30 line-through">
                {selectedPrice.original_price}
              </span>
              <span className="bg-red-100 text-[#FF3333] text-sm font-medium px-3 py-1 rounded-full">
                -{selectedPrice.percentage_diff}%
              </span>
            </>
          )}
        </div>
      )}

      <div className="border-t border-black/10" />

      {/* Description */}
      {product.description && (
        <>
          <p className="text-sm small:text-base text-black/60 leading-relaxed">
            {product.description}
          </p>
          <div className="border-t border-black/10" />
        </>
      )}

      {/* Options */}
      {(product.variants?.length ?? 0) > 1 && (
        <>
          {(product.options || []).map((option) => (
            <div key={option.id}>
              <OptionSelect
                option={option}
                current={options[option.id]}
                updateOption={setOptionValue}
                title={option.title ?? ""}
                data-testid="product-options"
                disabled={!!disabled || isAdding}
              />
              <div className="border-t border-black/10 mt-5" />
            </div>
          ))}
        </>
      )}

      {/* Qty + Add to Cart */}
      <div className="flex items-center gap-3 flex-col small:flex-row" data-testid="product-actions">
        {/* Qty stepper */}
        <div className="flex items-center justify-between bg-[#F0F0F0] rounded-full px-4 py-3 w-full small:w-[170px] shrink-0">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || !!disabled}
            className="w-6 h-6 flex items-center justify-center text-black hover:opacity-60 transition-opacity disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-base font-medium text-black min-w-[24px] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            disabled={!!disabled}
            className="w-6 h-6 flex items-center justify-center text-black hover:opacity-60 transition-opacity disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding || !isValidVariant}
          className="flex-1 w-full bg-black text-white rounded-full py-3 text-base font-medium hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="add-product-button"
        >
          {isAdding ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Agregando...
            </>
          ) : !selectedVariant && (product.variants?.length ?? 0) > 1 ? (
            "Seleccioná una variante"
          ) : !inStock ? (
            "Agotado"
          ) : (
            "Agregar al carrito"
          )}
        </button>
      </div>
    </div>
  )
}
