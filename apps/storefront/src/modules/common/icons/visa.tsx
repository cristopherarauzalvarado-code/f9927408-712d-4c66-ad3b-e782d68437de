import React from "react"

import { IconProps } from "types/icon"

const Visa: React.FC<IconProps> = ({ size = "32", ...attributes }) => {
  return (
    <svg
      width={size}
      height={Number(size) * 0.66}
      viewBox="0 0 48 32"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <title>Visa</title>
      <rect width="48" height="32" rx="4" fill="#fff" />
      <rect width="48" height="32" rx="4" fill="none" stroke="#E5E7EB" />
      <path
        fill="#1A1F71"
        d="M20.4 21.3h-2.6l1.6-9.4h2.6l-1.6 9.4Zm9.5-9.2c-.5-.2-1.3-.4-2.3-.4-2.5 0-4.3 1.3-4.3 3.1 0 1.4 1.3 2.1 2.2 2.6.9.5 1.3.8 1.3 1.2 0 .6-.8.9-1.5.9-1 0-1.5-.1-2.4-.5l-.3-.2-.4 2.2c.6.3 1.7.5 2.9.5 2.6 0 4.4-1.3 4.4-3.2 0-1.1-.7-1.9-2.1-2.6-.9-.4-1.4-.7-1.4-1.2 0-.4.5-.8 1.4-.8.8 0 1.4.2 1.8.3l.2.1.4-2.1Zm6.7-.2h-2c-.6 0-1.1.2-1.4.8l-3.9 8.8h2.6l.5-1.4h3.2c.1.3.3 1.4.3 1.4h2.3l-2-9.6Zm-3 6.1c.2-.5 1-2.6 1-2.6l.3-.8.2.7.6 2.7h-2.1Zm-13.8-6.1-2.5 6.4-.3-1.4c-.5-1.6-1.9-3.3-3.6-4.2l2.3 8.5h2.6l3.9-9.4h-2.4Z"
      />
      <path
        fill="#F7B600"
        d="M14.6 11.9h-4l-.1.3c3.1.8 5.2 2.6 6 4.9l-.9-4.4c-.1-.6-.6-.8-1-.8Z"
      />
    </svg>
  )
}

export default Visa
