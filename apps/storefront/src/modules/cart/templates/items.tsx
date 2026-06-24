import { HttpTypes } from "@medusajs/types"

import Item from "@modules/cart/components/item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
    ? [...cart.items].sort((a, b) =>
        (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
      )
    : []

  return (
    <div
      className="border border-black/10 rounded-[20px] p-5 small:p-6 flex flex-col gap-6"
      data-testid="items-table"
    >
      {items.map((item, index) => (
        <div key={item.id} className="flex flex-col gap-6">
          <Item item={item} currencyCode={cart?.currency_code ?? "usd"} />
          {index < items.length - 1 && (
            <div className="border-t border-black/10" />
          )}
        </div>
      ))}
    </div>
  )
}

export default ItemsTemplate
