import { HttpTypes } from "@medusajs/types"

export type ProductFilters = {
  categories?: string[] // category handles
  colors?: string[] // option values (e.g. "Black")
  sizes?: string[] // option values (e.g. "M")
  minPrice?: number // in major currency units (e.g. colones / dollars)
  maxPrice?: number
}

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number }
}

/** Devuelve los valores de una opción de producto cuyo título coincide (case-insensitive). */
export const getOptionValues = (
  product: HttpTypes.StoreProduct,
  optionName: string
): string[] => {
  const option = product.options?.find((o) =>
    o.title?.toLowerCase().includes(optionName.toLowerCase())
  )
  return (option?.values?.map((v) => v.value).filter(Boolean) as string[]) ?? []
}

/** Precio más barato del producto, en unidades mayores (lo que devuelve calculated_amount). */
export const getCheapestAmount = (
  product: HttpTypes.StoreProduct
): number | null => {
  const amounts = (product.variants as VariantWithPrice[] | undefined)
    ?.map((v) => v.calculated_price?.calculated_amount)
    .filter((a): a is number => typeof a === "number")
  if (!amounts?.length) return null
  return Math.min(...amounts)
}

/** Filtra productos en memoria según los filtros seleccionados. */
export const filterProducts = (
  products: HttpTypes.StoreProduct[],
  filters: ProductFilters
): HttpTypes.StoreProduct[] => {
  const { categories, colors, sizes, minPrice, maxPrice } = filters

  return products.filter((product) => {
    if (categories?.length) {
      const handles = product.categories?.map((c) => c.handle) ?? []
      if (!categories.some((h) => handles.includes(h))) return false
    }

    if (colors?.length) {
      const productColors = getOptionValues(product, "color")
      if (!colors.some((c) => productColors.includes(c))) return false
    }

    if (sizes?.length) {
      const productSizes = getOptionValues(product, "size")
      if (!sizes.some((s) => productSizes.includes(s))) return false
    }

    if (minPrice != null || maxPrice != null) {
      const amount = getCheapestAmount(product)
      if (amount != null) {
        if (minPrice != null && amount < minPrice) return false
        if (maxPrice != null && amount > maxPrice) return false
      }
    }

    return true
  })
}
