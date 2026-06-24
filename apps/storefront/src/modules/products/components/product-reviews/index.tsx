import { listProductReviews } from "@lib/data/reviews"
import { retrieveCustomer } from "@lib/data/customer"
import ReviewForm from "./review-form"

type Props = {
  productId: string
  page?: number
  limit?: number
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-[3px]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width="18" height="18" viewBox="0 0 20 20" fill={star <= rating ? "#FFC633" : "none"} stroke="#FFC633" strokeWidth="1">
          <path d="M10 1l2.39 4.843L18 6.79l-4 3.898.944 5.505L10 13.75l-4.944 2.443L6 10.688 2 6.79l5.61-.947L10 1z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({
  rating,
  content,
  created_at,
  authorName,
}: {
  rating: number
  content: string | null
  created_at: string
  authorName?: string
}) {
  return (
    <div className="border border-black/10 rounded-[20px] p-7 flex flex-col gap-4">
      <StarRating rating={rating} />
      <div className="flex items-center gap-2">
        <span className="font-bold text-base small:text-lg text-black">
          {authorName ?? "Anonymous"}
        </span>
        {/* Verified badge */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" fill="#01AB31" />
          <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {content && (
        <p className="text-sm small:text-base text-black/60 leading-relaxed">
          &ldquo;{content}&rdquo;
        </p>
      )}
      <p className="text-sm font-medium text-black/60">
        Posted on {new Date(created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>
    </div>
  )
}

const ProductReviews = async ({
  productId,
  page = 1,
  limit = 6,
}: Props) => {
  const offset = (page - 1) * limit

  const emptyReviews = { reviews: [], count: 0, limit, offset }
  const [{ reviews, count }, customer] = await Promise.all([
    listProductReviews({ productId, limit, offset }).catch(() => emptyReviews),
    retrieveCustomer().catch(() => null),
  ])

  const totalPages = Math.ceil(count / limit)
  const isAuthenticated = !!customer

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col small:flex-row small:items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h2 className="font-bold text-xl small:text-2xl text-black">Todas las reseñas</h2>
          {count > 0 && (
            <span className="text-sm text-black/60">({count})</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter icon */}
          <button className="flex items-center justify-center w-12 h-12 bg-[#F0F0F0] rounded-full hover:bg-gray-200 transition-colors" aria-label="Filtrar reseñas">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M6 10h8M9 15h2" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {/* Sort dropdown */}
          <button className="flex items-center gap-2 px-5 py-3 bg-[#F0F0F0] rounded-full text-sm font-medium text-black hover:bg-gray-200 transition-colors">
            Recientes
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Write a review */}
          <ReviewFormTrigger productId={productId} isAuthenticated={isAuthenticated} />
        </div>
      </div>

      {/* Review grid */}
      {reviews.length === 0 ? (
        <p className="text-sm text-black/60 py-8 text-center">
          Todavía no hay reseñas. ¡Sé el primero en reseñar este producto!
        </p>
      ) : (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-5">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              content={review.content}
              created_at={review.created_at}
            />
          ))}
        </div>
      )}

      {/* Load more / pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {page < totalPages ? (
            <a
              href={`?reviews_page=${page + 1}`}
              className="border border-black/10 rounded-full px-14 py-3 text-base font-medium hover:bg-black hover:text-white transition-colors"
            >
              Cargar más reseñas
            </a>
          ) : (
            <a
              href="?reviews_page=1"
              className="border border-black/10 rounded-full px-14 py-3 text-base font-medium hover:bg-black hover:text-white transition-colors"
            >
              Mostrar menos
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function ReviewFormTrigger({
  productId,
  isAuthenticated,
}: {
  productId: string
  isAuthenticated: boolean
}) {
  if (!isAuthenticated) {
    return (
      <a
        href="/account"
        className="bg-black text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-black/80 transition-colors whitespace-nowrap"
      >
        Escribir una reseña
      </a>
    )
  }

  return (
    <details className="relative">
      <summary className="bg-black text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-black/80 transition-colors cursor-pointer list-none whitespace-nowrap">
        Escribir una reseña
      </summary>
      <div className="absolute right-0 top-full mt-2 w-[min(400px,90vw)] bg-white border border-black/10 rounded-[20px] p-6 shadow-lg z-20">
        <h3 className="font-bold text-base mb-4">Write a Review</h3>
        <ReviewForm productId={productId} isAuthenticated={isAuthenticated} />
      </div>
    </details>
  )
}

export default ProductReviews
