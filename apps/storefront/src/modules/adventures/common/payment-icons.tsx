import type { ReactElement } from "react"

/**
 * Logos de métodos de pago como SVG (colores de marca reales).
 * Vectoriales → nítidos a cualquier tamaño y sin peticiones extra.
 */

function Visa() {
  return (
    <svg viewBox="0 0 48 16" className="h-3.5 w-auto" role="img" aria-label="Visa">
      <text
        x="24"
        y="13"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="16"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="-0.5"
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  )
}

function Mastercard() {
  return (
    <svg viewBox="0 0 36 24" className="h-5 w-auto" role="img" aria-label="Mastercard">
      <circle cx="14" cy="12" r="9" fill="#EB001B" />
      <circle cx="22" cy="12" r="9" fill="#F79E1B" />
      <path
        d="M18 5.2a9 9 0 0 1 0 13.6 9 9 0 0 1 0-13.6z"
        fill="#FF5F00"
      />
    </svg>
  )
}

function Amex() {
  return (
    <svg viewBox="0 0 44 24" className="h-5 w-auto" role="img" aria-label="American Express">
      <rect width="44" height="24" rx="3" fill="#2E77BB" />
      <text
        x="22"
        y="15.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="8"
        fontWeight="800"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        AMEX
      </text>
    </svg>
  )
}

function Transferencia() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="#1F2937"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Transferencia bancaria"
    >
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 9.5v8M10 9.5v8M14 9.5v8M19 9.5v8" />
      <path d="M3 20.5h18" />
    </svg>
  )
}

const map: Record<string, () => ReactElement> = {
  Visa,
  Mastercard,
  "American Express": Amex,
  Transferencia,
}

export default function PaymentLogo({ name }: { name: string }) {
  const Logo = map[name]
  if (!Logo) {
    return (
      <span className="font-sans text-xs font-medium text-ink-muted">
        {name}
      </span>
    )
  }
  return <Logo />
}
