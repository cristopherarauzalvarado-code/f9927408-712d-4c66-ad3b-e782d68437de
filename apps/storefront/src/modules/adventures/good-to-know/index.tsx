import { site } from "@lib/adventures/site"
import Reveal from "@modules/adventures/common/reveal"

const items = [
  {
    titulo: "Nuestras tarifas incluyen",
    detalle:
      "Todas las actividades del tour, alimentación (desayuno y almuerzo) y las entradas a los parques.",
    icon: "M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  },
  {
    titulo: "No incluyen",
    detalle:
      "Pérdida de objetos personales, gastos médicos especiales (pastillas u otros) y alimentación extra.",
    icon: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  },
  {
    titulo: "Requisitos de salud",
    detalle:
      "Es indispensable encontrarse bien de salud para disfrutar la excursión y evitar contratiempos.",
    icon: "M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 7C19 16.65 12 21 12 21z",
  },
  {
    titulo: "Punto de salida",
    detalle:
      "El punto de partida y llegada de todos los paquetes es el centro de San José.",
    icon: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  },
  {
    titulo: "Horarios",
    detalle: `La mayoría de excursiones inicia alrededor de las 6 a.m. y termina cerca de las 4 p.m. (${site.hours}).`,
    icon: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.73-4-2.37V7z",
  },
  {
    titulo: "Actividades",
    detalle:
      "Cada tour trae actividades distintas — canopy, rafting, buceo, senderismo — pero algo es seguro: te vas a divertir.",
    icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z",
  },
]

export default function GoodToKnow() {
  return (
    <section className="bg-white py-20">
      <div className="content-container">
        <Reveal className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Bueno que sepas</p>
          <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
            Información importante
          </h2>
          <p className="mt-3 font-sans text-lg font-medium text-ink-muted">
            Todo lo que necesitás saber antes de tu aventura, para tu salud y
            seguridad.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 small:grid-cols-2 medium:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.titulo} delay={(i % 3) * 90}>
              <div className="h-full rounded-[24px] border border-jungle-line bg-white p-7 transition-shadow duration-300 hover:shadow-[0px_14px_30px_rgba(0,0,0,0.07)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime text-ink">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 fill-current"
                    aria-hidden
                  >
                    <path d={it.icon} />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-ink">
                  {it.titulo}
                </h3>
                <p className="mt-2 font-sans text-sm font-medium leading-relaxed text-ink-muted">
                  {it.detalle}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
