/**
 * Configuración de marca del storefront — punto único para personalizar por cliente.
 *
 * El nombre y los colores se leen de variables de entorno (con defaults), de modo
 * que cada repo de cliente solo cambia su `.env.local` sin tocar componentes.
 *
 * - NEXT_PUBLIC_STORE_NAME           → nombre de la tienda (logo, metadatos)
 * - NEXT_PUBLIC_BRAND_PRIMARY        → color primario de marca (botones, badges, barra)
 * - NEXT_PUBLIC_BRAND_PRIMARY_FG     → color del texto sobre el primario
 * - NEXT_PUBLIC_SUPPORT_EMAIL        → correo de atención al cliente
 * - NEXT_PUBLIC_SUPPORT_PHONE        → teléfono de atención al cliente
 * - NEXT_PUBLIC_SUPPORT_WHATSAPP     → número de WhatsApp (solo dígitos, formato wa.me)
 *
 * Los colores se exponen como variables CSS (--brand-primary / --brand-primary-foreground)
 * inyectadas en el layout raíz, y como tokens de Tailwind `brand` / `brand-foreground`.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "SHOP.CO",
  description:
    process.env.NEXT_PUBLIC_STORE_DESCRIPTION ||
    "We have clothes that suits your style and which you're proud to wear. From women to men.",
  brand: {
    primary: process.env.NEXT_PUBLIC_BRAND_PRIMARY || "#000000",
    primaryForeground: process.env.NEXT_PUBLIC_BRAND_PRIMARY_FG || "#FFFFFF",
  },
  support: {
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "soporte@mitienda.com",
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+506 0000-0000",
    whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "",
  },
}

/** Variables CSS de marca para inyectar en <html>. */
export const brandCssVars = {
  "--brand-primary": siteConfig.brand.primary,
  "--brand-primary-foreground": siteConfig.brand.primaryForeground,
} as React.CSSProperties
