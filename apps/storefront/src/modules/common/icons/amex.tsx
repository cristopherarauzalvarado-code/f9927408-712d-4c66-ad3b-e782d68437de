import React from "react"

import { IconProps } from "types/icon"

const Amex: React.FC<IconProps> = ({ size = "32", ...attributes }) => {
  return (
    <svg
      width={size}
      height={Number(size) * 0.66}
      viewBox="0 0 48 32"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <title>American Express</title>
      <rect width="48" height="32" rx="4" fill="#1F72CD" />
      <path
        fill="#fff"
        d="M9.2 13.7 7 18.7h1.3l.4-1h2.3l.4 1h2.6l.6-1.3.6 1.3h1.3v-3.5l1.5 3.5h1.1l1.5-3.5v3.5h1.2v-5h-2l-1.2 2.9-1.3-2.9h-2v4.7l-2-4.7H11.5l-.4 1 .4-1H9.2Zm.6 1.2.7 1.7H9.1l.7-1.7Z"
      />
      <path
        fill="#fff"
        d="M23.9 13.7v5h4.1v-1.1h-2.9v-.9h2.8v-1h-2.8v-.9h2.9v-1.1h-4.1Zm5 0 1.9 2.5-1.9 2.5h1.5l1.2-1.6 1.2 1.6h1.6l-2-2.5 2-2.5h-1.5l-1.2 1.6-1.2-1.6h-1.6Z"
      />
    </svg>
  )
}

export default Amex
