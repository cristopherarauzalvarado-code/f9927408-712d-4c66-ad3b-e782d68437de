"use client"

import { useEffect, useRef } from "react"

/**
 * Video de fondo NATIVO (self-hosted .mp4), sin controles.
 *
 * `<video autoplay muted loop playsinline>` sin `controls` → nunca muestra
 * botones ni branding. Funciona en iOS. El `poster` cubre mientras carga.
 *
 * `parallax`: al hacer scroll, la capa del video se traslada más lento que el
 * contenido (efecto profundidad). La capa tiene "headroom" (150% de alto) para
 * que el desplazamiento nunca muestre bordes. Respeta prefers-reduced-motion.
 */
export default function BackgroundVideo({
  src,
  poster,
  parallax = false,
}: {
  src: string
  poster: string
  parallax?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.removeAttribute("autoplay")
      v.pause()
      return
    }
    v.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!parallax) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const update = () => {
      raf = 0
      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(0, ${
          window.scrollY * 0.15
        }px, 0)`
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [parallax])

  return (
    <div
      ref={layerRef}
      className={
        parallax
          ? "absolute inset-x-0 -top-[18%] h-[136%] will-change-transform"
          : "absolute inset-0"
      }
    >
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  )
}
