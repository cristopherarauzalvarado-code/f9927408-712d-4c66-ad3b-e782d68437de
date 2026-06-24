"use client"

import { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"

const ONVO_API = "https://api.onvopay.com/v1"
const ONVO_PUBLIC_KEY = process.env.NEXT_PUBLIC_ONVO_PUBLISHABLE_KEY

export type OnvoCardState = {
  number: string
  expiry: string // MM/YY
  cvv: string
  holderName: string
}

type OnvoContextType = {
  card: OnvoCardState
  setCardField: (field: keyof OnvoCardState, value: string) => void
  isSubmitting: boolean
  error: string | null
  submitPayment: () => Promise<void>
}

const defaultCard: OnvoCardState = {
  number: "",
  expiry: "",
  cvv: "",
  holderName: "",
}

export const OnvoContext = createContext<OnvoContextType>({
  card: defaultCard,
  setCardField: () => {},
  isSubmitting: false,
  error: null,
  submitPayment: async () => {},
})

export const useOnvo = () => useContext(OnvoContext)

type OnvoWrapperProps = {
  cart: HttpTypes.StoreCart
  paymentSession: HttpTypes.StorePaymentSession
  children: React.ReactNode
  onPlaceOrder: (paymentSessionId: string, paymentMethodId: string) => Promise<void>
}

const OnvoWrapper: React.FC<OnvoWrapperProps> = ({
  cart,
  paymentSession,
  children,
  onPlaceOrder,
}) => {
  const [card, setCard] = useState<OnvoCardState>(defaultCard)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const setCardField = useCallback(
    (field: keyof OnvoCardState, value: string) => {
      setCard((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const submitPayment = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setError(null)
    setIsSubmitting(true)

    try {
      if (!ONVO_PUBLIC_KEY) throw new Error("ONVO publishable key not configured")

      const [expMonth, expYear] = card.expiry.split("/").map((s) => s.trim())
      if (!expMonth || !expYear) throw new Error("Invalid expiry date")

      // Tokenize card directly from browser → ONVO (card data never touches our server)
      const tokenRes = await fetch(`${ONVO_API}/payment-methods`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ONVO_PUBLIC_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "card",
          card: {
            number: card.number.replace(/\s/g, ""),
            expMonth: parseInt(expMonth, 10),
            expYear: parseInt(`20${expYear}`, 10),
            cvv: card.cvv,
            holderName: card.holderName,
          },
          billing: {
            name: card.holderName,
            address: {
              country: cart.billing_address?.country_code?.toUpperCase() ?? "CR",
            },
          },
          customer: {
            name: card.holderName,
            email: cart.email ?? "",
          },
        }),
      })

      const tokenData = await tokenRes.json()
      if (!tokenRes.ok) {
        throw new Error(tokenData?.message || "Card tokenization failed")
      }

      const paymentMethodId = tokenData.id as string
      if (!paymentMethodId) throw new Error("No payment method ID received from ONVO")

      // Hand off to server action: update Medusa session + place order
      await onPlaceOrder(paymentSession.id, paymentMethodId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "El pago falló. Intentá de nuevo.")
      setIsSubmitting(false)
      submittingRef.current = false
    }
  }, [card, cart, paymentSession, onPlaceOrder])

  return (
    <OnvoContext.Provider value={{ card, setCardField, isSubmitting, error, submitPayment }}>
      {children}
    </OnvoContext.Provider>
  )
}

export default OnvoWrapper
