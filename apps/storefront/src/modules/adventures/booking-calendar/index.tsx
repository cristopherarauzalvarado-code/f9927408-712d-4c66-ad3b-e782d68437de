"use client"

import clsx from "clsx"
import { useEffect, useState } from "react"
import type { Tour } from "@lib/adventures/tours"
import {
  DIAS_SEMANA,
  MESES,
  addDays,
  infoFecha,
  matrizMes,
  startOfDay,
  toISO,
} from "@lib/adventures/availability"

type Props = {
  tour: Tour
  value: string
  onSelect: (iso: string, cuposLibres: number) => void
}

export default function BookingCalendar({ tour, value, onSelect }: Props) {
  // Todo el cálculo depende de "hoy" → se hace solo en cliente para no romper
  // la hidratación. Hasta montar, mostramos un esqueleto.
  const [hoy, setHoy] = useState<Date | null>(null)
  const [view, setView] = useState<{ y: number; m: number } | null>(null)

  useEffect(() => {
    const d = startOfDay(new Date())
    setHoy(d)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }, [])

  if (!hoy || !view) {
    return (
      <div className="h-[340px] animate-pulse rounded-2xl border border-jungle-line bg-[#F2F4F6]" />
    )
  }

  const semanas = matrizMes(view.y, view.m)
  const enMesActual = view.y === hoy.getFullYear() && view.m === hoy.getMonth()

  const irMes = (delta: number) =>
    setView((v) => {
      if (!v) return v
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  return (
    <div className="rounded-2xl border border-jungle-line bg-white p-3">
      {/* Encabezado de navegación */}
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

      {/* Días de la semana */}
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

      {/* Celdas */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {semanas.flat().map(({ fecha, enMes }) => {
          const info = infoFecha(tour, fecha, hoy)
          const iso = info.iso
          const seleccionado = iso === value
          const clickable = info.estado === "disponible"
          const lleno = info.estado === "lleno"
          const bajo = clickable && info.cuposLibres <= 4

          return (
            <button
              key={iso}
              type="button"
              disabled={!clickable}
              onClick={() => onSelect(iso, info.cuposLibres)}
              title={
                clickable
                  ? `${info.cuposLibres} ${info.cuposLibres === 1 ? "lugar" : "lugares"} disponibles`
                  : lleno
                    ? "Salida llena"
                    : "Sin salida"
              }
              className={clsx(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl font-sans text-sm transition-colors",
                !enMes && "opacity-30",
                seleccionado &&
                  "bg-lime font-extrabold text-ink ring-2 ring-ink",
                !seleccionado &&
                  clickable &&
                  "font-bold text-ink hover:bg-[#F2F4F6]",
                !seleccionado &&
                  lleno &&
                  "cursor-not-allowed text-ink-faint line-through",
                !seleccionado &&
                  info.estado === "noDisponible" &&
                  "cursor-not-allowed text-ink-faint/60",
                info.estado === "pasado" && "cursor-not-allowed text-ink-faint/40"
              )}
            >
              <span>{fecha.getDate()}</span>
              {/* Indicador de cupo */}
              {!seleccionado && clickable && (
                <span
                  className={clsx(
                    "absolute bottom-1.5 h-1 w-1 rounded-full",
                    bajo ? "bg-sand" : "bg-[#3DC262]"
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-jungle-line px-1 pt-3 font-sans text-[11px] font-medium text-ink-muted">
        <Legend dot="bg-[#3DC262]" label="Disponible" />
        <Legend dot="bg-sand" label="Últimos lugares" />
        <span className="flex items-center gap-1.5">
          <span className="text-ink-faint line-through">12</span>
          Lleno / sin salida
        </span>
      </div>
    </div>
  )
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={clsx("h-1.5 w-1.5 rounded-full", dot)} />
      {label}
    </span>
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
