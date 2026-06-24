import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getVillaBySlug, getVillaSlugs } from "@lib/adventures/villas"
import Nav from "@modules/adventures/nav"
import Footer from "@modules/adventures/footer"
import VillaBooking from "@modules/adventures/villa-booking"

export function generateStaticParams() {
  return getVillaSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const villa = getVillaBySlug(slug)
  if (!villa) return { title: "Villa no encontrada" }
  return {
    title: villa.nombre,
    description: villa.resumen,
    openGraph: { images: [villa.imagen] },
  }
}

export default async function VillaPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const villa = getVillaBySlug(slug)
  if (!villa) notFound()

  return (
    <>
      <Nav />

      <div className="content-container pt-8">
        <Link
          href="/#villas"
          className="font-sans text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Volver a villas
        </Link>
      </div>

      {/* Encabezado */}
      <header className="content-container pt-6">
        <p className="eyebrow mb-3">{villa.ubicacion}</p>
        <h1 className="max-w-3xl font-display text-3xl font-extrabold leading-tight text-ink small:text-5xl">
          {villa.nombre}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-sm text-ink-muted">
          <span>{villa.capacidad}</span>
          <span>·</span>
          <span>Alquiler por noche</span>
        </div>
      </header>

      {/* Galería */}
      <section className="content-container mt-8">
        <div className="grid gap-3 small:grid-cols-4 small:grid-rows-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl small:col-span-2 small:row-span-2 small:aspect-auto">
            <Image
              src={villa.galeria[0] ?? villa.imagen}
              alt={villa.nombre}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          {villa.galeria.slice(1, 5).map((src, i) => (
            <div
              key={i}
              className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl small:block"
            >
              <Image
                src={src}
                alt={`${villa.nombre} ${i + 2}`}
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
            Sobre este hospedaje
          </h2>
          <p className="mt-4 font-sans text-base font-medium leading-relaxed text-ink-muted">
            {villa.descripcion}
          </p>

          <h3 className="mt-8 font-display text-lg font-extrabold text-ink">
            Amenidades y servicios
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 small:grid-cols-2">
            {villa.amenidades.map((a) => (
              <li
                key={a}
                className="flex items-center gap-3 font-sans text-sm font-medium text-ink"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-ink" aria-hidden>
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.42z" />
                  </svg>
                </span>
                {a}
              </li>
            ))}
          </ul>
        </div>

        <aside className="medium:sticky medium:top-24 medium:self-start">
          <VillaBooking villa={villa} />
        </aside>
      </section>

      <Footer />
    </>
  )
}
