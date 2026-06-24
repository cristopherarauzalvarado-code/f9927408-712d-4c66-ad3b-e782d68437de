import { getTourBySlug } from "./tours"
import { getVillaBySlug } from "./villas"

/**
 * Capa de reserva (booking) — fase demo.
 *
 * El checkout lee los query params y "inyecta" la reserva: resuelve el item
 * (tour o villa) desde los mocks y calcula el total.
 *
 * - Tour:  total = precio por persona × personas
 * - Villa: total = precio por noche × noches
 *
 * Deep-link del bot / widget:
 *   tour →  /checkout?tour=<slug>&fecha=&personas=&nombre=&tel=
 *   villa → /checkout?tipo=villa&villa=<slug>&fecha=&noches=&personas=&nombre=&tel=
 *
 * SEAM Medusa (fase 2): crear el carrito vía SDK con la línea correspondiente.
 */

export type BookingTipo = "tour" | "villa"

export type BookingParams = {
  tipo: BookingTipo
  tour: string
  villa: string
  fecha: string
  personas: string
  noches: string
  nombre: string
  tel: string
}

export type BookingItem = {
  slug: string
  nombre: string
  ubicacion: string
  imagen: string
}

export type BookingSummary = {
  tipo: BookingTipo
  item: BookingItem | null
  fecha: string
  personas: number
  noches: number
  precioUnit: number
  unidad: "persona" | "noche"
  total: number
  currency: "USD"
  nombre: string
  tel: string
}

/** Lee los parámetros crudos (de useSearchParams o URLSearchParams del servidor). */
export function parseBookingParams(
  get: (key: string) => string | null | undefined
): BookingParams {
  const villa = get("villa")?.toString() ?? ""
  const tipoRaw = get("tipo")?.toString()
  const tipo: BookingTipo = tipoRaw === "villa" || villa ? "villa" : "tour"
  return {
    tipo,
    tour: get("tour")?.toString() ?? "",
    villa,
    fecha: get("fecha")?.toString() ?? "",
    personas: get("personas")?.toString() ?? "",
    noches: get("noches")?.toString() ?? "",
    nombre: get("nombre")?.toString() ?? "",
    tel: get("tel")?.toString() ?? "",
  }
}

/** Construye el resumen normalizado de la reserva (tour o villa). */
export function buildBooking(params: BookingParams): BookingSummary {
  const personas = Math.max(1, parseInt(params.personas, 10) || 1)
  const noches = Math.max(1, parseInt(params.noches, 10) || 1)

  if (params.tipo === "villa") {
    const villa = params.villa ? getVillaBySlug(params.villa) ?? null : null
    const precioUnit = villa?.precioUSD ?? 0
    return {
      tipo: "villa",
      item: villa
        ? {
            slug: villa.slug,
            nombre: villa.nombre,
            ubicacion: villa.ubicacion,
            imagen: villa.imagen,
          }
        : null,
      fecha: params.fecha,
      personas,
      noches,
      precioUnit,
      unidad: "noche",
      total: precioUnit * noches,
      currency: "USD",
      nombre: params.nombre,
      tel: params.tel,
    }
  }

  const tour = params.tour ? getTourBySlug(params.tour) ?? null : null
  const precioUnit = tour?.precioUSD ?? 0
  return {
    tipo: "tour",
    item: tour
      ? {
          slug: tour.slug,
          nombre: tour.nombre,
          ubicacion: tour.ubicacion,
          imagen: tour.imagen,
        }
      : null,
    fecha: params.fecha,
    personas,
    noches,
    precioUnit,
    unidad: "persona",
    total: precioUnit * personas,
    currency: "USD",
    nombre: params.nombre,
    tel: params.tel,
  }
}

/** Formatea un monto en USD para mostrar. */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Construye el querystring del checkout (tour o villa). */
export function buildCheckoutHref(
  params: Partial<BookingParams> & { tipo?: BookingTipo }
): string {
  const qs = new URLSearchParams()
  if (params.tipo) qs.set("tipo", params.tipo)
  if (params.tour) qs.set("tour", params.tour)
  if (params.villa) qs.set("villa", params.villa)
  if (params.fecha) qs.set("fecha", params.fecha)
  if (params.noches) qs.set("noches", params.noches)
  if (params.personas) qs.set("personas", params.personas)
  if (params.nombre) qs.set("nombre", params.nombre)
  if (params.tel) qs.set("tel", params.tel)
  return `/checkout?${qs.toString()}`
}
