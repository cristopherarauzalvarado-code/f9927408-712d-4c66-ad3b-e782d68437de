import React from "react"

import { IconProps } from "types/icon"

const Mastercard: React.FC<IconProps> = ({ size = "32", ...attributes }) => {
  return (
    <svg
      width={size}
      height={Number(size) * 0.66}
      viewBox="0 0 48 32"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <title>Mastercard</title>
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <circle cx="19" cy="16" r="9" fill="#EB001B" />
      <circle cx="29" cy="16" r="9" fill="#F79E1B" />
      <path
        fill="#FF5F00"
        d="M24 9.2a9 9 0 0 0 0 13.6 9 9 0 0 0 0-13.6Z"
      />
    </svg>
  )
}

export default Mastercard
