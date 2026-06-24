import Image from "next/image"
import Link from "next/link"
import { villas } from "@lib/adventures/villas"
import { formatUSD } from "@lib/adventures/booking"
import Reveal from "@modules/adventures/common/reveal"

export default function VillasSection() {
  return (
    <section id="villas" className="bg-[#F7F8FA] py-20">
      <div className="content-container">
        <Reveal className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Hospedaje</p>
          <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
            Villas y casas de alquiler equipadas
          </h2>
          <p className="mt-3 font-sans text-lg font-medium text-ink-muted">
            Quédate cerca de la aventura. Espacios totalmente equipados, desde
            apartamentos para parejas hasta casas para grupos.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 medium:grid-cols-2">
          {villas.map((v, i) => (
            <Reveal key={v.slug} delay={(i % 2) * 100}>
              <Link
                href={`/villas/${v.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-jungle-line bg-white transition-shadow duration-300 hover:shadow-[0px_14px_30px_rgba(0,0,0,0.08)] small:flex-row"
              >
                {/* Imagen */}
                <div className="relative aspect-[4/3] shrink-0 overflow-hidden small:aspect-auto small:w-[42%]">
                  <Image
                    src={v.imagen}
                    alt={v.nombre}
                    fill
                    sizes="(max-width: 1024px) 100vw, 320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-sans text-xs font-bold text-ink backdrop-blur">
                    {v.capacidad}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <p className="font-sans text-xs font-medium text-ink-faint">
                    {v.ubicacion}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-extrabold leading-snug text-ink">
                    {v.nombre}
                  </h3>
                  <p className="mt-2 font-sans text-sm font-medium leading-relaxed text-ink-muted line-clamp-4">
                    {v.descripcion}
                  </p>

                  {/* Amenidades reales */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {v.amenidades.map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-jungle-line bg-[#F2F4F6] px-2.5 py-1 font-sans text-[11px] font-bold text-ink-muted"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Precio */}
                  <div className="mt-auto flex items-end justify-between border-t border-jungle-line pt-4">
                    <div>
                      <span className="font-display text-xl font-extrabold text-ink">
                        {formatUSD(v.precioUSD)}
                      </span>
                      <span className="ml-1 font-sans text-xs font-medium text-ink-faint">
                        / {v.unidad}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 font-sans text-sm font-bold text-ink transition-colors group-hover:text-ink-muted">
                      Ver villa
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
                        <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
