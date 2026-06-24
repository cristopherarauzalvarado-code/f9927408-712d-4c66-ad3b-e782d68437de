import Link from "next/link"
import type { Tour } from "@lib/adventures/tours"
import TourCard from "@modules/adventures/tour-card"
import Reveal from "@modules/adventures/common/reveal"

const filtros = [
  { slug: "todos", label: "Todos" },
  { slug: "tours-nacionales", label: "Tours nacionales" },
  { slug: "buceo", label: "Buceo" },
  { slug: "internacional", label: "Internacional" },
] as const

// Construye el href del filtro preservando el precio actual y apuntando a #tours.
function filtroHref(categoria: string, precio: string) {
  const params = new URLSearchParams()
  if (categoria && categoria !== "todos") params.set("categoria", categoria)
  if (precio) params.set("precio", precio)
  const qs = params.toString()
  return `/${qs ? `?${qs}` : ""}#tours`
}

export default function ToursGrid({
  tours,
  categoria = "todos",
  precio = "",
}: {
  tours: Tour[]
  categoria?: string
  precio?: string
}) {
  return (
    <div>
      <div className="no-scrollbar -mx-5 mb-8 flex gap-2.5 overflow-x-auto px-5 small:mx-0 small:flex-wrap small:px-0">
        {filtros.map((f) => {
          const seleccionado = f.slug === categoria
          return (
            <Link
              key={f.slug}
              href={filtroHref(f.slug, precio)}
              scroll={false}
              aria-pressed={seleccionado}
              className={`shrink-0 rounded-full border px-5 py-2.5 font-sans text-sm font-bold transition-colors ${
                seleccionado
                  ? "border-ink bg-ink text-white"
                  : "border-jungle-line bg-[#F2F4F6] text-ink hover:border-ink"
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 small:grid-cols-2 medium:grid-cols-3">
        {tours.map((tour, i) => (
          <Reveal key={tour.slug} delay={(i % 3) * 90}>
            <TourCard tour={tour} />
          </Reveal>
        ))}
      </div>

      {tours.length === 0 && (
        <p className="py-12 text-center font-sans text-ink-muted">
          No hay tours con esos filtros. Probá con otra categoría o precio.
        </p>
      )}
    </div>
  )
}
