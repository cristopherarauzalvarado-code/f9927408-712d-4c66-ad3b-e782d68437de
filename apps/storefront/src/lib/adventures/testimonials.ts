/**
 * Testimonios reales tomados del sitio vigente del cliente.
 */
export type Testimonial = {
  nombre: string
  texto: string
  tour?: string
  rating: number
}

export const testimonials: Testimonial[] = [
  {
    nombre: "Moisés Esquivel",
    texto:
      "El tour muy bueno y los lugares simplemente hermosos. Todo muy bien organizado de principio a fin.",
    tour: "Tour nacional",
    rating: 5,
  },
  {
    nombre: "Mally Vargas",
    texto:
      "Quedamos muy contentos con el trato, súper lindo todo. Repetiríamos sin pensarlo.",
    tour: "Villas",
    rating: 5,
  },
  {
    nombre: "Andrea Rojas",
    texto:
      "La salida desde San José y la comida incluida hacen todo facilísimo. Solo hay que disfrutar.",
    tour: "Bajos del Toro",
    rating: 5,
  },
]
