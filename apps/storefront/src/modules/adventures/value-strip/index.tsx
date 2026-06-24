const valores = [
  {
    titulo: "Transporte incluido",
    detalle: "Recogida y regreso desde San José en transporte turístico.",
    icon: (
      <path d="M3 13l2-5a3 3 0 0 1 2.8-2h8.4A3 3 0 0 1 19 8l2 5v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5zm3.5 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 12h13l-1.4-3.5a1 1 0 0 0-.93-.5H7.83a1 1 0 0 0-.93.5L5.5 12z" />
    ),
  },
  {
    titulo: "Guías locales",
    detalle: "Expertos certificados que conocen cada sendero y su historia.",
    icon: (
      <path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 12c4.42 0 8 2.24 8 5v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2c0-2.76 3.58-5 8-5z" />
    ),
  },
  {
    titulo: "Comida típica",
    detalle: "Desayuno y almuerzo costarricense incluidos en cada tour.",
    icon: (
      <path d="M11 2v9a3 3 0 0 1-2 2.83V22H7v-8.17A3 3 0 0 1 5 11V2h2v7h1V2h1v7h1V2h1zm6 0c1.66 0 3 2.91 3 6.5 0 2.79-.81 5.16-2 6.06V22h-2V2z" />
    ),
  },
  {
    titulo: "Desde 2007",
    detalle: "Más de 18 años creando aventuras seguras y memorables.",
    icon: (
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.73-4-2.37V7z" />
    ),
  },
]

export default function ValueStrip() {
  return (
    <section className="border-y border-jungle-line bg-[#F7F8FA]">
      <div className="content-container grid gap-8 py-14 small:grid-cols-2 medium:grid-cols-4">
        {valores.map((v) => (
          <div key={v.titulo} className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime text-ink">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                {v.icon}
              </svg>
            </span>
            <div>
              <h3 className="font-display text-base font-extrabold text-ink">
                {v.titulo}
              </h3>
              <p className="mt-1 font-sans text-sm font-medium leading-relaxed text-ink-muted">
                {v.detalle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
