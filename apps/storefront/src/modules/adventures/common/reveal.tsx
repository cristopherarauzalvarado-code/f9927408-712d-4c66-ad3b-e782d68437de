"use client"

import clsx from "clsx"
import {
  ElementType,
  useEffect,
  useRef,
  useState,
} from "react"

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Retardo en ms para escalonar (stagger) elementos de una grilla. */
  delay?: number
  /** Etiqueta a renderizar (div por defecto). */
  as?: ElementType
  /** Dirección de entrada. */
  from?: "up" | "down" | "left" | "right" | "scale"
}

const hiddenByDir: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate-y-10",
  down: "-translate-y-10",
  left: "translate-x-10",
  right: "-translate-x-10",
  scale: "scale-95",
}

/**
 * Revela su contenido con un fade + desplazamiento cuando entra en viewport.
 * Usa IntersectionObserver (una sola vez) y se desactiva con
 * prefers-reduced-motion para accesibilidad.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  as,
  from = "up",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={clsx(
        "transition-[opacity,transform] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
        shown
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : clsx("opacity-0", hiddenByDir[from]),
        className
      )}
    >
      {children}
    </Tag>
  )
}
