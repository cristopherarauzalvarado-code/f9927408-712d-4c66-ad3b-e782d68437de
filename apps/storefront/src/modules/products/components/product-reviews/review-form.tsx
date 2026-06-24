"use client"

import { useState, useTransition } from "react"
import { submitReview } from "@lib/data/reviews"

type Props = {
  productId: string
  isAuthenticated: boolean
}

const StarButton = ({
  value,
  selected,
  onClick,
}: {
  value: number
  selected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-2xl transition-colors ${
      selected ? "text-yellow-400" : "text-ui-fg-muted hover:text-yellow-300"
    }`}
    aria-label={`Rate ${value} star${value !== 1 ? "s" : ""}`}
  >
    ★
  </button>
)

const ReviewForm = ({ productId, isAuthenticated }: Props) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-ui-fg-subtle">
        Por favor{" "}
        <a href="/account" className="underline text-ui-fg-base">
          iniciá sesión
        </a>{" "}
        para dejar una reseña.
      </p>
    )
  }

  if (success) {
    return (
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
        <p className="text-sm font-medium text-ui-fg-base">
          ✓ ¡Reseña enviada! Aparecerá una vez aprobada.
        </p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError("Seleccioná una calificación")
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        await submitReview({ productId, rating, content: content || undefined })
        setSuccess(true)
        setRating(0)
        setContent("")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo enviar la reseña")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      <div>
        <p className="text-sm font-medium text-ui-fg-base mb-1">Tu calificación</p>
        <div
          className="flex gap-x-1"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <StarButton
              key={star}
              value={star}
              selected={star <= (hover || rating)}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="review-content"
          className="text-sm font-medium text-ui-fg-base mb-1 block"
        >
          Reseña (opcional)
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Contanos tu experiencia..."
          className="w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base placeholder:text-ui-fg-muted focus:outline-none focus:ring-2 focus:ring-ui-border-interactive resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-ui-bg-interactive px-4 py-2 text-sm font-medium text-ui-fg-on-color hover:bg-ui-bg-interactive-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  )
}

export default ReviewForm
