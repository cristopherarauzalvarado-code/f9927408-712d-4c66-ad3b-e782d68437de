"use client"

import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@modules/common/components/ui"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sizeOption = item.variant?.options?.find((o) =>
    o.option?.title?.toLowerCase().includes("size")
  )?.value
  const colorOption = item.variant?.options?.find((o) =>
    o.option?.title?.toLowerCase().includes("color")
  )?.value

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1 || updating) return
    setQuantity(newQty)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity: newQty }).finally(() =>
      setUpdating(false)
    )
  }

  const handleDelete = async () => {
    setDeleting(true)
    await deleteLineItem(item.id).catch(() => setDeleting(false))
  }

  if (type === "preview") {
    return (
      <Table.Row className="w-full" data-testid="product-row">
        <Table.Cell className="!pl-0 p-4 w-24">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="flex w-16"
          >
            <Thumbnail
              thumbnail={item.thumbnail}
              images={item.variant?.product?.images}
              size="square"
            />
          </LocalizedClientLink>
        </Table.Cell>

        <Table.Cell className="text-left">
          <Text
            className="txt-medium-plus text-ui-fg-base"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant"
          />
        </Table.Cell>

        <Table.Cell className="!pr-0">
          <span className="flex flex-col items-end h-full justify-center">
            <span className="flex gap-x-1">
              <Text className="text-ui-fg-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <div className="flex items-start gap-4" data-testid="product-row">
      {/* Product image */}
      <LocalizedClientLink href={`/products/${item.product_handle}`}>
        <div className="w-[100px] h-[100px] small:w-[124px] small:h-[124px] bg-[#F0EEED] rounded-[8px] overflow-hidden shrink-0 relative">
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </div>
      </LocalizedClientLink>

      {/* Info + actions */}
      <div className="flex flex-1 justify-between items-start gap-2 min-h-[100px] small:min-h-[124px]">
        {/* Left: name, options, price */}
        <div className="flex flex-col justify-between gap-1 flex-1 h-full">
          <LocalizedClientLink href={`/products/${item.product_handle}`}>
            <p
              className="font-bold text-base small:text-[20px] text-black leading-snug line-clamp-2 hover:underline"
              data-testid="product-title"
            >
              {item.product_title}
            </p>
          </LocalizedClientLink>
          <div className="flex flex-col gap-0.5 text-sm text-black">
            {sizeOption && (
              <span>
                Talla:{" "}
                <span className="text-black/60">{sizeOption}</span>
              </span>
            )}
            {colorOption && (
              <span>
                Color:{" "}
                <span className="text-black/60">{colorOption}</span>
              </span>
            )}
            {!sizeOption && !colorOption && item.variant?.title && (
              <span className="text-black/60">{item.variant.title}</span>
            )}
          </div>
          <p
            className="font-bold text-[18px] small:text-[24px] text-black"
            data-testid="product-price"
          >
            {convertToLocale({
              amount: item.unit_price ?? 0,
              currency_code: currencyCode,
            })}
          </p>
        </div>

        {/* Right: delete + qty stepper */}
        <div className="flex flex-col justify-between items-end gap-4 h-[100px] small:h-[124px] shrink-0">
          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[#FF3333] hover:text-red-700 transition-colors disabled:opacity-50"
            data-testid="product-delete-button"
            aria-label="Eliminar artículo"
          >
            {deleting ? (
              <svg
                className="animate-spin w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          {/* Quantity stepper */}
          <div className="flex items-center justify-between bg-[#F0F0F0] rounded-full px-4 py-2 w-[110px] small:w-[126px] h-[40px] small:h-[44px]">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={updating || quantity <= 1}
              className="text-xl font-medium leading-none disabled:opacity-40 w-5 h-5 flex items-center justify-center"
              data-testid="decrease-quantity"
            >
              −
            </button>
            <span
              className="text-sm font-medium min-w-[16px] text-center"
              data-testid="product-quantity"
            >
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={updating}
              className="text-xl font-medium leading-none w-5 h-5 flex items-center justify-center"
              data-testid="increase-quantity"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Item
