import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 small:px-[100px] py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-black/60 mb-6">
        <LocalizedClientLink href="/" className="hover:text-black transition-colors">
          Inicio
        </LocalizedClientLink>
        <ChevronRight />
        <span className="text-black font-medium">Carrito</span>
      </div>

      <h1
        className="font-heading font-black text-[32px] small:text-[40px] uppercase text-black mb-6"
        data-testid="cart-page-title"
      >
        Tu carrito
      </h1>

      {cart?.items?.length ? (
        <div className="flex flex-col small:flex-row gap-5 small:items-start" data-testid="cart-container">
          {/* Cart items */}
          <div className="flex-1 min-w-0">
            <ItemsTemplate cart={cart} />
          </div>

          {/* Order summary */}
          {cart.region && (
            <div className="w-full small:w-[505px] shrink-0">
              <Summary cart={cart} />
            </div>
          )}
        </div>
      ) : (
        <div data-testid="empty-cart-message">
          <EmptyCartMessage />
        </div>
      )}
    </div>
  )
}

function ChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="-rotate-90 opacity-60"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default CartTemplate
