/**
 * Villas y hospedaje de Costarican Adventures.
 * Nombres, precios, imágenes y descripciones reales del sitio del cliente.
 * Precio por noche en USD.
 */

export type Villa = {
  slug: string
  nombre: string
  ubicacion: string
  precioUSD: number
  unidad: string
  capacidad: string
  /** Capacidad máxima en huéspedes (para el selector de reserva). */
  capacidadMax: number
  /** Mínimo de noches por reserva. */
  minNoches: number
  resumen: string
  /** Descripción real (del sitio del cliente), para mostrar como en la página vieja. */
  descripcion: string
  amenidades: string[]
  imagen: string
  /** Galería (fotos reales); la primera suele ser la principal. */
  galeria: string[]
}

export const villas: Villa[] = [
  {
    slug: "villas-puerto-viejo",
    nombre: "Villas de Alquiler Equipadas — Puerto Viejo",
    ubicacion: "Puerto Viejo, Limón",
    precioUSD: 85,
    unidad: "noche",
    capacidad: "2–4 personas",
    resumen: "Piscina y vista al mar, a 5 min del centro. $85 (2p) · $140 (4p).",
    descripcion:
      "Nuestras villas de alquiler equipadas cuentan con todas las comodidades: abanicos, tina en el baño, TV con cable, una cama matrimonial y un camarote individual. La cocina está completamente equipada con refrigeradora, cocina, microondas y todos los utensilios básicos. Además, ofrecemos piscina y una vista espectacular al mar. Estamos ubicados a solo 5 minutos en carro del centro de Puerto Viejo, subiendo 600 metros por una calle de lastre. El precio por noche es de $85 para dos personas y $140 para cuatro personas.",
    amenidades: [
      "Piscina",
      "Vista al mar",
      "Cocina equipada",
      "Cable TV",
      "Abanicos",
    ],
    imagen: "/villas/villas-puerto-viejo.jpg",
    capacidadMax: 4,
    minNoches: 2,
    galeria: [
      "/villas/villas-puerto-viejo.jpg",
      "/villas/pv-2.jpg",
      "/villas/pv-3.jpg",
    ],
  },
  {
    slug: "casa-de-campo-fortuna",
    nombre: "Casa de Campo en Fortuna — Los Laureles",
    ubicacion: "La Fortuna, San Carlos",
    precioUSD: 130,
    unidad: "noche",
    capacidad: "Hasta 9 personas",
    resumen:
      "Casa de campo con 3 dormitorios, A/C y terraza con mesa de pool. Para 9 personas.",
    descripcion:
      "Casa de campo Los Laureles: casa con 3 dormitorios, baño propio, cocina equipada y aire acondicionado. Cuenta con una terraza con mesa de pool y capacidad para 9 personas. Parqueo y wifi gratis. Ideal para grupos y familias que visitan La Fortuna y el Volcán Arenal.",
    amenidades: [
      "3 dormitorios",
      "Aire acondicionado",
      "Cocina equipada",
      "Terraza + mesa de pool",
      "Parqueo",
      "Wifi gratis",
    ],
    imagen: "/villas/casa-de-campo-fortuna.jpg",
    capacidadMax: 9,
    minNoches: 2,
    galeria: [
      "/villas/casa-de-campo-fortuna.jpg",
      "/villas/fortuna-2.jpg",
      "/villas/fortuna-3.jpg",
    ],
  },
  {
    slug: "casa-luna-llena",
    nombre: "Casa Luna Llena",
    ubicacion: "Costa Rica",
    precioUSD: 100,
    unidad: "noche",
    capacidad: "Hasta 6 personas",
    resumen: "Casa de alquiler totalmente equipada, ideal para grupos y familias.",
    descripcion:
      "Casa de alquiler totalmente equipada, ideal para grupos y familias. Cocina completa con refrigeradora, cocina y utensilios básicos, dormitorios cómodos, baño y todas las comodidades para que solo te preocupes por disfrutar tu aventura en Costa Rica.",
    amenidades: ["Cocina equipada", "Varios dormitorios", "Wifi", "Para grupos"],
    imagen: "/villas/casa-luna-llena.jpg",
    capacidadMax: 6,
    minNoches: 2,
    galeria: [
      "/villas/casa-luna-llena.jpg",
      "/villas/luna-2.jpg",
      "/villas/luna-3.jpg",
    ],
  },
  {
    slug: "apartamento-venus",
    nombre: "Apartamento Venus",
    ubicacion: "Costa Rica",
    precioUSD: 65,
    unidad: "noche",
    capacidad: "2 personas",
    resumen: "Apartamento equipado y acogedor, perfecto para parejas.",
    descripcion:
      "Apartamento de alquiler equipado y acogedor, perfecto para parejas. Cuenta con cocina con lo básico, baño privado y las comodidades necesarias para una estadía cómoda mientras explorás los tours y destinos de Costa Rica.",
    amenidades: ["Cocina", "Baño privado", "Wifi", "Para parejas"],
    imagen: "/villas/apartamento-venus.jpg",
    capacidadMax: 2,
    minNoches: 1,
    galeria: [
      "/villas/apartamento-venus.jpg",
      "/villas/venus-2.jpg",
      "/villas/venus-3.jpg",
    ],
  },
]

export function getVillaBySlug(slug: string): Villa | undefined {
  return villas.find((v) => v.slug === slug)
}

export function getVillaSlugs(): string[] {
  return villas.map((v) => v.slug)
}
