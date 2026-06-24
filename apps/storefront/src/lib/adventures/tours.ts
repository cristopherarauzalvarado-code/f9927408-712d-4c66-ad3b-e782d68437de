import type { CategorySlug } from "./site"
import type { Disponibilidad } from "./availability"

/**
 * Datos mock-auténticos de tours para la fase demo.
 *
 * Nombres, precios, inclusiones y contacto provienen del sitio vigente del cliente
 * (costarican-adventures.com) y de la lista de productos acordada. Las imágenes son
 * placeholders de Unsplash (paisajes de CR) hasta recibir las fotos reales — el seam
 * está centralizado aquí: cambiar la URL en `imagen`/`galeria` actualiza toda la UI.
 *
 * Precios en USD (estándar del turismo internacional). El precio es por persona,
 * salvo `unidad` cuando aplica (p. ej. villas por noche — ver villas.ts).
 */

export type ItinerarioPaso = {
  hora?: string
  titulo: string
  detalle: string
}

export type Tour = {
  slug: string
  nombre: string
  categoria: Exclude<CategorySlug, "todos" | "villas">
  precioUSD: number
  duracion: string
  grupo: string
  ubicacion: string
  resumen: string
  descripcion: string
  imagen: string
  galeria: string[]
  itinerario: ItinerarioPaso[]
  incluye: string[]
  noIncluye: string[]
  rating: number
  reviews: number
  destacado?: boolean
  /** Regla de disponibilidad propia; si se omite, se hereda por categoría. */
  disponibilidad?: Disponibilidad
}

const INCLUYE_BASE = [
  "Transporte turístico desde San José",
  "Guía local certificado",
  "Desayuno y almuerzo típico",
  "Entradas a parques y reservas",
]

const NO_INCLUYE_BASE = [
  "Comidas y bebidas extra",
  "Gastos médicos especiales",
  "Artículos personales y propinas",
]

export const tours: Tour[] = [
  {
    slug: "bajos-del-toro",
    nombre: "Catarata Bajos del Toro",
    categoria: "tours-nacionales",
    precioUSD: 135,
    duracion: "1 día",
    grupo: "Grupo pequeño",
    ubicacion: "Bajos del Toro, Alajuela",
    resumen:
      "Descenso a una catarata escondida en el cráter de un volcán extinto, entre bosque nuboso.",
    descripcion:
      "Una de las cataratas más espectaculares del país, oculta dentro de un antiguo cráter. Bajamos por un sendero entre bosque nuboso hasta la base de la caída de 90 metros. Incluye transporte, desayuno y almuerzo en la zona. Salida temprano desde San José.",
    imagen: "/tours/bajos-del-toro.jpg",
    galeria: ["/tours/bajos-del-toro.jpg", "/tours/bajos-2.jpg", "/tours/bajos-3.jpg"],
    itinerario: [
      { hora: "6:00 a.m.", titulo: "Salida de San José", detalle: "Recogida en el punto acordado y café de bienvenida en ruta." },
      { hora: "8:30 a.m.", titulo: "Desayuno típico", detalle: "Gallo pinto y fruta fresca cerca de Bajos del Toro." },
      { hora: "9:30 a.m.", titulo: "Descenso a la catarata", detalle: "Caminata guiada al cráter y tiempo en la base de la caída." },
      { hora: "1:00 p.m.", titulo: "Almuerzo en la zona", detalle: "Comida típica costarricense." },
      { hora: "4:00 p.m.", titulo: "Regreso", detalle: "Retorno a San José." },
    ],
    incluye: INCLUYE_BASE,
    noIncluye: NO_INCLUYE_BASE,
    rating: 4.9,
    reviews: 128,
    destacado: true,
  },
  {
    slug: "rincon-de-la-vieja",
    nombre: "Rincón de la Vieja — Catarata La Leona",
    categoria: "tours-nacionales",
    precioUSD: 79,
    duracion: "1 día",
    grupo: "Grupo pequeño",
    ubicacion: "Parque Nacional Rincón de la Vieja, Guanacaste",
    resumen:
      "Volcán activo, fumarolas, pailas de barro y la turquesa Catarata La Leona.",
    descripcion:
      "Recorremos los senderos del volcán Rincón de la Vieja entre fumarolas y pailas de barro hirviente, y caminamos hasta la Catarata La Leona, de aguas turquesa por sus minerales. Aventura geotérmica única en Guanacaste.",
    imagen: "/tours/catarata-la-leona.jpg",
    galeria: ["/tours/catarata-la-leona.jpg", "/tours/rincon-2.jpg", "/tours/rincon-3.jpg"],
    itinerario: [
      { hora: "6:00 a.m.", titulo: "Salida de San José", detalle: "Viaje hacia Guanacaste con paradas técnicas." },
      { titulo: "Sendero geotérmico", detalle: "Fumarolas, pailas de barro y mirador del volcán." },
      { titulo: "Catarata La Leona", detalle: "Caminata y baño en pozas de agua turquesa." },
      { titulo: "Almuerzo y regreso", detalle: "Comida típica y retorno a San José." },
    ],
    incluye: INCLUYE_BASE,
    noIncluye: NO_INCLUYE_BASE,
    rating: 4.8,
    reviews: 96,
    destacado: true,
  },
  {
    slug: "corcovado",
    nombre: "Parque Nacional Corcovado",
    categoria: "tours-nacionales",
    precioUSD: 185,
    duracion: "1 día",
    grupo: "Grupo pequeño",
    ubicacion: "Península de Osa, Puntarenas",
    resumen:
      'El lugar "más intenso biológicamente del planeta": fauna salvaje en estado puro.',
    descripcion:
      "Corcovado protege la mayor porción de bosque húmedo tropical del Pacífico centroamericano. Navegamos hasta la estación, y con guía avistamos monos, tapires, guacamayas y, con suerte, felinos. Una inmersión total en la biodiversidad de Costa Rica.",
    imagen: "/tours/corcovado.jpg",
    galeria: ["/tours/corcovado.jpg", "/tours/corcovado-2.jpg", "/tours/corcovado-3.jpg"],
    itinerario: [
      { hora: "5:30 a.m.", titulo: "Salida de San José", detalle: "Traslado hacia la Península de Osa." },
      { titulo: "Navegación a la estación", detalle: "Entrada al parque por bote." },
      { titulo: "Caminata guiada", detalle: "Avistamiento de fauna con guía naturalista." },
      { titulo: "Almuerzo y regreso", detalle: "Comida típica y retorno." },
    ],
    incluye: INCLUYE_BASE,
    noIncluye: NO_INCLUYE_BASE,
    rating: 4.9,
    reviews: 74,
  },
  {
    slug: "chirripo",
    nombre: "Cerro Chirripó — Cumbre",
    categoria: "tours-nacionales",
    precioUSD: 245,
    duracion: "2 días / 1 noche",
    grupo: "Grupo pequeño",
    ubicacion: "Parque Nacional Chirripó, San José",
    resumen:
      "Ascenso al punto más alto de Costa Rica (3.820 m) para ver dos océanos al amanecer.",
    descripcion:
      "El reto de montaña más emblemático del país. Subimos hasta el albergue base, descansamos y de madrugada coronamos los 3.820 m del Cerro Chirripó para ver, en días claros, el Pacífico y el Caribe a la vez. Incluye transporte, guía, hospedaje de montaña y alimentación.",
    imagen: "/tours/chirripo.jpg",
    galeria: ["/tours/chirripo.jpg", "/tours/chirripo-2.jpg", "/tours/chirripo-3.jpg"],
    itinerario: [
      { hora: "Día 1 · 4:00 a.m.", titulo: "Salida y ascenso", detalle: "Traslado a San Gerardo de Rivas e inicio de la subida al albergue." },
      { hora: "Día 1 · tarde", titulo: "Albergue base", detalle: "Descanso, cena y preparación para la cumbre." },
      { hora: "Día 2 · 3:00 a.m.", titulo: "Cumbre al amanecer", detalle: "Ascenso final para ver el amanecer entre dos océanos." },
      { hora: "Día 2 · tarde", titulo: "Descenso y regreso", detalle: "Bajada y retorno a San José." },
    ],
    incluye: [
      "Transporte turístico desde San José",
      "Guía de montaña certificado",
      "Hospedaje en albergue de montaña",
      "Alimentación completa (2 días)",
      "Entradas al parque",
    ],
    noIncluye: ["Equipo personal de montaña", "Gastos médicos especiales", "Propinas"],
    rating: 5.0,
    reviews: 52,
  },
  {
    slug: "catarata-del-toro",
    nombre: "Catarata del Toro",
    categoria: "tours-nacionales",
    precioUSD: 120,
    duracion: "1 día",
    grupo: "Grupo pequeño",
    ubicacion: "Bajos del Toro, Alajuela",
    resumen:
      "Una caída de 90 metros dentro del cráter de un volcán extinto rodeada de jardines.",
    descripcion:
      "Tour de un día a la imponente Catarata del Toro. Desayuno frío en ruta, entrada al parque, descenso organizado hasta la base de la catarata y almuerzo típico. Naturaleza, colibríes y bosque nuboso.",
    imagen: "/tours/catarata-del-toro.jpg",
    galeria: ["/tours/catarata-del-toro.jpg", "/tours/catarata-del-toro-2.jpg"],
    itinerario: [
      { hora: "6:30 a.m.", titulo: "Salida de San José", detalle: "Transporte turístico y desayuno frío en ruta." },
      { titulo: "Entrada al parque", detalle: "Jardines, colibríes y miradores." },
      { titulo: "Descenso a la catarata", detalle: "Bajada organizada hasta la base de la caída." },
      { titulo: "Almuerzo típico y regreso", detalle: "Comida local y retorno a San José." },
    ],
    incluye: INCLUYE_BASE,
    noIncluye: NO_INCLUYE_BASE,
    rating: 4.8,
    reviews: 110,
  },
  {
    slug: "guanacaste-playas-pueblos",
    nombre: "Playas y Pueblos de Guanacaste",
    categoria: "tours-nacionales",
    precioUSD: 100,
    duracion: "3 horas",
    grupo: "Privado / grupo",
    ubicacion: "Guanacaste",
    resumen:
      "Recorrido por las mejores playas y pueblos típicos de la costa guanacasteca.",
    descripcion:
      "Un recorrido relajado por playas de arena blanca y pueblos con encanto de Guanacaste. Disponible en versión de 3 horas ($100) o 4 horas ($135). Ideal para conocer la cultura y el Pacífico Norte sin prisa.",
    imagen: "/tours/guanacaste-playa.jpg",
    galeria: ["/tours/guanacaste-playa.jpg"],
    itinerario: [
      { titulo: "Punto de encuentro", detalle: "Recogida en la zona de Guanacaste." },
      { titulo: "Ruta de playas", detalle: "Paradas en playas seleccionadas para fotos y baño." },
      { titulo: "Pueblos típicos", detalle: "Recorrido cultural por pueblos costeros." },
    ],
    incluye: ["Transporte turístico", "Guía local", "Agua embotellada"],
    noIncluye: ["Comidas", "Entradas opcionales", "Propinas"],
    rating: 4.7,
    reviews: 64,
  },
  {
    slug: "isla-del-coco-buceo",
    nombre: "Buceo en Isla del Coco",
    categoria: "buceo",
    precioUSD: 4850,
    duracion: "10 días / 9 noches",
    grupo: "Liveaboard",
    ubicacion: "Parque Nacional Isla del Coco",
    resumen:
      "Expedición de buceo a uno de los mejores sitios del mundo: tiburones martillo en cardumen.",
    descripcion:
      "Patrimonio de la Humanidad y meca del buceo de aventura. Una expedición liveaboard a 550 km de la costa, con inmersiones rodeadas de tiburones martillo, tiburones de punta blanca, mantas y delfines. Para buzos certificados con experiencia.",
    imagen: "/tours/buceo-tortuga.jpg",
    galeria: ["/tours/buceo-tortuga.jpg", "/gallery/snorkel.jpg", "/gallery/snorkel-superficie.jpg"],
    itinerario: [
      { titulo: "Día 1 — Embarque en Puntarenas", detalle: "Travesía nocturna hacia la isla." },
      { titulo: "Días 2–3 — Navegación", detalle: "Briefings de seguridad y preparación de equipo." },
      { titulo: "Días 4–8 — Inmersiones", detalle: "Hasta 4 inmersiones diarias en los puntos icónicos." },
      { titulo: "Días 9–10 — Regreso", detalle: "Travesía de retorno y desembarque." },
    ],
    incluye: [
      "Embarcación liveaboard (camarote)",
      "Todas las inmersiones guiadas",
      "Alimentación completa a bordo",
      "Tanques, plomos y guía dive master",
    ],
    noIncluye: ["Equipo personal de buceo", "Certificación", "Seguro de buceo", "Parque y tasas"],
    rating: 5.0,
    reviews: 31,
  },
  {
    slug: "guatemala",
    nombre: "Guatemala — Antigua y Atitlán",
    categoria: "internacional",
    precioUSD: 890,
    duracion: "5 días / 4 noches",
    grupo: "Grupo pequeño",
    ubicacion: "Guatemala",
    resumen:
      "Antigua colonial, el lago Atitlán y mercados mayas en un viaje guiado desde San José.",
    descripcion:
      "Un viaje internacional con todo coordinado desde San José: vuelo, traslados, hospedaje y guía. Conocemos la Antigua Guatemala, el imponente lago Atitlán rodeado de volcanes y los coloridos mercados mayas de Chichicastenango.",
    imagen: "/tours/guatemala-antigua.jpg",
    galeria: ["/tours/guatemala-antigua.jpg", "/tours/guatemala-2.jpg"],
    itinerario: [
      { titulo: "Día 1 — Vuelo y Antigua", detalle: "Vuelo desde San José y traslado a la Antigua." },
      { titulo: "Día 2 — Antigua colonial", detalle: "City tour y volcán de fondo." },
      { titulo: "Día 3 — Lago Atitlán", detalle: "Navegación y pueblos del lago." },
      { titulo: "Día 4 — Chichicastenango", detalle: "Mercado maya y artesanía." },
      { titulo: "Día 5 — Regreso", detalle: "Traslado al aeropuerto y vuelo de retorno." },
    ],
    incluye: [
      "Vuelo San José – Guatemala (ida y vuelta)",
      "Traslados y transporte interno",
      "4 noches de hospedaje",
      "Guía acompañante",
      "Desayunos",
    ],
    noIncluye: ["Almuerzos y cenas", "Entradas opcionales", "Gastos personales"],
    rating: 4.9,
    reviews: 28,
  },
  {
    slug: "el-salvador",
    nombre: "El Salvador — Ruta de las Flores",
    categoria: "internacional",
    precioUSD: 760,
    duracion: "4 días / 3 noches",
    grupo: "Grupo pequeño",
    ubicacion: "El Salvador",
    resumen:
      "Pueblos coloridos, volcanes y playas de surf en la Ruta de las Flores.",
    descripcion:
      "Viaje coordinado desde San José por la encantadora Ruta de las Flores salvadoreña: pueblos de colores, gastronomía local, cascadas y las famosas playas de surf del Pacífico. Vuelo, traslados y guía incluidos.",
    // ⚠️ IMÁGENES PUENTE — REEMPLAZAR POR FOTOS DEL CLIENTE.
    // Únicas imágenes del sitio que NO son del cliente: fotos reales de
    // Concepción de Ataco, El Salvador (Ruta de las Flores) tomadas de Wikimedia
    // Commons (licencia libre, posiblemente CC BY-SA → atribuir si se mantienen).
    // No se encontró foto propia del cliente para este tour (página caída / sin
    // snapshot con imágenes). Sustituir los archivos en /public/tours/ o estas
    // rutas cuando llegue el material real.
    imagen: "/tours/el-salvador.jpg",
    galeria: ["/tours/el-salvador.jpg", "/tours/el-salvador-2.jpg"],
    itinerario: [
      { titulo: "Día 1 — Vuelo y bienvenida", detalle: "Vuelo desde San José y traslado al hotel." },
      { titulo: "Día 2 — Ruta de las Flores", detalle: "Pueblos coloniales y gastronomía local." },
      { titulo: "Día 3 — Costa del Pacífico", detalle: "Playas de surf y atardecer." },
      { titulo: "Día 4 — Regreso", detalle: "Traslado al aeropuerto y retorno." },
    ],
    incluye: [
      "Vuelo San José – El Salvador (ida y vuelta)",
      "Traslados y transporte interno",
      "3 noches de hospedaje",
      "Guía acompañante",
      "Desayunos",
    ],
    noIncluye: ["Almuerzos y cenas", "Entradas opcionales", "Gastos personales"],
    rating: 4.8,
    reviews: 22,
  },
]

export function getTourBySlug(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug)
}

export function getTourSlugs(): string[] {
  return tours.map((t) => t.slug)
}
