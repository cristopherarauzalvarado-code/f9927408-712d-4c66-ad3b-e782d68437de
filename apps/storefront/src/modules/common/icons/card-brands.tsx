import React from "react"

import Amex from "./amex"
import Mastercard from "./mastercard"
import Visa from "./visa"

/**
 * Fila de logos de las marcas de tarjeta aceptadas.
 * Se usa como icono del método de pago ONVO en el checkout.
 */
const CardBrands: React.FC<{ size?: number }> = ({ size = 30 }) => {
  return (
    <span className="flex items-center gap-x-1">
      <Visa size={size} />
      <Mastercard size={size} />
      <Amex size={size} />
    </span>
  )
}

export default CardBrands
