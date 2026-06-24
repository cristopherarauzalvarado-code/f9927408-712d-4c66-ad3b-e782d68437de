import Image from "next/image"
import Link from "next/link"
import { whatsappLink } from "@lib/adventures/site"
import Reveal from "@modules/adventures/common/reveal"

export default function CircuitsCta() {
  return (
    <section className="bg-white py-12">
      <div className="content-container">
        <Reveal from="scale">
          <div className="relative overflow-hidden rounded-[32px] border border-jungle-line">
            <Image
              src="https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=2000&q=80"
              alt="Circuitos de aventura en Costa Rica"
              fill
              sizes="(max-width: 1280px) 100vw, 1248px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
            <div className="relative z-10 max-w-2xl px-7 py-14 small:px-14 small:py-20">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-lime">
                Circuitos a tu medida
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white small:text-5xl">
                Diseñá tu propio recorrido por Costa Rica
              </h2>
              <p className="mt-4 font-sans text-lg font-medium leading-relaxed text-white/85">
                Elegí los destinos que más te emocionan y nosotros armamos el
                itinerario perfecto: transporte, guía, hospedaje y comida, todo
                coordinado desde San José.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={whatsappLink(
                    "¡Hola! Quiero armar un circuito a mi medida en Costa Rica."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lime"
                >
                  Armar mi circuito
                </Link>
                <Link href="#tours" className="btn-outline bg-transparent text-white hover:border-white">
                  Ver tours
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
