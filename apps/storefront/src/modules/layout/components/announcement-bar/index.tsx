"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="w-full bg-brand text-brand-foreground text-center py-[9px] px-8 relative text-[12px] small:text-sm leading-[16px]">
      Registrate y obtené 20% de descuento en tu primer pedido.{" "}
      <LocalizedClientLink href="/account" className="font-bold underline">
        Registrate ahora
      </LocalizedClientLink>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
        aria-label="Close announcement"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
