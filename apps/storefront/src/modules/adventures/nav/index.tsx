"use client"

import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

const links = [
  { href: "/#tours", label: "Tours" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#villas", label: "Villas" },
  { href: "/#galeria", label: "Galería" },
  { href: "/#contacto-form", label: "Contacto" },
]

/**
 * Nav fijo. Con `overlay` (home) arranca transparente sobre el hero y se
 * vuelve sólido al hacer scroll. Sin `overlay` (resto de páginas) es sólido
 * siempre y deja un espaciador para no tapar el contenido.
 */
export default function Nav({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Apariencia sólida cuando hay scroll, o cuando no es overlay.
  const solid = scrolled || !overlay

  return (
    <>
      <header
        className={clsx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          solid
            ? "border-b border-jungle-line bg-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.05)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="content-container flex h-16 items-center justify-between gap-4 small:h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Costarican Adventures"
              width={418}
              height={136}
              priority
              className={clsx(
                "h-9 w-auto transition-all duration-300 small:h-11",
                solid ? "drop-shadow-none" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              )}
            />
          </Link>

          <div className="hidden items-center gap-8 medium:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "font-sans text-sm font-medium transition-colors",
                  solid
                    ? "text-ink-muted hover:text-ink"
                    : "text-white/85 hover:text-white drop-shadow"
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Espaciador solo cuando el nav no flota sobre un hero. */}
      {!overlay && <div className="h-16 small:h-20" aria-hidden />}
    </>
  )
}
