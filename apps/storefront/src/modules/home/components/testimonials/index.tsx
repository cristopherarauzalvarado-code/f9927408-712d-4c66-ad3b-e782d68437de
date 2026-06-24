const reviews = [
  {
    name: "Sara M.",
    rating: 5,
    text: "Me sorprende la calidad y el estilo de la ropa que recibí. Desde prendas casuales hasta vestidos elegantes, cada pieza superó mis expectativas.",
  },
  {
    name: "Alex K.",
    rating: 5,
    text: "Encontrar ropa que vaya con mi estilo personal era todo un desafío hasta que descubrí esta tienda. La variedad de opciones es realmente increíble, para todos los gustos y ocasiones.",
  },
  {
    name: "Jaime L.",
    rating: 5,
    text: "Como alguien que siempre busca piezas únicas, estoy feliz de haber encontrado esta tienda. La selección de ropa es diversa y siempre a la moda.",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill={i < rating ? "#FFC633" : "#e5e7eb"}
          className="shrink-0"
        >
          <path d="M10 1l2.39 4.843L18 6.79l-4 3.898.944 5.505L10 13.75l-4.944 2.443L6 10.688 2 6.79l5.61-.947L10 1z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: typeof reviews[number] }) {
  return (
    <div className="border border-black/10 rounded-[20px] p-6 small:p-8 bg-white shrink-0 w-[calc(100vw-2rem)] small:w-auto">
      <StarRating rating={review.rating} />
      <div className="flex items-center gap-1 mt-4 mb-3">
        <span className="font-bold text-base small:text-xl text-black">{review.name}</span>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1C5.03 1 1 5.03 1 10s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm4.12 7.29l-4.54 4.54a.75.75 0 01-1.06 0L6.29 10.6a.75.75 0 111.06-1.06l1.7 1.7 4.01-4.01a.75.75 0 111.06 1.06z"
            fill="#01AB31"
          />
        </svg>
      </div>
      <p className="text-black/60 text-sm small:text-base leading-relaxed">
        &ldquo;{review.text}&rdquo;
      </p>
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 small:px-6 py-12 small:py-16">
      <div className="flex items-center justify-between mb-8 small:mb-12">
        <h2 className="font-heading font-black text-[32px] small:text-[48px] uppercase text-black leading-[1.1]">
          Nuestros clientes felices
        </h2>
        <div className="flex items-center gap-2 small:gap-3">
          <button
            className="w-8 h-8 small:w-10 small:h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Reseñas anteriores"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15l-5-5 5-5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className="w-8 h-8 small:w-10 small:h-10 rounded-full border border-black/10 flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Reseñas siguientes"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5l5 5-5 5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile: horizontal scroll, one card visible */}
      <div className="small:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4">
        {reviews.map((review) => (
          <div key={review.name} className="snap-start">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden small:grid small:grid-cols-3 gap-6">
        {reviews.map((review) => (
          <ReviewCard key={review.name} review={review} />
        ))}
      </div>
    </section>
  )
}
