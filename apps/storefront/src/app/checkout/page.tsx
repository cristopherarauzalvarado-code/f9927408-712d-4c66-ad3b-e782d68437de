import { Suspense } from "react"
import { Metadata } from "next"
import Nav from "@modules/adventures/nav"
import Footer from "@modules/adventures/footer"
import CheckoutClient from "@modules/adventures/checkout/checkout-client"

export const metadata: Metadata = {
  title: "Checkout",
}

// Render dinámico: la reserva depende de los query params, así el servidor ya
// entrega el resumen/formulario precargado (sin parpadeo del estado vacío).
export const dynamic = "force-dynamic"

export default function CheckoutPage() {
  return (
    <>
      <Nav />
      <Suspense
        fallback={
          <div className="content-container py-24 text-center font-sans text-ink-muted">
            Cargando tu reserva…
          </div>
        }
      >
        <CheckoutClient />
      </Suspense>
      <Footer />
    </>
  )
}
