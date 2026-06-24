"use client"

import { isOnvo, isStripeLike } from "@lib/constants"
import { setOnvoPaymentMethodAndPlace } from "@lib/data/cart"
import { loadStripe } from "@stripe/stripe-js"
import { HttpTypes } from "@medusajs/types"
import React from "react"
import OnvoWrapper from "./onvo-wrapper"
import StripeWrapper from "./stripe-wrapper"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  if (isOnvo(paymentSession?.provider_id) && paymentSession) {
    return (
      <OnvoWrapper
        cart={cart}
        paymentSession={paymentSession}
        onPlaceOrder={setOnvoPaymentMethodAndPlace}
      >
        {children}
      </OnvoWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper
