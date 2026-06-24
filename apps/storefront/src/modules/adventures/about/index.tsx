import Image from "next/image"
import Link from "next/link"
import { site, whatsappLink } from "@lib/adventures/site"
import Reveal from "@modules/adventures/common/reveal"

const amenidades = ["Tours", "Canopy", "Rafting", "Buceo"]

export default function About() {
  const anios = new Date().getFullYear() - site.foundedYear

  return (
    <section id="nosotros" className="scroll-mt-24 bg-white py-20">
      <div className="content-container grid items-center gap-12 medium:grid-cols-2">
        {/* Imagen */}
        <Reveal from="left" className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-jungle-line">
            <Image
              src="/about/sobre-nosotros.jpg"
              alt="Grupo en un tour de aventura con Costarican Adventures"
              fill
              sizes="(max-width: 1280px) 100vw, 600px"
              className="object-cover"
            />
          </div>
          {/* Sello de años */}
          <div className="absolute -bottom-5 -right-3 flex flex-col items-center rounded-3xl border border-jungle-line bg-lime px-6 py-4 shadow-[0px_12px_30px_rgba(0,0,0,0.12)] small:-right-5">
            <span className="font-display text-4xl font-extrabold leading-none text-ink">
              +{anios}
            </span>
            <span className="mt-1 font-sans text-xs font-bold uppercase tracking-wide text-ink">
              años
            </span>
          </div>
        </Reveal>

        {/* Texto */}
        <Reveal from="right">
          <p className="eyebrow mb-3">Sobre nosotros</p>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-ink small:text-5xl">
            Aventuras reales en Costa Rica desde 2007
          </h2>
          <p className="mt-5 font-sans text-lg font-medium leading-relaxed text-ink-muted">
            Somos una empresa de excursiones que inició su aventura en agosto de
            2007, destacándose en el turismo nacional con paquetes atractivos y
            rutas por todo el país.
          </p>
          <p className="mt-4 font-sans text-base font-medium leading-relaxed text-ink-muted">
            Hoy operamos durante todo el año para llevarte a explorar los
            destinos que soñás. Agradecemos a quienes confían en nuestro trabajo
            — y seguimos sumando aventuras inolvidables.
          </p>

          {/* Amenidades & servicios */}
          <div className="mt-7 flex flex-wrap gap-2.5">
            {amenidades.map((a) => (
              <span
                key={a}
                className="rounded-full border border-jungle-line bg-[#F2F4F6] px-4 py-2 font-sans text-sm font-bold text-ink"
              >
                {a}
              </span>
            ))}
          </div>

          <Link
            href={whatsappLink(
              "¡Hola! Quiero saber más sobre Costarican Adventures."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark mt-8"
          >
            Hablá con nosotros
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
