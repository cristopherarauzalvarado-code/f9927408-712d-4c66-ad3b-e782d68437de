"use client"

import clsx from "clsx"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Villa } from "@lib/adventures/villas"
import { buildCheckoutHref, formatUSD } from "@lib/adventures/booking"
import {
  DIAS_SEMANA,
  MESES,
  formatFechaLarga,
  matrizMes,
  primeraNocheVilla,
  startOfDay,
  villaEstadoNoche,
} from "@lib/adventures/availability"

export default function VillaBooking({ villa }: { villa: Villa }) {
  const router = useRouter()
  const [hoy, setHoy] = useState<Date | null>(null)
  const [view, setView] = useState<{ y: number; m: number } | null>(null)
  const [fecha, setFecha] = useState("")
  const [noches, setNoches] = useState(villa.minNoches)
  const [huespedes, setHuespedes] = useState(Math.min(2, villa.capacidadMax))

  // Depende de "hoy" → solo en cliente (sin desajuste de hidratación).
  useEffect(() => {
    const d = startOfDay(new Date())
    setHoy(d)
    setView({ y: d.getFullYear(), m: d.getMonth() })
    const iso = primeraNocheVilla(villa.slug, d)
    if (iso) setFecha(iso)
  }, [villa.slug])

  const total = villa.precioUSD * noches

  const reservar = () => {
    if (!fecha) return
    router.push(
      buildCheckoutHref({
        tipo: "villa",
        villa: villa.slug,
        fecha,
        noches: String(noches),
        personas: String(huespedes),
      })
    )
  }

  return (
    <div className="rounded-[24px] border border-jungle-line bg-white p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-between">
        <div>
          <span className="font-display text-3xl font-extrabold text-ink">
            {formatUSD(villa.precioUSD)}
          </span>
          <span className="ml-1 font-sans text-sm font-medium text-ink-faint">
            / noche
          </span>
        </div>
        <span className="rounded-full bg-lime px-3 py-1 font-sans text-xs font-bold text-ink">
          {villa.capacidad}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <span className="mb-1.5 block font-sans text-xs font-bold text-ink-muted">
            Elegí tu fecha de entrada
          </span>
          {!hoy || !view ? (
            <div className="h-[330px] animate-pulse rounded-2xl border border-jungle-line bg-[#F2F4F6]" />
          ) : (
            <Calendario
              slug={villa.slug}
              hoy={hoy}
              view={view}
              setView={setView}
              value={fecha}
              onSelect={setFecha}
            />
          )}
          {fecha && (
            <p className="mt-2 font-sans text-sm font-medium text-ink">
              Entrada: <span className="capitalize">{formatFechaLarga(fecha)}</span>
            </p>
          )}
        </div>

        <Stepper
          label="Noches"
          value={noches}
          min={villa.minNoches}
          max={30}
          onChange={setNoches}
          hint={`mín. ${villa.minNoches}`}
        />
        <Stepper
          label="Huéspedes"
          value={huespedes}
          min={1}
          max={villa.capacidadMax}
          onChange={setHuespedes}
          hint={`máx. ${villa.capacidadMax}`}
        />
      </div>

      <div className="mt-6 space-y-2 border-t border-jungle-line pt-4 font-sans text-sm">
        <div className="flex items-center justify-between text-ink-muted">
          <span>
            {formatUSD(villa.precioUSD)} × {noches}{" "}
            {noches === 1 ? "noche" : "noches"}
          </span>
          <span className="text-ink">{formatUSD(total)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-jungle-line pt-2">
          <span className="font-medium text-ink-muted">Total</span>
          <span className="font-display text-xl font-extrabold text-ink">
            {formatUSD(total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={reservar}
        disabled={!fecha}
        className="btn-dark mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuar al pago
      </button>
      <p className="mt-3 text-center font-sans text-xs font-medium text-ink-faint">
        Confirmás los datos y pagás en el siguiente paso.
      </p>
    </div>
  )
}

function Calendario({
  slug,
  hoy,
  view,
  setView,
  value,
  onSelect,
}: {
  slug: string
  hoy: Date
  view: { y: number; m: number }
  setView: (v: { y: number; m: number }) => void
  value: string
  onSelect: (iso: string) => void
}) {
  const semanas = matrizMes(view.y, view.m)
  const enMesActual = view.y === hoy.getFullYear() && view.m === hoy.getMonth()
  const irMes = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div className="rounded-2xl border border-jungle-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => irMes(-1)}
          disabled={enMesActual}
          aria-label="Mes anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Chevron dir="left" />
        </button>
        <span className="font-display text-sm font-extrabold text-ink">
          {MESES[view.m]} {view.y}
        </span>
        <button
          type="button"
          onClick={() => irMes(1)}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-ink transition-colors hover:border-ink"
        >
          <Chevron dir="right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <span
            key={d}
            className="py-1 text-center font-sans text-[11px] font-bold uppercase tracking-wide text-ink-faint"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {semanas.flat().map(({ fecha, enMes }) => {
          const estado = villaEstadoNoche(slug, fecha, hoy)
          const iso = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
          ).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
          const seleccionado = iso === value
          const clickable = estado === "disponible"
          const ocupada = estado === "ocupada"
          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              onClick={() => onSelect(iso)}
              title={ocupada ? "Ocupada" : clickable ? "Disponible" : ""}
              className={clsx(
                "flex aspect-square items-center justify-center rounded-xl font-sans text-sm transition-colors",
                !enMes && "opacity-30",
                seleccionado && "bg-lime font-extrabold text-ink ring-2 ring-ink",
                !seleccionado && clickable && "font-bold text-ink hover:bg-[#F2F4F6]",
                !seleccionado &&
                  ocupada &&
                  "cursor-not-allowed text-ink-faint line-through",
                (estado === "pasado" || estado === "noDisponible") &&
                  "cursor-not-allowed text-ink-faint/50"
              )}
            >
              {fecha.getDate()}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-jungle-line px-1 pt-3 font-sans text-[11px] font-medium text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#3DC262]" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint line-through">12</span>
          Ocupada
        </span>
      </div>
    </div>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  hint?: string
}) {
  return (
    <div>
      <span className="mb-1.5 block font-sans text-xs font-bold text-ink-muted">
        {label}{" "}
        {hint && <span className="font-medium text-ink-faint">({hint})</span>}
      </span>
      <div className="flex items-center justify-between rounded-xl border border-jungle-line bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Quitar ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-lg text-ink transition-colors hover:border-ink hover:bg-[#F2F4F6]"
        >
          −
        </button>
        <span className="font-display text-base font-extrabold text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Agregar ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-jungle-line text-lg text-ink transition-colors hover:border-ink hover:bg-[#F2F4F6] disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
