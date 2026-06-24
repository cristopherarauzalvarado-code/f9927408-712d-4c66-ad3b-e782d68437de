"use client"

import { useState } from "react"
import { site, whatsappLink } from "@lib/adventures/site"

export default function Contact() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [tel, setTel] = useState("")
  const [mensaje, setMensaje] = useState("")

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const texto = [
      "¡Hola! Tengo una consulta:",
      nombre && `👤 Nombre: ${nombre}`,
      email && `✉️ Correo: ${email}`,
      tel && `📞 Teléfono: ${tel}`,
      mensaje && `💬 ${mensaje}`,
    ]
      .filter(Boolean)
      .join("\n")
    window.open(whatsappLink(texto), "_blank", "noopener,noreferrer")
  }

  return (
    <section id="contacto-form" className="scroll-mt-24 bg-[#F7F8FA] py-20">
      <div className="content-container grid gap-12 medium:grid-cols-2">
        {/* Info */}
        <div>
          <p className="eyebrow mb-3">Contacto</p>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-ink small:text-5xl">
            ¿Tenés preguntas?
          </h2>
          <p className="mt-4 max-w-md font-sans text-lg font-medium leading-relaxed text-ink-muted">
            Estamos aquí para ayudarte a planear tu aventura. Escribinos y te
            respondemos por WhatsApp.
          </p>

          <ul className="mt-8 space-y-4 font-sans text-sm font-medium text-ink">
            <InfoRow
              label="WhatsApp"
              value={site.whatsapp.display}
              href={whatsappLink()}
            />
            <InfoRow
              label="Correo"
              value={site.email}
              href={`mailto:${site.email}`}
            />
            <InfoRow label="Dirección" value={site.address} />
            <InfoRow label="Horario" value={site.hours} />
          </ul>
        </div>

        {/* Formulario */}
        <form
          onSubmit={enviar}
          className="rounded-[24px] border border-jungle-line bg-white p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.05)] small:p-8"
        >
          <div className="space-y-4">
            <Campo label="Su nombre">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className={inputCls}
              />
            </Campo>
            <div className="grid gap-4 small:grid-cols-2">
              <Campo label="Correo electrónico">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className={inputCls}
                />
              </Campo>
              <Campo label="Teléfono">
                <input
                  type="tel"
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="+506 8888-8888"
                  className={inputCls}
                />
              </Campo>
            </div>
            <Campo label="Tu mensaje">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                placeholder="Contanos qué aventura tenés en mente…"
                className={`${inputCls} resize-none`}
              />
            </Campo>
          </div>

          <button type="submit" className="btn-dark mt-6 w-full">
            Enviar consulta
          </button>
        </form>
      </div>
    </section>
  )
}

const inputCls =
  "w-full rounded-xl border border-jungle-line bg-white px-4 py-3 font-sans text-sm font-medium text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-ink"

function Campo({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs font-bold text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function InfoRow({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const contenido = (
    <>
      <span className="font-bold text-ink-muted">{label}:</span>{" "}
      <span className="text-ink">{value}</span>
    </>
  )
  return (
    <li className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ink" aria-hidden>
          <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
        </svg>
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {contenido}
        </a>
      ) : (
        <span>{contenido}</span>
      )}
    </li>
  )
}
