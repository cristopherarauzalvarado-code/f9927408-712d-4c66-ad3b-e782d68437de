"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useRef, useState, useEffect } from "react"

const sortOptions = [
  { value: "created_at", label: "Más populares" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
]

export default function SortDropdown({ sortBy }: { sortBy?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "Más populares"

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-black/60 hover:text-black transition-colors"
      >
        <span className="font-medium text-black">{currentLabel}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-black/10 rounded-xl shadow-lg z-20 min-w-[180px] py-2">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                (sortBy ?? "created_at") === opt.value ? "font-medium text-black" : "text-black/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
