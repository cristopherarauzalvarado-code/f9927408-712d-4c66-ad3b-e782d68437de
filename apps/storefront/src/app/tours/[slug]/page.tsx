import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTourBySlug, getTourSlugs } from "@lib/adventures/tours"
import { site } from "@lib/adventures/site"
import Nav from "@modules/adventures/nav"
import Footer from "@modules/adventures/footer"
import Stars from "@modules/adventures/common/stars"
import BookingWidget from "@modules/adventures/booking-widget"

export function generateStaticParams() {
  return getTourSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const tour = getTourBySlug(slug)
  if (!tour) return { title: "Tour no encontrado" }
  return {
    title: tour.nombre,
    description: tour.resumen,
    openGraph: { images: [tour.imagen] },
  }
}

export default async function TourPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const tour = getTourBySlug(slug)

  if (!tour) {
    notFound()
  }

  return (
    <>
      <Nav />

      <div className="content-container pt-8">
        <Link
          href="/#tours"
          className="font-sans text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Volver a tours
        </Link>
      </div>

      {/* Encabezado */}
      <header className="content-container pt-6">
        <p className="eyebrow mb-3">{tour.ubicacion}</p>
        <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-ink small:text-5xl">
          {tour.nombre}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-sm text-ink-muted">
          <span className="flex items-center gap-2">
            <Stars value={tour.rating} />
            {tour.rating.toFixed(1)} · {tour.reviews} reseñas
          </span>
          <span>· {tour.duracion}</span>
          <span>· {tour.grupo}</span>
        </div>
      </header>

      {/* Galería */}
      <section className="content-container mt-8">
        <div className="grid gap-3 small:grid-cols-4 small:grid-rows-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl small:col-span-2 small:row-span-2 small:aspect-auto">
            <Image
              src={tour.galeria[0] ?? tour.imagen}
              alt={tour.nombre}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          {tour.galeria.slice(1, 5).map((src, i) => (
            <div
              key={i}
              className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl small:block"
            >
              <Image
                src={src}
                alt={`${tour.nombre} ${i + 2}`}
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Contenido + reserva */}
      <section className="content-container mt-12 grid grid-cols-1 gap-12 pb-20 medium:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Sobre esta aventura
          </h2>
          <p className="mt-3 font-sans text-base leading-relaxed text-ink-muted">
            {tour.descripcion}
          </p>

          {/* Itinerario */}
          <h2 className="mt-12 font-display text-2xl font-extrabold text-ink">
            Itinerario
          </h2>
          <ol className="mt-5 space-y-5">
            {tour.itinerario.map((paso, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime font-display text-sm font-extrabold text-ink">
                    {i + 1}
                  </span>
                  {i < tour.itinerario.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-jungle-line" />
                  )}
                </div>
                <div className="pb-1">
                  {paso.hora && (
                    <span className="font-mono text-xs text-sand">{paso.hora}</span>
                  )}
                  <h3 className="font-display text-base font-extrabold text-ink">
                    {paso.titulo}
                  </h3>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-ink-muted">
                    {paso.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* Incluye / No incluye */}
          <div className="mt-12 grid gap-8 small:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">
                Qué incluye
              </h2>
              <ul className="mt-4 space-y-2.5">
                {tour.incluye.map((x) => (
                  <li key={x} className="flex gap-3 font-sans text-sm font-medium text-ink-muted">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 fill-[#3DC262]" aria-hidden>
                      <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
                    </svg>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-ink">
                No incluye
              </h2>
              <ul className="mt-4 space-y-2.5">
                {tour.noIncluye.map((x) => (
                  <li key={x} className="flex gap-3 font-sans text-sm text-ink-faint">
                    <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 fill-ink-faint" aria-hidden>
                      <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
                    </svg>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 rounded-2xl border border-jungle-line/40 bg-jungle/20 p-5 font-sans text-sm text-ink-muted">
            {site.departure}. Horario aproximado {site.hours}. ¿Dudas? Escribinos
            por WhatsApp al {site.whatsapp.display}.
          </p>
        </div>

        {/* Reserva sticky */}
        <aside className="medium:sticky medium:top-24 medium:self-start">
          <BookingWidget tour={tour} />
        </aside>
      </section>

      <Footer />
    </>
  )
}
