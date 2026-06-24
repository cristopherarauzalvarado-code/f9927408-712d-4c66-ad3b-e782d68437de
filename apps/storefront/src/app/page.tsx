import Image from "next/image"
import Link from "next/link"
import { tours } from "@lib/adventures/tours"
import { formatUSD } from "@lib/adventures/booking"
import Nav from "@modules/adventures/nav"
import Hero from "@modules/adventures/hero"
import ToursGrid from "@modules/adventures/tours-grid"
import ValueStrip from "@modules/adventures/value-strip"
import VillasSection from "@modules/adventures/villas-section"
import Testimonials from "@modules/adventures/testimonials"
import Footer from "@modules/adventures/footer"
import Reveal from "@modules/adventures/common/reveal"
import About from "@modules/adventures/about"
import CircuitsCta from "@modules/adventures/circuits-cta"
import Gallery from "@modules/adventures/gallery"
import GoodToKnow from "@modules/adventures/good-to-know"
import Contact from "@modules/adventures/contact"
import CategoryCards from "@modules/adventures/category-cards"

// Filtra por rango de precio "min-max" (max vacío = sin tope).
function enRango(precioUSD: number, rango: string) {
  if (!rango) return true
  const [min, max] = rango.split("-")
  const lo = Number(min) || 0
  const hi = max ? Number(max) : Infinity
  return precioUSD >= lo && precioUSD <= hi
}

export default async function Home(props: {
  searchParams: Promise<{ categoria?: string; precio?: string }>
}) {
  const { categoria = "todos", precio = "" } = await props.searchParams

  const visibles = tours.filter(
    (t) =>
      (categoria === "todos" || t.categoria === categoria) &&
      enRango(t.precioUSD, precio)
  )

  const internacionales = tours.filter((t) => t.categoria === "internacional")

  return (
    <>
      <Nav overlay />
      <Hero />
      <CategoryCards />

      {/* Tours */}
      <section id="tours" className="scroll-mt-24 bg-white py-20">
        <div className="content-container">
          <Reveal className="mb-10 max-w-2xl">
            <p className="eyebrow mb-3">Experiencias</p>
            <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
              Elegí tu próxima aventura
            </h2>
            <p className="mt-3 font-sans text-lg font-medium text-ink-muted">
              Tours nacionales, buceo de clase mundial y viajes internacionales.
              Todos con transporte, guía y comida incluidos.
            </p>
          </Reveal>
          <ToursGrid tours={visibles} categoria={categoria} precio={precio} />
        </div>
      </section>

      <Reveal>
        <ValueStrip />
      </Reveal>

      <About />

      {/* Internacional */}
      <section id="internacional" className="scroll-mt-24 bg-white py-20">
        <div className="content-container">
          <Reveal className="mb-10 max-w-2xl">
            <p className="eyebrow mb-3">Más allá de Costa Rica</p>
            <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
              Viajes internacionales
            </h2>
            <p className="mt-3 font-sans text-lg font-medium text-ink-muted">
              Coordinamos todo desde San José: vuelo, traslados, hospedaje y
              guía. Vos solo hacés la maleta.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 medium:grid-cols-2">
            {internacionales.map((t, i) => (
              <Reveal key={t.slug} delay={(i % 2) * 120} from="scale">
                <Link
                  href={`/tours/${t.slug}`}
                  className="group relative flex min-h-[300px] items-end overflow-hidden rounded-[24px] border border-jungle-line"
                >
                  <Image
                    src={t.imagen}
                    alt={t.nombre}
                    fill
                    sizes="(max-width: 1280px) 100vw, 600px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="relative z-10 p-7">
                    <p className="font-sans text-xs font-bold uppercase tracking-wide text-lime">
                      {t.duracion}
                    </p>
                    <h3 className="mt-1.5 font-display text-2xl font-extrabold text-white">
                      {t.nombre}
                    </h3>
                    <p className="mt-2 max-w-md font-sans text-sm font-medium text-white/80">
                      {t.resumen}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 font-display text-sm font-extrabold text-ink">
                      desde {formatUSD(t.precioUSD)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CircuitsCta />

      <VillasSection />

      <Gallery />

      <GoodToKnow />

      <Reveal>
        <Testimonials />
      </Reveal>

      <Contact />

      <Footer />
    </>
  )
}
