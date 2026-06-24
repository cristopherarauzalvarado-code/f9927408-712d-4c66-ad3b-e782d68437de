import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Manrope, Playfair_Display } from "next/font/google"
import { site } from "@lib/adventures/site"
import WhatsAppFloat from "@modules/adventures/whatsapp-float"
import "styles/globals.css"

// La maqueta de Figma usa Manrope para todo (títulos 800, cuerpo 500).
// Apuntamos las tres variables de fuente a Manrope y controlamos el peso por clase.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

// Serif de display para titulares destacados (hero). Manrope sigue siendo la
// fuente base; Playfair solo se usa donde se aplique la clase `font-serif`.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description:
    "Tours nacionales, buceo, villas y viajes internacionales en Costa Rica desde 2007. Transporte, guía y comida incluidos, con salida desde San José.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${manrope.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <main className="relative">{props.children}</main>
        <WhatsAppFloat />
      </body>
    </html>
  )
}
