import { siteConfig } from "@lib/site-config"

/**
 * Botón flotante de WhatsApp (esquina inferior derecha), visible en todo el sitio.
 * Solo se muestra si hay un número configurado en NEXT_PUBLIC_SUPPORT_WHATSAPP.
 */
const WhatsAppButton = () => {
  const number = siteConfig.support.whatsapp.replace(/\D/g, "")
  if (!number) return null

  const message = encodeURIComponent(
    `¡Hola! Tengo una consulta sobre ${siteConfig.name}.`
  )

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 small:bottom-6 small:right-6"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5 0a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.6-1.2l-.1-.3-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3z" />
      </svg>
    </a>
  )
}

export default WhatsAppButton
