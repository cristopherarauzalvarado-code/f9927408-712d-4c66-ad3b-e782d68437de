"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Tour } from "@lib/adventures/tours"
import { buildCheckoutHref, formatUSD } from "@lib/adventures/booking"
import {
  formatFechaLarga,
  fromISO,
  infoFecha,
  primeraFechaDisponible,
  startOfDay,
} from "@lib/adventures/availability"
import BookingCalendar from "@modules/adventures/booking-calendar"

export default function BookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter()
  const [fecha, setFecha] = useState("")
  const [cuposLibres, setCuposLibres] = useState(0)
  const [personas, setPersonas] = useState(2)

  // Preselección de la primera fecha disponible (solo en cliente: depende de "hoy").
  useEffect(() => {
    const hoy = startOfDay(new Date())
    const iso = primeraFechaDisponible(tour, hoy)
    if (iso) {
      setFecha(iso)
      setCuposLibres(infoFecha(tour, fromISO(iso), hoy).cuposLibres)
    }
  }, [tour])

  // Limitar personas a los cupos disponibles de la fecha elegida.
  const maxPersonas = Math.min(20, cuposLibres || 20)
  useEffect(() => {
    setPersonas((p) => Math.min(p, maxPersonas) || 1)
  }, [maxPersonas])

  const total = useMemo(
    () => tour.precioUSD * personas,
    [tour.precioUSD, personas]
  )

  function seleccionarFecha(iso: string, libres: number) {
    setFecha(iso)
    setCuposLibres(libres)
  }

  function reservar() {
    if (!fecha) return
    router.push(
      buildCheckoutHref({
        tour: tour.slug,
        fecha,
        personas: String(personas),
      })
    )
  }

  return (
    <div className="rounded-[24px] border border-jungle-line bg-white p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-between">
        <div>
          <span className="font-display text-3xl font-extrabold text-ink">
            {formatUSD(tour.precioUSD)}
          </span>
          <span className="ml-1 font-sans text-sm font-medium text-ink-faint">
            / persona
          </span>
        </div>
        <span className="rounded-full bg-lime px-3 py-1 font-sans text-xs font-bold text-ink">
          {tour.duracion}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {/* Calendario de reservas */}
        <div>
          <span className="mb-1.5 block font-sans text-xs font-bold text-ink-muted">
            Elegí la fecha de salida
          </span>
          <BookingCalendar
            tour={tour}
            value={fecha}
            onSelect={seleccionarFecha}
          />
          {fecha ? (
            <p className="mt-2 font-sans text-sm font-medium text-ink">
              <span className="capitalize">{formatFechaLarga(fecha)}</span>
              <span className="ml-1 text-ink-muted">
                · {cuposLibres} {cuposLibres === 1 ? "lugar" : "lugares"}{" "}
                {cuposLibres === 1 ? "disponible" : "disponibles"}
              </span>
            </p>
          ) : (
            <p className="mt-2 font-sans text-sm font-medium text-ink-muted">
              Seleccioná un día disponible en el calendario.
            </p>
          )}
        </div>

        {/* Personas */}
        <div className="block">
          <span className="mb-1.5 block font-sans text-xs font-bold text-ink-muted">
            Personas{" "}
            {fecha && (
              <span className="font-medium text-ink-faint">
                (máx. {maxPersonas})
              </span>
            )}
          </span>
          <div className="flex items-center justify-between rounded-xl border border-jungle-line bg-white px-4 py-2.5">
            <button
              type="button"
              onClick={() => setPersonas((p) => Math.max(1, p - 1))}
              aria-label="Quitar persona"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-lg text-ink transition-colors hover:border-ink hover:bg-[#F2F4F6]"
            >
              −
            </button>
            <span className="font-display text-base font-extrabold text-ink">
              {personas}
            </span>
            <button
              type="button"
              onClick={() => setPersonas((p) => Math.min(maxPersonas, p + 1))}
              disabled={personas >= maxPersonas}
              aria-label="Agregar persona"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-lg text-ink transition-colors hover:border-ink hover:bg-[#F2F4F6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-jungle-line pt-4">
        <span className="font-sans text-sm font-medium text-ink-muted">
          Total ({personas} {personas === 1 ? "persona" : "personas"})
        </span>
        <span className="font-display text-xl font-extrabold text-ink">
          {formatUSD(total)}
        </span>
      </div>

      <button
        type="button"
        onClick={reservar}
        disabled={!fecha}
        className="btn-dark mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuar reserva
      </button>
      <p className="mt-3 text-center font-sans text-xs font-medium text-ink-faint">
        Sin pago por ahora — confirmás los detalles en el siguiente paso.
      </p>
    </div>
  )
}
