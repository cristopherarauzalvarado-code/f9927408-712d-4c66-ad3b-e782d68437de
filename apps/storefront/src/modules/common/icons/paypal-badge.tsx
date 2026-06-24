import React from "react"

import { IconProps } from "types/icon"

/** Badge estilo tarjeta con el wordmark de PayPal. */
const PaypalBadge: React.FC<IconProps> = ({ size = "32", ...attributes }) => {
  return (
    <svg
      width={size}
      height={Number(size) * 0.66}
      viewBox="0 0 48 32"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <title>PayPal</title>
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <text
        x="24"
        y="20.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10"
        fontStyle="italic"
        fontWeight="700"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#0079C1">Pal</tspan>
      </text>
    </svg>
  )
}

export default PaypalBadge
