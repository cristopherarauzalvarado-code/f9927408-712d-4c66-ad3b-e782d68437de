"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"

const cards = [
  {
    titulo: "Villas equipadas",
    href: "/#villas",
    imagen: "/villas/casa-luna-llena.jpg",
  },
  {
    titulo: "Tours",
    href: "/#tours",
    imagen: "/tours/catarata-la-leona.jpg",
  },
  {
    titulo: "Viajes internacionales",
    href: "/#internacional",
    imagen: "/tours/guatemala-antigua.jpg",
  },
]

/**
 * Tarjetas de categoría superpuestas al borde inferior del hero.
 *
 * Animación ligada al scroll: al entrar en viewport, la tarjeta izquierda llega
 * desde la izquierda, la derecha desde la derecha y la del centro sube; convergen
 * a su posición final. Ligado a la posición de scroll (no un simple fade).
 * Respeta prefers-reduced-motion (quedan en su posición final).
 */
export default function CategoryCards() {
  const sectionRef = useRef<HTMLElement>(null)
  const refs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      refs.current.forEach((el) => {
        if (el) {
          el.style.transform = "none"
          el.style.opacity = "1"
        }
      })
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const sec = sectionRef.current
      if (!sec) return
      const rect = sec.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 cuando el bloque entra por abajo, 1 cuando ya subió a su lugar.
      let p = (vh - rect.top) / (vh * 0.7)
      p = Math.min(1, Math.max(0, p))
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      const spread = Math.min(320, window.innerWidth * 0.32)

      refs.current.forEach((el, i) => {
        if (!el) return
        const dir = i === 0 ? -1 : i === 2 ? 1 : 0
        const x = (1 - eased) * spread * dir
        const y = i === 1 ? (1 - eased) * 70 : 0
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        el.style.opacity = String(0.2 + 0.8 * eased)
      })
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative z-20 -mt-24 small:-mt-40 medium:-mt-48"
    >
      <div className="content-container grid grid-cols-1 gap-7 small:grid-cols-3 small:gap-9">
        {cards.map((c, i) => (
          <div
            key={c.titulo}
            ref={(el) => {
              refs.current[i] = el
            }}
            className="opacity-0 will-change-transform"
          >
            <Link
              href={c.href}
              className="group relative block aspect-[5/4] overflow-hidden rounded-[20px] shadow-[0px_20px_45px_rgba(0,0,0,0.25)] small:aspect-[3/4]"
            >
              <Image
                src={c.imagen}
                alt={c.titulo}
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Marco interior */}
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-white/55 transition-all duration-300 group-hover:inset-3 group-hover:border-white" />

              {/* Contenido */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
                <h3 className="font-serif text-2xl font-extrabold leading-tight [text-shadow:0_2px_14px_rgba(0,0,0,0.85)] small:text-3xl">
                  {c.titulo}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1.5 border-b border-white/80 pb-1 font-sans text-xs font-bold uppercase tracking-[0.15em] [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] transition-colors group-hover:border-lime group-hover:text-lime">
                  Ver más
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
