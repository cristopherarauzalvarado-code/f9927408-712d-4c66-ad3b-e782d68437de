import type { Tour } from "./tours"

/**
 * Disponibilidad y cupos de reserva — fase demo.
 *
 * Cada tour define (o hereda por categoría) un patrón de salida y un cupo por fecha.
 * Las fechas se calculan SIEMPRE relativas a "hoy", así el calendario nunca muestra
 * salidas vencidas. Los cupos ocupados son deterministas (hash de slug+fecha) para
 * que servidor y cliente coincidan (sin desajustes de hidratación) y para que el
 * calendario se vea "vivo" en la demo.
 *
 * SEAM Medusa (fase 2): `getDisponibilidad` leería el patrón real desde el producto,
 * y `cuposLibres` consultaría inventario/variantes en lugar del hash determinista.
 */

export type Disponibilidad =
  | {
      patron: "diario"
      anticipacionDias: number
      cupoPorFecha: number
    }
  | {
      patron: "diasSemana"
      // 0=domingo … 6=sábado
      diasSemana: number[]
      anticipacionDias: number
      cupoPorFecha: number
    }
  | {
      patron: "salidasFijas"
      // Salidas cada `cadaSemanas` en el día de semana indicado.
      diaSemana: number
      cadaSemanas: number
      anticipacionDias: number
      cupoPorFecha: number
    }

/** Patrón por defecto según la categoría del tour (cada tour puede sobreescribirlo). */
export function getDisponibilidad(tour: Tour): Disponibilidad {
  if (tour.disponibilidad) return tour.disponibilidad

  switch (tour.categoria) {
    case "buceo":
      // Expediciones liveaboard: salidas quincenales, cupo reducido, mucha anticipación.
      return {
        patron: "salidasFijas",
        diaSemana: 6,
        cadaSemanas: 3,
        anticipacionDias: 14,
        cupoPorFecha: 12,
      }
    case "internacional":
      // Viajes multidía coordinados: salidas cada 2 semanas.
      return {
        patron: "salidasFijas",
        diaSemana: 5,
        cadaSemanas: 2,
        anticipacionDias: 21,
        cupoPorFecha: 16,
      }
    default:
      // Tours nacionales: salidas lun / mié / vie / sáb con 2 días de anticipación.
      return {
        patron: "diasSemana",
        diasSemana: [1, 3, 5, 6],
        anticipacionDias: 2,
        cupoPorFecha: 14,
      }
  }
}

// ───────────────────────── utilidades de fecha (hora local) ─────────────────────────

const pad = (n: number) => String(n).padStart(2, "0")

/** Date → "YYYY-MM-DD" en hora local (evita el corrimiento de toISOString/UTC). */
export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "YYYY-MM-DD" → Date local a medianoche. */
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, n: number): Date {
  const r = startOfDay(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Índice de semana desde un ancla fija (lunes 1970-01-05) para espaciar salidas. */
function weekIndex(d: Date): number {
  const ancla = Date.UTC(1970, 0, 5)
  const dia = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor((dia - ancla) / (7 * 24 * 60 * 60 * 1000))
}

// ───────────────────────── cupos deterministas ─────────────────────────

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

/** Lugares ya reservados (determinista) para una fecha dada. */
function reservados(tour: Tour, iso: string, cupo: number): number {
  return hash(`${tour.slug}|${iso}`) % (cupo + 1)
}

// ───────────────────────── estado por fecha ─────────────────────────

export type EstadoFecha = "pasado" | "noDisponible" | "lleno" | "disponible"

export type InfoFecha = {
  iso: string
  estado: EstadoFecha
  cupoTotal: number
  cuposLibres: number
}

/** ¿La fecha cae en el patrón de salida del tour (ignorando anticipación)? */
function esSalida(disp: Disponibilidad, d: Date): boolean {
  switch (disp.patron) {
    case "diario":
      return true
    case "diasSemana":
      return disp.diasSemana.includes(d.getDay())
    case "salidasFijas":
      return (
        d.getDay() === disp.diaSemana && weekIndex(d) % disp.cadaSemanas === 0
      )
  }
}

/** Estado completo de una fecha para un tour, respecto de "hoy". */
export function infoFecha(tour: Tour, d: Date, hoy: Date): InfoFecha {
  const disp = getDisponibilidad(tour)
  const iso = toISO(d)
  const cupoTotal = disp.cupoPorFecha
  const dia = startOfDay(d)
  const minimo = addDays(hoy, disp.anticipacionDias)

  if (dia.getTime() < startOfDay(hoy).getTime()) {
    return { iso, estado: "pasado", cupoTotal, cuposLibres: 0 }
  }
  if (!esSalida(disp, dia) || dia.getTime() < minimo.getTime()) {
    return { iso, estado: "noDisponible", cupoTotal, cuposLibres: 0 }
  }

  const libres = cupoTotal - reservados(tour, iso, cupoTotal)
  return {
    iso,
    estado: libres <= 0 ? "lleno" : "disponible",
    cupoTotal,
    cuposLibres: Math.max(0, libres),
  }
}

/** Primera fecha reservable a partir de `desde` (para preseleccionar en el widget). */
export function primeraFechaDisponible(tour: Tour, desde: Date): string | null {
  for (let i = 0; i < 120; i++) {
    const d = addDays(desde, i)
    if (infoFecha(tour, d, desde).estado === "disponible") return toISO(d)
  }
  return null
}

// ───────────────────────── matriz del mes ─────────────────────────

export const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export type CeldaMes = { fecha: Date; enMes: boolean }

/** Devuelve 6 semanas (semana inicia lunes) cubriendo el mes dado. */
export function matrizMes(year: number, month: number): CeldaMes[][] {
  const primero = new Date(year, month, 1)
  // getDay: 0=dom..6=sáb → convertir a lunes=0
  const offset = (primero.getDay() + 6) % 7
  const inicio = addDays(primero, -offset)

  const semanas: CeldaMes[][] = []
  let cursor = inicio
  for (let s = 0; s < 6; s++) {
    const semana: CeldaMes[] = []
    for (let d = 0; d < 7; d++) {
      semana.push({ fecha: cursor, enMes: cursor.getMonth() === month })
      cursor = addDays(cursor, 1)
    }
    semanas.push(semana)
  }
  return semanas
}

/** Formato largo en español: "sábado 12 de julio de 2026". */
export function formatFechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fromISO(iso))
}

// ───────────────────────── disponibilidad de villas (por noche) ─────────────────────────

export type EstadoNoche = "pasado" | "noDisponible" | "ocupada" | "disponible"

/**
 * Disponibilidad de una noche para una villa (demo).
 * Disponible cualquier noche futura con anticipación mínima; algunas noches se
 * marcan "ocupada" de forma determinista (hash) para que el calendario se vea real.
 */
export function villaEstadoNoche(
  slug: string,
  d: Date,
  hoy: Date,
  anticipacionDias = 1
): EstadoNoche {
  const dia = startOfDay(d)
  if (dia.getTime() < startOfDay(hoy).getTime()) return "pasado"
  if (dia.getTime() < addDays(hoy, anticipacionDias).getTime())
    return "noDisponible"
  // ~1 de cada 9 noches ocupada (determinista por villa + fecha)
  if (hash(`${slug}|villa|${toISO(d)}`) % 9 === 0) return "ocupada"
  return "disponible"
}

/** Primera noche reservable a partir de `desde`. */
export function primeraNocheVilla(
  slug: string,
  desde: Date,
  anticipacionDias = 1
): string | null {
  for (let i = 0; i < 120; i++) {
    const d = addDays(desde, i)
    if (villaEstadoNoche(slug, d, desde, anticipacionDias) === "disponible")
      return toISO(d)
  }
  return null
}
