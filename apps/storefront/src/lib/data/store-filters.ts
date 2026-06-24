import { getCheapestAmount, getOptionValues } from "@lib/util/product-filter"
import { HttpTypes } from "@medusajs/types"
import { listCategories } from "./categories"
import { listProducts } from "./products"

export type StoreFilterCategory = {
  label: string
  handle: string
}

export type StoreFilters = {
  categories: StoreFilterCategory[]
  colors: string[]
  sizes: string[]
  priceRange: { min: number; max: number } | null
  currencyCode: string | null
}

const TYPICAL_SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
]

const sortSizes = (sizes: string[]): string[] => {
  return [...sizes].sort((a, b) => {
    const ia = TYPICAL_SIZE_ORDER.indexOf(a.toUpperCase())
    const ib = TYPICAL_SIZE_ORDER.indexOf(b.toUpperCase())
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

type StoreFilterScope = {
  categoryId?: string
  collectionId?: string
}

/**
 * Deriva las facetas de filtro disponibles a partir del catálogo real de Medusa:
 * categorías (gestionadas en el Admin), colores y tallas (opciones de producto) y
 * el rango de precio. Así, agregar/renombrar una categoría o una opción en el Admin
 * se refleja automáticamente en el storefront, sin tocar código.
 *
 * `scope` limita los colores/tallas/precio a una categoría o colección concreta
 * (para que el sidebar de esas páginas solo muestre opciones relevantes).
 */
export const getStoreFilters = async (
  countryCode: string,
  scope?: StoreFilterScope
): Promise<StoreFilters> => {
  const scopedQuery: Record<string, unknown> = { limit: 100 }
  if (scope?.categoryId) scopedQuery.category_id = [scope.categoryId]
  if (scope?.collectionId) scopedQuery.collection_id = [scope.collectionId]

  const [categoriesRaw, productsResult] = await Promise.all([
    listCategories({ fields: "name,handle" }).catch(() => []),
    listProducts({
      countryCode,
      queryParams: scopedQuery,
    }).catch(() => ({
      response: { products: [] as HttpTypes.StoreProduct[], count: 0 },
    })),
  ])

  const products = productsResult.response.products

  const categories: StoreFilterCategory[] = (categoriesRaw ?? [])
    .filter((c) => c.handle && c.name)
    .map((c) => ({ label: c.name as string, handle: c.handle as string }))

  const colorSet = new Set<string>()
  const sizeSet = new Set<string>()
  let min = Infinity
  let max = -Infinity
  let currencyCode: string | null = null

  for (const product of products) {
    getOptionValues(product, "color").forEach((v) => colorSet.add(v))
    getOptionValues(product, "size").forEach((v) => sizeSet.add(v))

    const amount = getCheapestAmount(product)
    if (amount != null) {
      min = Math.min(min, amount)
      max = Math.max(max, amount)
    }

    if (!currencyCode) {
      const variant = product.variants?.find(
        (v) => (v as { calculated_price?: { currency_code?: string } })
          .calculated_price?.currency_code
      ) as { calculated_price?: { currency_code?: string } } | undefined
      currencyCode = variant?.calculated_price?.currency_code ?? null
    }
  }

  return {
    categories,
    colors: Array.from(colorSet).sort(),
    sizes: sortSizes(Array.from(sizeSet)),
    priceRange:
      min !== Infinity && max !== -Infinity
        ? { min: Math.floor(min), max: Math.ceil(max) }
        : null,
    currencyCode,
  }
}
