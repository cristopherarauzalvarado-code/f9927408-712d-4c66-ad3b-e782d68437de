"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  buildBooking,
  formatUSD,
  parseBookingParams,
} from "@lib/adventures/booking"
import { formatFechaLarga } from "@lib/adventures/availability"
import { whatsappLink } from "@lib/adventures/site"
import PaymentLogo from "@modules/adventures/common/payment-icons"

/**
 * Checkout = PÁGINA DE PAGO (no de contacto).
 *
 * Flujo del negocio: la venta se cierra por WhatsApp (el bot toma datos y
 * detalles del cliente). Cuando concluye, el bot envía al cliente AQUÍ con un
 * deep-link prellenado para que pague:
 *
 *   /checkout?tour=<slug>&fecha=YYYY-MM-DD&personas=<n>&nombre=<...>&tel=<...>&email=<...>
 *
 * Por eso esta página NO manda a WhatsApp: su única acción es cobrar.
 *
 * SEAM pago real (fase 2): reemplazar `pagar()` por un PaymentIntent de Stripe
 * (las deps @stripe/* ya están) creando el cobro desde el backend y confirmando
 * con <PaymentElement>. La forma del resumen no cambia.
 */
export default function CheckoutClient() {
  const searchParams = useSearchParams()

  const booking = useMemo(
    () => buildBooking(parseBookingParams((k) => searchParams.get(k))),
    [searchParams]
  )

  // Datos de contacto (prellenados por el bot vía query params).
  const [nombre, setNombre] = useState(booking.nombre)
  const [tel, setTel] = useState(booking.tel)
  const [email, setEmail] = useState(searchParams.get("email") ?? "")

  // Datos de pago (demo).
  const [cardName, setCardName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExp, setCardExp] = useState("")
  const [cardCvc, setCardCvc] = useState("")

  const [procesando, setProcesando] = useState(false)
  const [pagado, setPagado] = useState(false)

  const item = booking.item
  const total = booking.total
  const esVilla = booking.tipo === "villa"
  const cantidad = esVilla ? booking.noches : booking.personas

  if (!item) {
    return (
      <div className="content-container py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          No encontramos esa reserva
        </h1>
        <p className="mt-3 font-sans text-ink-muted">
          El enlace de pago está incompleto. Escribinos y te lo reenviamos.
        </p>
        <Link href="/#tours" className="btn-lime mt-6">
          Ver tours disponibles
        </Link>
      </div>
    )
  }

  const formatoTarjeta = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim()

  const formatoExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  const datosCompletos =
    cardName.trim() &&
    cardNumber.replace(/\s/g, "").length >= 15 &&
    cardExp.length === 5 &&
    cardCvc.length >= 3

  const pagar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datosCompletos || procesando) return
    setProcesando(true)
    // DEMO: simula el procesamiento del pago. (Reemplazar por Stripe.)
    window.setTimeout(() => {
      setProcesando(false)
      setPagado(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 1400)
  }

  // ── Estado de éxito ──────────────────────────────────────────────
  if (pagado) {
    return (
      <div className="content-container max-w-xl py-20 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-ink" aria-hidden>
            <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.42z" />
          </svg>
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">
          ¡Pago confirmado!
        </h1>
        <p className="mt-3 font-sans text-ink-muted">
          Tu reserva de <strong className="text-ink">{item.nombre}</strong>{" "}
          {esVilla
            ? `· ${cantidad} ${cantidad === 1 ? "noche" : "noches"}`
            : `· ${cantidad} ${cantidad === 1 ? "persona" : "personas"}`}
          {booking.fecha ? (
            <>
              {" · "}
              <span className="capitalize">
                {formatFechaLarga(booking.fecha)}
              </span>
            </>
          ) : null}{" "}
          quedó pagada.
          {email ? (
            <>
              {" "}
              Te enviamos el comprobante a{" "}
              <strong className="text-ink">{email}</strong>.
            </>
          ) : null}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-jungle-line bg-white px-5 py-2.5 font-sans text-sm font-bold text-ink">
          Total pagado: {formatUSD(total)}
        </div>
        <div className="mt-8">
          <Link href="/" className="btn-dark">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  // ── Página de pago ───────────────────────────────────────────────
  return (
    <div className="content-container grid grid-cols-1 gap-10 py-12 medium:grid-cols-[1fr_400px]">
      <form onSubmit={pagar} className="min-w-0">
        <h1 className="font-display text-3xl font-extrabold text-ink small:text-4xl">
          Finalizá tu pago
        </h1>
        <p className="mt-2 font-sans text-ink-muted">
          Ya coordinamos los detalles por WhatsApp. Completá el pago para
          confirmar tu lugar.
        </p>

        {/* Contacto */}
        <h2 className="mt-8 font-display text-lg font-extrabold text-ink">
          Datos de contacto
        </h2>
        <div className="mt-4 grid gap-5 small:grid-cols-2">
          <Field label="Nombre completo">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className={inputCls}
            />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input
              type="tel"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              placeholder="+506 8888-8888"
              className={inputCls}
            />
          </Field>
          <Field label="Correo (para el comprobante)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@correo.com"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Pago */}
        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">Pago</h2>
          <div className="flex items-center gap-1.5">
            {["Visa", "Mastercard", "American Express"].map((p) => (
              <span
                key={p}
                title={p}
                className="flex h-7 items-center justify-center rounded-md border border-jungle-line bg-white px-2"
              >
                <PaymentLogo name={p} />
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-5">
          <Field label="Nombre en la tarjeta">
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Como aparece en la tarjeta"
              className={inputCls}
            />
          </Field>
          <Field label="Número de tarjeta">
            <input
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatoTarjeta(e.target.value))}
              placeholder="1234 5678 9012 3456"
              className={inputCls}
            />
          </Field>
          <div className="grid gap-5 small:grid-cols-2">
            <Field label="Vencimiento">
              <input
                inputMode="numeric"
                value={cardExp}
                onChange={(e) => setCardExp(formatoExp(e.target.value))}
                placeholder="MM/AA"
                className={inputCls}
              />
            </Field>
            <Field label="CVC">
              <input
                inputMode="numeric"
                value={cardCvc}
                onChange={(e) =>
                  setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="123"
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={!datosCompletos || procesando}
          className="btn-dark mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {procesando ? "Procesando…" : `Pagar ${formatUSD(total)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 font-sans text-xs text-ink-faint">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-ink-faint" aria-hidden>
            <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
          Pago seguro y cifrado · Sin cargos ocultos
        </p>
      </form>

      {/* Resumen */}
      <aside className="medium:sticky medium:top-24 medium:self-start">
        <div className="overflow-hidden rounded-2xl border border-jungle-line/40 bg-jungle/30">
          <div className="relative aspect-[16/9]">
            <Image
              src={item.imagen}
              alt={item.nombre}
              fill
              sizes="400px"
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <p className="font-sans text-xs font-medium text-ink-faint">
              {item.ubicacion}
            </p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-ink">
              {item.nombre}
            </h2>

            <dl className="mt-5 space-y-3 font-sans text-sm">
              <Row
                k={esVilla ? "Entrada" : "Fecha"}
                v={booking.fecha ? formatFechaLarga(booking.fecha) : "Por definir"}
              />
              {esVilla ? (
                <Row k="Noches" v={String(booking.noches)} />
              ) : (
                <Row k="Personas" v={String(booking.personas)} />
              )}
              <Row
                k={`Precio por ${booking.unidad}`}
                v={formatUSD(booking.precioUnit)}
              />
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-jungle-line pt-5">
              <span className="font-sans text-sm font-medium text-ink-muted">
                Total
              </span>
              <span className="font-display text-2xl font-extrabold text-ink">
                {formatUSD(total)}
              </span>
            </div>
          </div>
        </div>
        <a
          href={whatsappLink(
            `Hola, tengo una duda con el pago de mi reserva de ${item.nombre}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center font-sans text-sm font-medium text-ink-muted hover:text-ink"
        >
          ¿Necesitás ayuda? Escribinos
        </a>
      </aside>
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-jungle-line bg-white px-4 py-3 font-sans text-sm font-medium text-ink placeholder:text-ink-faint outline-none focus:border-ink"

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-xs font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="capitalize text-ink">{v}</dd>
    </div>
  )
}
