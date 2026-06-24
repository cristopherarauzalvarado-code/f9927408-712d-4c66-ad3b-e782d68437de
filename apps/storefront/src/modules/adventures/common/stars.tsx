/** Estrellas de rating (arena/dorado). `value` 0–5. */
export default function Stars({
  value,
  className = "",
}: {
  value: number
  className?: string
}) {
  const full = Math.round(value)
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${i < full ? "fill-sand-soft" : "fill-jungle-line"}`}
          aria-hidden
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}
