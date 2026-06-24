"use client"

import clsx from "clsx"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { site } from "@lib/adventures/site"
import BackgroundVideo from "@modules/adventures/hero/background-video"

const VIDEO = "/video/hero.mp4"
const POSTER = "/video/hero-poster.jpg"

export default function Hero() {
  const videoRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let raf = 0
    const apply = () => {
      raf = 0
      const y = window.scrollY
      const h = window.innerHeight || 1
      const p = Math.min(1, y / h) // progreso de scroll dentro del hero
      const mvx = mouse.current.x
      const mvy = mouse.current.y

      // Video: base scale (headroom) + zoom al scroll + leve desplazamiento por mouse.
      const scale = 1.12 + p * 0.16
      if (videoRef.current) {
        videoRef.current.style.transform = `translate3d(${(-mvx * 22).toFixed(
          1
        )}px, ${(-mvy * 22 + y * 0.12).toFixed(1)}px, 0) scale(${scale.toFixed(
          3
        )})`
      }
      // Contenido: parallax suave opuesto + se eleva y desvanece al scroll.
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(${(mvx * 12).toFixed(
          1
        )}px, ${(mvy * 12 - y * 0.15).toFixed(1)}px, 0)`
        contentRef.current.style.opacity = String(Math.max(0, 1 - p * 1.5))
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onMouse = (e: MouseEvent) => {
      mouse.current = {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      }
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("mousemove", onMouse, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("mousemove", onMouse)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const enter = (delay: number) =>
    clsx(
      "transition-[opacity,transform] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
      mounted ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[2px]"
    )

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden text-center">
      {/* Video a pantalla completa (capa con profundidad) */}
      <div ref={videoRef} className="absolute inset-0 will-change-transform">
        <BackgroundVideo src={VIDEO} poster={POSTER} />
      </div>

      {/* Sutil degradado SOLO en los bordes inferior/superior (no apaga el color) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Contenido */}
      <div
        ref={contentRef}
        className="content-container relative z-10 text-white will-change-transform"
      >
        <span
          style={{ transitionDelay: mounted ? "100ms" : "0ms" }}
          className={clsx(
            "inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.22em] text-lime [text-shadow:0_2px_10px_rgba(0,0,0,0.9)]",
            enter(100)
          )}
        >
          <span className="h-px w-8 bg-lime/80" />
          Operador local desde {site.foundedYear}
          <span className="h-px w-8 bg-lime/80" />
        </span>

        <h1
          style={{ transitionDelay: mounted ? "200ms" : "0ms" }}
          className={clsx(
            "mx-auto mt-6 max-w-4xl font-serif text-[46px] font-extrabold leading-[1.02] [text-shadow:0_3px_24px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6)] small:text-7xl medium:text-[92px]",
            enter(200)
          )}
        >
          Aventura en Costa Rica
        </h1>

        <p
          style={{ transitionDelay: mounted ? "340ms" : "0ms" }}
          className={clsx(
            "mx-auto mt-6 max-w-2xl font-sans text-lg font-medium text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] small:text-2xl",
            enter(340)
          )}
        >
          Tours a Isla del Coco · buceo bajo el agua · Chirripó · villas
        </p>

        <div
          style={{ transitionDelay: mounted ? "480ms" : "0ms" }}
          className={clsx(
            "mt-9 flex flex-col items-center justify-center gap-4 small:flex-row",
            enter(480)
          )}
        >
          <Link
            href="#tours"
            className="btn-lime px-8 py-3.5 text-base shadow-[0px_14px_30px_rgba(0,0,0,0.3)]"
          >
            Explorar tours
          </Link>
          <Link
            href="#villas"
            className="font-sans text-sm font-bold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.9)] underline-offset-4 transition hover:underline"
          >
            o mirá las villas →
          </Link>
        </div>
      </div>
    </section>
  )
}
