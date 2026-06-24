"use client"

import { useState } from "react"

type Status = "idle" | "loading" | "success" | "error"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "loading") return

    setStatus("loading")
    setMessage(null)

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus("error")
        setMessage(data?.error ?? "No pudimos completar la suscripción.")
        return
      }

      setStatus("success")
      setMessage("¡Listo! Gracias por suscribirte.")
      setEmail("")
    } catch {
      setStatus("error")
      setMessage("No pudimos completar la suscripción. Intentá más tarde.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-3 w-full small:w-auto small:min-w-[349px]">
        <div className="bg-white rounded-full px-5 py-3 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M16.5 5.5 8.25 13.75 4 9.5"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm text-black">{message}</span>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 w-full small:w-auto small:min-w-[349px]"
    >
      <div className="bg-white rounded-full px-5 py-3 flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M16.667 3.333H3.333A1.667 1.667 0 001.667 5v10A1.667 1.667 0 003.333 16.667h13.334A1.667 1.667 0 0018.333 15V5a1.667 1.667 0 00-1.666-1.667z"
            stroke="black"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <path
            d="M1.667 5l8.333 5.833L18.333 5"
            stroke="black"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
        </svg>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ingresá tu correo electrónico"
          aria-label="Correo electrónico"
          className="outline-none text-sm flex-1 text-black placeholder:text-black/40 bg-transparent"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-white rounded-full py-3 text-base font-medium text-black hover:bg-gray-100 transition-colors text-center disabled:opacity-60"
      >
        {status === "loading" ? "Suscribiendo…" : "Suscribirme al boletín"}
      </button>
      {status === "error" && message && (
        <p className="text-xs text-white/90 text-center">{message}</p>
      )}
    </form>
  )
}
