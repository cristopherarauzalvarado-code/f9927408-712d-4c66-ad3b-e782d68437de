import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { siteConfig } from "@lib/site-config"
import CartButton from "@modules/layout/components/cart-button"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import SideMenu from "@modules/layout/components/side-menu"
import AnnouncementBar from "@modules/layout/components/announcement-bar"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <AnnouncementBar />
      <header className="bg-white border-b border-gray-100">
        <nav className="max-w-[1440px] mx-auto px-4 small:px-6 flex items-center justify-between h-14 small:h-[86px] gap-4 small:gap-6">

          {/* Mobile: hamburger menu */}
          <div className="small:hidden flex items-center shrink-0">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>

          {/* Logo */}
          <LocalizedClientLink
            href="/"
            className="font-heading font-black text-xl small:text-2xl tracking-wider uppercase text-black whitespace-nowrap"
            data-testid="nav-store-link"
          >
            {siteConfig.name}
          </LocalizedClientLink>

          {/* Desktop: nav links */}
          <div className="hidden small:flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors">
              <LocalizedClientLink href="/store">Tienda</LocalizedClientLink>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <LocalizedClientLink href="/store" className="hover:text-gray-600 transition-colors whitespace-nowrap">
              Ofertas
            </LocalizedClientLink>
            <LocalizedClientLink href="/store" className="hover:text-gray-600 transition-colors whitespace-nowrap">
              Novedades
            </LocalizedClientLink>
            <LocalizedClientLink href="/store" className="hover:text-gray-600 transition-colors">
              Marcas
            </LocalizedClientLink>
          </div>

          {/* Desktop: search bar */}
          <div className="hidden small:flex flex-1 max-w-[577px] bg-[#F0F0F0] rounded-full px-4 py-3 items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 opacity-40">
              <path
                d="M17.5 17.5L12.5 12.5M14.167 8.333a5.833 5.833 0 11-11.667 0 5.833 5.833 0 0111.667 0z"
                stroke="black"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent outline-none text-sm w-full text-black/40 placeholder:text-black/40"
            />
          </div>

          {/* Icons — search shown on mobile too */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Search icon — mobile only */}
            <LocalizedClientLink
              href="/store"
              className="small:hidden hover:opacity-70 transition-opacity"
              aria-label="Buscar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 21L15 15M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </LocalizedClientLink>

            {/* Cart */}
            <Suspense
              fallback={
                <LocalizedClientLink href="/cart" className="hover:opacity-70 transition-opacity" data-testid="nav-cart-link" aria-label="Carrito">
                  <ShoppingBag size={24} color="black" />
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>

            {/* Account */}
            <LocalizedClientLink
              href="/account"
              className="hover:opacity-70 transition-opacity"
              data-testid="nav-account-link"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                  stroke="black"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </LocalizedClientLink>
          </div>

        </nav>
      </header>
    </div>
  )
}
