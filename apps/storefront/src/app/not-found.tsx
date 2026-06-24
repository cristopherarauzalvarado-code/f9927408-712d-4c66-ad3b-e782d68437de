import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404",
  description: "Página no encontrada",
}

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="font-display text-3xl font-semibold text-ink small:text-4xl">
        Esta ruta no existe
      </h1>
      <p className="max-w-md font-sans text-ink-muted">
        La página que buscás se perdió en la selva. Volvé al inicio y seguí
        explorando aventuras.
      </p>
      <Link href="/" className="btn-lime mt-2">
        Ir al inicio
      </Link>
    </div>
  )
}
