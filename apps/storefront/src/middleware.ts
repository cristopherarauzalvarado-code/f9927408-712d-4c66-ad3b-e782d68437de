import { NextRequest, NextResponse } from "next/server"

/**
 * Costarican Adventures usa una sola región comercial (Costa Rica) y URLs limpias
 * (`/`, `/tours/[slug]`, `/checkout`). No se inyecta prefijo de país en la URL.
 *
 * El middleware se reduce a garantizar la cookie `_medusa_cache_id`, que el resto
 * del data layer (caché de regiones/carrito vía SDK) usa para etiquetar el caché.
 */
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")

  if (cacheIdCookie) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  response.cookies.set("_medusa_cache_id", crypto.randomUUID(), {
    maxAge: 60 * 60 * 24,
  })
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
