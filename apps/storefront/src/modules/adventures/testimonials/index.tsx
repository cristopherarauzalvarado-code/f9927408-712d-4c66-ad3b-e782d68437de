import { testimonials } from "@lib/adventures/testimonials"
import Stars from "@modules/adventures/common/stars"

export default function Testimonials() {
  return (
    <section className="bg-white py-20">
      <div className="content-container">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Testimonios</p>
          <h2 className="font-display text-3xl font-extrabold text-ink small:text-5xl">
            Lo que dicen nuestros viajeros
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 small:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.nombre}
              className="flex flex-col rounded-[24px] border border-jungle-line bg-white p-7 shadow-[0px_10px_20px_rgba(0,0,0,0.04)]"
            >
              <Stars value={t.rating} className="mb-4" />
              <blockquote className="flex-1 font-sans text-base font-medium leading-relaxed text-ink">
                “{t.texto}”
              </blockquote>
              <figcaption className="mt-5 border-t border-jungle-line pt-4">
                <span className="font-display text-base font-extrabold text-ink">
                  {t.nombre}
                </span>
                {t.tour && (
                  <span className="mt-0.5 block font-sans text-xs font-medium text-ink-faint">
                    {t.tour}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
