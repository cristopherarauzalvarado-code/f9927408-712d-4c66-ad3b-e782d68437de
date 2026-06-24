"use client"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if (cart?.shipping_methods?.length === 0) return "delivery"
  return "payment"
}

const Summary = ({ cart }: SummaryProps) => {
  const [promoCode, setPromoCode] = useState("")
  const [applying, setApplying] = useState(false)
  const [promoError, setPromoError] = useState("")

  const step = getCheckoutStep(cart)
  const { currency_code, total } = cart
  const cartTotals = cart as unknown as {
    item_subtotal?: number | null
    discount_subtotal?: number | null
    shipping_subtotal?: number | null
  }
  const { item_subtotal, discount_subtotal, shipping_subtotal } = cartTotals

  const discountPct =
    item_subtotal && discount_subtotal && item_subtotal > 0
      ? Math.round((discount_subtotal / item_subtotal) * 100)
      : 0

  const handleApplyPromo = async () => {
    if (!promoCode || applying) return
    setApplying(true)
    setPromoError("")
    const existingCodes = (cart.promotions ?? [])
      .filter((p) => p.code)
      .map((p) => p.code!)
    try {
      await applyPromotions([...existingCodes, promoCode])
      setPromoCode("")
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Código promocional inválido")
    } finally {
      setApplying(false)
    }
  }

  const removePromo = async (code: string) => {
    const codes = (cart.promotions ?? [])
      .filter((p) => p.code && p.code !== code)
      .map((p) => p.code!)
    await applyPromotions(codes)
  }

  return (
    <div className="border border-black/10 rounded-[20px] p-5 small:p-6 flex flex-col gap-5 small:gap-6">
      <h2 className="font-bold text-[24px] text-black">Resumen del pedido</h2>

      {/* Totals breakdown */}
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <span className="text-[18px] small:text-[20px] text-black/60">
            Subtotal
          </span>
          <span
            className="text-[18px] small:text-[20px] font-bold text-black"
            data-testid="cart-subtotal"
          >
            {convertToLocale({
              amount: item_subtotal ?? 0,
              currency_code,
            })}
          </span>
        </div>

        {!!discount_subtotal && (
          <div className="flex justify-between items-center">
            <span className="text-[18px] small:text-[20px] text-black/60">
              Descuento{discountPct > 0 ? ` (-${discountPct}%)` : ""}
            </span>
            <span
              className="text-[18px] small:text-[20px] font-bold text-[#FF3333]"
              data-testid="cart-discount"
            >
              -
              {convertToLocale({
                amount: discount_subtotal,
                currency_code,
              })}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-[18px] small:text-[20px] text-black/60">
            Costo de envío
          </span>
          <span
            className="text-[18px] small:text-[20px] font-bold text-black"
            data-testid="cart-shipping"
          >
            {shipping_subtotal
              ? convertToLocale({ amount: shipping_subtotal, currency_code })
              : "Gratis"}
          </span>
        </div>
      </div>

      <div className="border-t border-black/10" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="text-[18px] small:text-[20px] text-black">Total</span>
        <span
          className="text-[22px] small:text-[24px] font-bold text-black"
          data-testid="cart-total"
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>

      {/* Applied promo codes */}
      {(cart.promotions ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          {cart.promotions!.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-sm"
              data-testid="discount-row"
            >
              <span className="font-medium text-black/60" data-testid="discount-code">
                {p.code}
              </span>
              {!p.is_automatic && (
                <button
                  onClick={() => p.code && removePromo(p.code)}
                  className="text-[#FF3333] hover:text-red-700 text-lg leading-none"
                  data-testid="remove-discount-button"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Promo code input */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-[#F0F0F0] rounded-full px-4 py-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path
              d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="7" cy="7" r="1" fill="rgba(0,0,0,0.4)" />
          </svg>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
            placeholder="Agregar código promocional"
            className="bg-transparent outline-none text-base text-black placeholder-black/40 flex-1 min-w-0"
            data-testid="discount-input"
          />
        </div>
        <button
          onClick={handleApplyPromo}
          disabled={applying || !promoCode}
          className="px-5 py-3 bg-black text-white rounded-full text-base font-medium whitespace-nowrap hover:bg-black/90 transition-colors disabled:opacity-50"
          data-testid="discount-apply-button"
        >
          {applying ? "..." : "Aplicar"}
        </button>
      </div>
      {promoError && (
        <p className="text-[#FF3333] text-sm -mt-2">{promoError}</p>
      )}

      {/* Go to Checkout */}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <button className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-full py-4 px-6 text-base font-medium hover:bg-black/90 transition-colors">
Ir a pagar
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="-rotate-90"
          >
            <path
              d="M12 19V5M5 12l7-7 7 7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
