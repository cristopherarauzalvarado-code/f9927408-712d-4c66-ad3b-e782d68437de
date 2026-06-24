"use client"

import { convertToLocale } from "@lib/util/money"
import type { StoreFilters } from "@lib/data/store-filters"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type FilterSidebarProps = {
  availableFilters: StoreFilters
  // En páginas de categoría/colección el contexto ya fija la categoría,
  // así que se oculta la sección de categorías.
  showCategories?: boolean
}

// Mapa de nombres de color comunes → hex para pintar el swatch.
// Si un color no está acá, igual se muestra con su nombre.
const COLOR_HEX: Record<string, string> = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#F50606",
  green: "#00C12B",
  blue: "#063AF5",
  yellow: "#F5DD06",
  orange: "#F57906",
  purple: "#7D06F5",
  pink: "#F506A4",
  gray: "#6B7280",
  grey: "#6B7280",
  brown: "#92400E",
  beige: "#E8D9B5",
  navy: "#0A1F44",
}

const colorToHex = (name: string): string | null =>
  COLOR_HEX[name.trim().toLowerCase()] ?? null

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full"
    >
      <span className="font-bold text-lg text-black">{title}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className={`transition-transform ${expanded ? "" : "rotate-180"}`}
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

const parseList = (value: string | null): string[] =>
  value ? value.split(",").filter(Boolean) : []

export default function FilterSidebar({
  availableFilters,
  showCategories = true,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { categories, colors, sizes, priceRange, currencyCode } =
    availableFilters

  const rangeMin = priceRange?.min ?? 0
  const rangeMax = priceRange?.max ?? 0

  const [priceExpanded, setPriceExpanded] = useState(true)
  const [colorsExpanded, setColorsExpanded] = useState(true)
  const [sizeExpanded, setSizeExpanded] = useState(true)

  // Estado inicial tomado de la URL para que la barra refleje los filtros activos.
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    parseList(searchParams.get("categories"))
  )
  const [selectedColors, setSelectedColors] = useState<string[]>(
    parseList(searchParams.get("colors"))
  )
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    parseList(searchParams.get("sizes"))
  )
  const [minPrice, setMinPrice] = useState(
    Number(searchParams.get("minPrice")) || rangeMin
  )
  const [maxPrice, setMaxPrice] = useState(
    Number(searchParams.get("maxPrice")) || rangeMax
  )

  const toggle = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    const setOrDelete = (key: string, value: string) =>
      value ? params.set(key, value) : params.delete(key)

    setOrDelete("categories", selectedCategories.join(","))
    setOrDelete("colors", selectedColors.join(","))
    setOrDelete("sizes", selectedSizes.join(","))

    if (priceRange && (minPrice > rangeMin || maxPrice < rangeMax)) {
      params.set("minPrice", String(minPrice))
      params.set("maxPrice", String(maxPrice))
    } else {
      params.delete("minPrice")
      params.delete("maxPrice")
    }

    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedColors([])
    setSelectedSizes([])
    setMinPrice(rangeMin)
    setMaxPrice(rangeMax)
    router.push(pathname)
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    (priceRange && (minPrice > rangeMin || maxPrice < rangeMax))

  const priceSpan = rangeMax - rangeMin || 1
  const pricePercent = (val: number) => ((val - rangeMin) / priceSpan) * 100
  const fmtPrice = (val: number) =>
    convertToLocale({
      amount: val,
      currency_code: currencyCode ?? "",
      maximumFractionDigits: 0,
    })

  return (
    <div className="border border-black/10 rounded-[20px] p-5 flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-xl text-black">Filtros</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-40">
          <path d="M4 6h16M7 12h10M10 18h4" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Categories */}
      {showCategories && categories.length > 0 && (
        <>
          <div className="border-t border-black/10" />
          <div className="flex flex-col gap-4">
            <SectionHeader title="Categorías" expanded onToggle={() => {}} />
            <div className="flex flex-col gap-3">
              {categories.map((cat) => {
                const selected = selectedCategories.includes(cat.handle)
                return (
                  <button
                    key={cat.handle}
                    onClick={() => toggle(cat.handle, setSelectedCategories)}
                    className="flex items-center justify-between w-full group"
                  >
                    <span
                      className={`text-sm transition-colors ${
                        selected
                          ? "text-black font-semibold"
                          : "text-black/60 group-hover:text-black"
                      }`}
                    >
                      {cat.label}
                    </span>
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                        selected
                          ? "bg-black border-black"
                          : "border-black/30 group-hover:border-black"
                      }`}
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l4 4 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Price */}
      {priceRange && (
        <>
          <div className="border-t border-black/10" />
          <div className="flex flex-col gap-5">
            <SectionHeader title="Precio" expanded={priceExpanded} onToggle={() => setPriceExpanded((v) => !v)} />
            {priceExpanded && (
              <div className="flex flex-col gap-2">
                <div className="relative h-[6px] bg-[#F0F0F0] rounded-full mx-1">
                  <div
                    className="absolute h-full bg-black rounded-full"
                    style={{
                      left: `${pricePercent(minPrice)}%`,
                      right: `${100 - pricePercent(maxPrice)}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={rangeMin}
                    max={rangeMax}
                    value={minPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (v < maxPrice) setMinPrice(v)
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                  <input
                    type="range"
                    min={rangeMin}
                    max={rangeMax}
                    value={maxPrice}
                    onChange={(e) => {
                      const v = Number(e.target.value)
                      if (v > minPrice) setMaxPrice(v)
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                  <div
                    className="absolute w-5 h-5 bg-black rounded-full -translate-y-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${pricePercent(minPrice)}%` }}
                  />
                  <div
                    className="absolute w-5 h-5 bg-black rounded-full -translate-y-1/2 top-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${pricePercent(maxPrice)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-medium mt-1">
                  <span>{fmtPrice(minPrice)}</span>
                  <span>{fmtPrice(maxPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Colors */}
      {colors.length > 0 && (
        <>
          <div className="border-t border-black/10" />
          <div className="flex flex-col gap-4">
            <SectionHeader title="Colores" expanded={colorsExpanded} onToggle={() => setColorsExpanded((v) => !v)} />
            {colorsExpanded && (
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const selected = selectedColors.includes(color)
                  const hex = colorToHex(color)
                  return (
                    <button
                      key={color}
                      onClick={() => toggle(color, setSelectedColors)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all ${
                        selected
                          ? "border-black bg-black text-white font-medium"
                          : "border-black/15 text-black/70 hover:border-black"
                      }`}
                    >
                      {hex && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: hex }}
                        />
                      )}
                      {color}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Sizes */}
      {sizes.length > 0 && (
        <>
          <div className="border-t border-black/10" />
          <div className="flex flex-col gap-4">
            <SectionHeader title="Tallas" expanded={sizeExpanded} onToggle={() => setSizeExpanded((v) => !v)} />
            {sizeExpanded && (
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const selected = selectedSizes.includes(size)
                  return (
                    <button
                      key={size}
                      onClick={() => toggle(size, setSelectedSizes)}
                      className={`px-4 py-2 rounded-full text-xs transition-all ${
                        selected
                          ? "bg-black text-white font-medium"
                          : "bg-[#F0F0F0] text-black/60 hover:bg-gray-200"
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <button
        onClick={applyFilters}
        className="w-full bg-brand text-brand-foreground rounded-full py-3 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Aplicar filtros
      </button>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-black/60 hover:text-black transition-colors -mt-3"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
