import Image from "next/image"
import Reveal from "@modules/adventures/common/reveal"

// Fotos reales de recorridos (del sitio de Costarican Adventures), servidas
// localmente desde /public/gallery para no depender del servidor del cliente.
const fotos = [
  { src: "/gallery/catarata.jpg", alt: "Catarata La Leona, Rincón de la Vieja", span: "row-span-2" },
  { src: "/gallery/snorkel.jpg", alt: "Snorkel en aguas cristalinas", span: "" },
  { src: "/gallery/tortuguero.jpg", alt: "Tortuga en Tortuguero", span: "" },
  { src: "/gallery/yate-jacuzzi.jpg", alt: "Expedición en yate con vista al mar", span: "row-span-2" },
  { src: "/gallery/snorkel-superficie.jpg", alt: "Snorkel en superficie", span: "" },
  { src: "/gallery/piscina.jpg", alt: "Piscina entre palmeras", span: "" },
  { src: "/gallery/piscina-mar.jpg", alt: "Piscina frente al mar", span: "" },
  { src: "/gallery/yate-interior.jpg", alt: "Interior del yate", span: "" },
]

export default function Gallery() {
  return (
    <section id="galeria" className="scroll-mt-24 bg-[#F7F8FA] py-20">
      <div className="content-container">
        <Reveal className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Galería</p>
          <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
            Fotos de recorridos anteriores
          </h2>
          <p className="mt-3 font-sans text-lg font-medium text-ink-muted">
            Un vistazo a los lugares que vas a vivir con nosotros.
          </p>
        </Reveal>

        <div className="grid auto-rows-[180px] grid-cols-2 gap-4 small:grid-cols-3 medium:grid-cols-4">
          {fotos.map((f, i) => (
            <Reveal
              key={f.src}
              delay={(i % 4) * 80}
              from="scale"
              className={`group relative overflow-hidden rounded-[20px] border border-jungle-line ${f.span}`}
            >
              <Image
                src={f.src}
                alt={f.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 300px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
