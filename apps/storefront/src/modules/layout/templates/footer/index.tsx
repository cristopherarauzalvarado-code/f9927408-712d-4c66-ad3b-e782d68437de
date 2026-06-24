import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { siteConfig } from "@lib/site-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewsletterForm from "@modules/layout/components/newsletter-form"
import Amex from "@modules/common/icons/amex"
import ApplePay from "@modules/common/icons/apple-pay"
import GooglePay from "@modules/common/icons/google-pay"
import Mastercard from "@modules/common/icons/mastercard"
import PaypalBadge from "@modules/common/icons/paypal-badge"
import Visa from "@modules/common/icons/visa"

const socialLinks = [
  {
    name: "Twitter",
    href: "#",
    icon: (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M11.5 1.25c-.41.18-.86.3-1.33.36.48-.29.84-.74 1.01-1.28-.45.27-.94.46-1.47.56A2.31 2.31 0 008.08.25c-1.28 0-2.32 1.04-2.32 2.32 0 .18.02.36.06.53C3.73 2.97 2.1 2.04 1 .6c-.2.34-.31.74-.31 1.16 0 .8.41 1.51 1.03 1.92-.38-.01-.74-.12-1.05-.29v.03c0 1.12.8 2.06 1.86 2.27-.19.05-.4.08-.61.08-.15 0-.3-.01-.44-.04.3.92 1.15 1.59 2.16 1.61A4.65 4.65 0 010 8.37c1.04.67 2.28 1.06 3.61 1.06 4.33 0 6.7-3.59 6.7-6.7 0-.1 0-.2-.01-.3.46-.33.86-.75 1.18-1.23L11.5 1.25z" fill="currentColor"/>
      </svg>
    ),
    bg: "bg-white border border-black/20",
    color: "text-black",
  },
  {
    name: "Facebook",
    href: "#",
    icon: (
      <svg width="7" height="13" viewBox="0 0 7 13" fill="none">
        <path d="M4.5 4.5V3c0-.55.45-1 1-1H6.5V0H4.5C3.12 0 2 1.12 2 2.5V4.5H0V7h2v6h2.5V7H6L6.5 4.5H4.5z" fill="white"/>
      </svg>
    ),
    bg: "bg-black",
    color: "text-white",
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="10.5" cy="3.5" r="0.75" fill="currentColor"/>
      </svg>
    ),
    bg: "bg-white border border-black/20",
    color: "text-black",
  },
  {
    name: "GitHub",
    href: "#",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 .5C3.41.5.5 3.41.5 7c0 2.87 1.86 5.3 4.44 6.16.32.06.44-.14.44-.31 0-.15-.01-.56-.01-1.1-1.8.39-2.18-.87-2.18-.87-.3-.75-.72-.95-.72-.95-.59-.4.04-.4.04-.4.65.05 1 .67 1 .67.58 1 1.52.71 1.89.54.06-.42.23-.71.41-.87-1.44-.16-2.95-.72-2.95-3.2 0-.71.25-1.29.67-1.74-.07-.16-.29-.82.06-1.71 0 0 .55-.18 1.8.67A6.3 6.3 0 017 3.9c.56 0 1.12.07 1.65.22 1.24-.85 1.79-.67 1.79-.67.35.89.13 1.55.06 1.71.42.45.67 1.03.67 1.74 0 2.49-1.52 3.04-2.96 3.2.23.2.44.6.44 1.2 0 .87-.01 1.57-.01 1.78 0 .17.12.37.44.31A6.51 6.51 0 0013.5 7C13.5 3.41 10.59.5 7 .5z" fill="currentColor"/>
      </svg>
    ),
    bg: "bg-white border border-black/20",
    color: "text-black",
  },
]

const footerLinks = [
  {
    title: "EMPRESA",
    links: [
      { label: "Nosotros", href: "/store" },
      { label: "Tienda", href: "/store" },
      { label: "Novedades", href: "/store" },
      { label: "Marcas", href: "/store" },
    ],
  },
  {
    title: "AYUDA",
    links: [
      { label: "Atención al cliente", href: "/customer-service" },
      { label: "Detalles de envío", href: "/customer-service" },
      { label: "Preguntas frecuentes", href: "/customer-service" },
      { label: "Devoluciones", href: "/customer-service" },
    ],
  },
  {
    title: "MI CUENTA",
    links: [
      { label: "Mi cuenta", href: "/account" },
      { label: "Mis pedidos", href: "/account" },
      { label: "Direcciones", href: "/account" },
      { label: "Carrito", href: "/cart" },
    ],
  },
  {
    title: "RECURSOS",
    links: [
      { label: "Preguntas frecuentes", href: "/customer-service" },
      { label: "Pagos", href: "/customer-service" },
      { label: "Envíos", href: "/customer-service" },
      { label: "Contacto", href: "/customer-service" },
    ],
  },
]

const paymentMethods = [
  { name: "Visa", Logo: Visa },
  { name: "Mastercard", Logo: Mastercard },
  { name: "American Express", Logo: Amex },
  { name: "PayPal", Logo: PaypalBadge },
  { name: "Apple Pay", Logo: ApplePay },
  { name: "Google Pay", Logo: GooglePay },
]

export default async function Footer() {
  return (
    <footer className="w-full">
      {/* Newsletter banner */}
      <div className="max-w-[1440px] mx-auto px-4 small:px-6 py-8 small:py-10">
        <div className="bg-black rounded-[20px] px-6 py-8 small:px-16 small:py-10 flex flex-col small:flex-row items-start small:items-center justify-between gap-6 small:gap-8">
          <h3 className="font-heading font-black text-[28px] small:text-[40px] text-white max-w-[297px] small:max-w-[551px] leading-[1.1] uppercase">
            Mantenete al día con nuestras últimas ofertas
          </h3>
          <NewsletterForm />
        </div>
      </div>

      {/* Footer links */}
      <div className="bg-[#F0F0F0]">
        <div className="max-w-[1440px] mx-auto px-4 small:px-6 py-10 small:py-12">
          <div className="flex flex-col small:flex-row justify-between gap-10">
            {/* Brand column */}
            <div className="small:max-w-[248px]">
              <LocalizedClientLink href="/" className="font-heading font-black text-2xl tracking-wider uppercase text-black block mb-5">
                {siteConfig.name}
              </LocalizedClientLink>
              <p className="text-black/60 text-sm leading-relaxed mb-6">
                {siteConfig.description}
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${social.bg} ${social.color}`}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 small:grid-cols-4 gap-8 flex-1">
              {footerLinks.map((col) => (
                <div key={col.title}>
                  <h4 className="font-medium text-sm tracking-[0.2em] uppercase text-black mb-6">
                    {col.title}
                  </h4>
                  <ul className="flex flex-col gap-4">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <LocalizedClientLink
                          href={link.href}
                          className="text-sm text-black/60 hover:text-black transition-colors"
                        >
                          {link.label}
                        </LocalizedClientLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-black/10 mt-10 pt-6 flex flex-col small:flex-row items-center justify-between gap-4">
            <p className="text-sm text-black/60">
              © 2000-{new Date().getFullYear()} {siteConfig.name}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              {paymentMethods.map(({ name, Logo }) => (
                <span key={name} aria-label={name} title={name} className="shadow-sm rounded">
                  <Logo size={36} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
