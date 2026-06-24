import Image from "next/image"
import Link from "next/link"
import type { Tour } from "@lib/adventures/tours"
import { formatUSD } from "@lib/adventures/booking"

const categoriaLabel: Record<Tour["categoria"], string> = {
  "tours-nacionales": "Tour nacional",
  buceo: "Buceo",
  internacional: "Internacional",
}

// Color de la etiqueta superior según rating (estilo Figma).
function badge(tour: Tour): { text: string; color: string } {
  if (tour.rating >= 5) return { text: "Top Rated", color: "text-sand" }
  if (tour.destacado) return { text: "Más vendido", color: "text-[#3DC262]" }
  return { text: categoriaLabel[tour.categoria], color: "text-ink-muted" }
}

export default function TourCard({ tour }: { tour: Tour }) {
  const tag = badge(tour)

  return (
    <article className="group flex flex-col overflow-hidden rounded-[24px] border border-jungle-line bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-jungle-line/60 hover:shadow-[0px_22px_45px_rgba(0,0,0,0.12)]">
      {/* Imagen */}
      <Link
        href={`/tours/${tour.slug}`}
        className="relative block aspect-[16/11] overflow-hidden"
      >
        <Image
          src={tour.imagen}
          alt={tour.nombre}
          fill
          sizes="(max-width: 1024px) 100vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute left-4 top-4 rounded-full bg-white px-4 py-1.5 font-sans text-sm font-bold ${tag.color}`}
        >
          {tag.text}
        </span>
        <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-2xl bg-white/85 backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-ink" strokeWidth="1.5" aria-hidden>
            <path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 7C19 16.65 12 21 12 21z" />
          </svg>
        </span>
      </Link>

      {/* Contenido */}
      <div className="relative flex flex-1 flex-col px-6 pb-6 pt-7">
        {/* Píldora de rating superpuesta */}
        <span className="absolute right-6 top-0 flex -translate-y-1/2 items-center gap-2 rounded-full border border-jungle-line bg-white px-4 py-2 shadow-[0px_2px_7px_rgba(0,0,0,0.07)]">
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-sand-soft" aria-hidden>
            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
          </svg>
          <span className="font-sans text-sm font-bold text-ink">
            {tour.rating.toFixed(2)}{" "}
            <span className="text-ink-muted">({tour.reviews})</span>
          </span>
        </span>

        <h3 className="font-display text-xl font-extrabold leading-snug text-ink">
          <Link href={`/tours/${tour.slug}`} className="hover:text-ink-muted">
            {tour.nombre}
          </Link>
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm font-medium text-ink-muted">
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink-faint" aria-hidden>
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.73-4-2.37V7z" />
            </svg>
            {tour.duracion}
          </span>
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink-faint" aria-hidden>
              <path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.24 8 5v2H4v-2c0-2.76 3.58-5 8-5z" />
            </svg>
            {tour.grupo}
          </span>
        </div>

        <p className="mt-3 flex-1 font-sans text-sm leading-relaxed text-ink-muted line-clamp-2">
          {tour.resumen}
        </p>

        <div className="mt-5 flex items-end justify-between border-t border-jungle-line pt-5">
          <div>
            <span className="font-display text-2xl font-extrabold text-ink">
              {formatUSD(tour.precioUSD)}
            </span>
            <span className="ml-1 font-sans text-sm font-medium text-ink-muted">
              / persona
            </span>
          </div>
          <Link href={`/tours/${tour.slug}`} className="btn-soft">
            Reservar
          </Link>
        </div>
      </div>
    </article>
  )
}
