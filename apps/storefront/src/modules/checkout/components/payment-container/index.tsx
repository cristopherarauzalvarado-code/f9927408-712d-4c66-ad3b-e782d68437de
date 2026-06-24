import { Radio as RadioGroupOption } from "@headlessui/react"
import { Text, clx } from "@modules/common/components/ui"
import React, { useContext, useMemo, type JSX } from "react"

import Radio from "@modules/common/components/radio"

import { isManual } from "@lib/constants"
import Amex from "@modules/common/icons/amex"
import CardBrands from "@modules/common/icons/card-brands"
import Mastercard from "@modules/common/icons/mastercard"
import Visa from "@modules/common/icons/visa"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import PaymentTest from "../payment-test"
import { type OnvoCardState, useOnvo } from "../payment-wrapper/onvo-wrapper"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"

type PaymentContainerProps = {
  paymentProviderId: string
  selectedPaymentOptionId: string | null
  disabled?: boolean
  paymentInfoMap: Record<string, { title: string; icon: JSX.Element }>
  children?: React.ReactNode
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  children,
}) => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isSelected = selectedPaymentOptionId === paymentProviderId

  return (
    <RadioGroupOption
      key={paymentProviderId}
      value={paymentProviderId}
      disabled={disabled}
      className={clx(
        "group flex flex-col gap-y-2 cursor-pointer rounded-lg border px-5 py-4 mb-3 transition-all duration-200",
        isSelected
          ? "border-gray-900 ring-1 ring-gray-900 bg-gray-50/60"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Radio checked={isSelected} />
          <Text className="text-sm font-medium text-gray-900">
            {paymentInfoMap[paymentProviderId]?.title || paymentProviderId}
          </Text>
          {isManual(paymentProviderId) && isDevelopment && (
            <PaymentTest className="hidden small:block" />
          )}
        </div>
        <span className="flex items-center text-gray-700">
          {paymentInfoMap[paymentProviderId]?.icon}
        </span>
      </div>
      {isManual(paymentProviderId) && isDevelopment && (
        <PaymentTest className="small:hidden text-[10px]" />
      )}
      {children}
    </RadioGroupOption>
  )
}

export default PaymentContainer

const inputClass =
  "block w-full h-11 px-4 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors duration-200"

const labelClass =
  "block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5"

// Detecta la marca de la tarjeta a partir de los primeros dígitos.
type CardBrand = "visa" | "mastercard" | "amex"

const detectBrand = (number: string): CardBrand | null => {
  const n = number.replace(/\s/g, "")
  if (/^4/.test(n)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard"
  if (/^3[47]/.test(n)) return "amex"
  return null
}

const BrandLogo = ({ brand }: { brand: CardBrand }) => {
  if (brand === "visa") return <Visa size={32} />
  if (brand === "mastercard") return <Mastercard size={32} />
  return <Amex size={32} />
}

export const OnvoCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
}: Omit<PaymentContainerProps, "children">) => {
  const { card, setCardField } = useOnvo()
  const isSelected = selectedPaymentOptionId === paymentProviderId

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16)
    return digits.replace(/(.{4})/g, "$1 ").trim()
  }

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const brand = detectBrand(card.number)

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {isSelected && (
        <div className="mt-4 flex flex-col gap-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4 animate-fade-in-top">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className={clx(labelClass, "mb-0")}>
                Número de tarjeta
              </label>
              <CardBrands size={26} />
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) =>
                  setCardField("number", formatCardNumber(e.target.value))
                }
                onKeyDown={(e) => e.stopPropagation()}
                className={clx(inputClass, "pr-16")}
              />
              {brand && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <BrandLogo brand={brand} />
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <div>
              <label className={labelClass}>Vencimiento</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={card.expiry}
                onChange={(e) =>
                  setCardField("expiry", formatExpiry(e.target.value))
                }
                onKeyDown={(e) => e.stopPropagation()}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CVV</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                maxLength={4}
                value={card.cvv}
                onChange={(e) =>
                  setCardField("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onKeyDown={(e) => e.stopPropagation()}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Nombre en la tarjeta</label>
            <input
              type="text"
              autoComplete="cc-name"
              placeholder="María García"
              value={card.holderName}
              onChange={(e) => setCardField("holderName", e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-x-2 pt-1 text-xs text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-gray-400"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            Pago seguro · Tus datos se procesan cifrados por ONVO
          </div>
        </div>
      )}
    </PaymentContainer>
  )
}

export const StripeCardContainer = ({
  paymentProviderId,
  selectedPaymentOptionId,
  paymentInfoMap,
  disabled = false,
  setCardBrand,
  setError,
  setCardComplete,
}: Omit<PaymentContainerProps, "children"> & {
  setCardBrand: (brand: string) => void
  setError: (error: string | null) => void
  setCardComplete: (complete: boolean) => void
}) => {
  const stripeReady = useContext(StripeContext)

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-white border border-gray-200 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors duration-200",
      },
    }
  }, [])

  return (
    <PaymentContainer
      paymentProviderId={paymentProviderId}
      selectedPaymentOptionId={selectedPaymentOptionId}
      paymentInfoMap={paymentInfoMap}
      disabled={disabled}
    >
      {selectedPaymentOptionId === paymentProviderId &&
        (stripeReady ? (
          <div className="my-4 transition-all duration-150 ease-in-out">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              Ingresá los datos de tu tarjeta:
            </Text>
            <CardElement
              options={useOptions as StripeCardElementOptions}
              onChange={(e) => {
                setCardBrand(
                  e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                )
                setError(e.error?.message || null)
                setCardComplete(e.complete)
              }}
            />
          </div>
        ) : (
          <SkeletonCardDetails />
        ))}
    </PaymentContainer>
  )
}
