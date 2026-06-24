/**
 * Configuración de marca y contacto de Costarican Adventures.
 * Datos reales tomados del sitio vigente (costarican-adventures.com).
 *
 * Punto único de verdad para la demo: nav, footer, WhatsApp flotante y checkout
 * leen de aquí. El número de WhatsApp también vive en `.env.local`
 * (NEXT_PUBLIC_SUPPORT_WHATSAPP) para deploys, pero para la demo usamos esta constante.
 */
export const site = {
  name: "Costarican Adventures",
  tagline: "Aventuras reales en Costa Rica desde 2007",
  foundedYear: 2007,
  whatsapp: {
    // Solo dígitos, formato internacional para enlaces wa.me
    number: "50686808236",
    display: "+506 8680-8236",
  },
  email: "amigos@costarican-adventures.com",
  address: "Walmart Heredia, 500m norte y 75m este",
  departure: "Salidas desde el centro de San José",
  hours: "6:00 a.m. – 4:00 p.m.",
  payments: ["Visa", "Mastercard", "American Express", "Transferencia"],
} as const

/** Construye un enlace wa.me con mensaje prellenado. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${site.whatsapp.number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

/** Categorías para el filtro del home (incluye "Todos"). */
export const categories = [
  { slug: "todos", label: "Todos" },
  { slug: "tours-nacionales", label: "Tours nacionales" },
  { slug: "buceo", label: "Buceo" },
  { slug: "villas", label: "Villas" },
  { slug: "internacional", label: "Internacional" },
] as const

export type CategorySlug = (typeof categories)[number]["slug"]
