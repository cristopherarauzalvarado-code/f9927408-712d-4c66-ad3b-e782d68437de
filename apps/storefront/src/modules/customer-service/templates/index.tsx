import { siteConfig } from "@lib/site-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FaqAccordion, {
  FaqItem,
} from "@modules/customer-service/components/faq-accordion"

// Preguntas frecuentes. Editá libremente por cliente: los tiempos de envío,
// la política de cambios/devoluciones, los horarios y la cobertura dependen de
// cada tienda. Los textos de abajo son valores por defecto razonables para
// Costa Rica — ajustalos a tu operación real.
const faqs: FaqItem[] = [
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de crédito y débito (Visa, Mastercard y American Express) procesadas de forma segura a través de ONVO Pay. Tus datos de tarjeta se procesan cifrados y no se almacenan en nuestros servidores.",
  },
  {
    question: "¿Es seguro comprar en el sitio?",
    answer:
      "Sí. El pago se procesa mediante ONVO Pay con cifrado de extremo a extremo. Nunca vemos ni guardamos el número completo de tu tarjeta, y el sitio funciona sobre una conexión segura (HTTPS).",
  },
  {
    question: "¿Los precios incluyen impuestos?",
    answer:
      "Sí, todos los precios mostrados están en colones e incluyen los impuestos correspondientes. El total final, junto con el costo de envío, se muestra claramente antes de confirmar tu compra.",
  },
  {
    question: "¿Emiten factura electrónica?",
    answer:
      "Sí. Emitimos factura electrónica por cada compra, conforme a la normativa de Hacienda. La recibís en el correo que indicaste al momento de tu pedido.",
  },
  {
    question: "¿Cuánto tarda el envío?",
    answer:
      "Procesamos los pedidos en 24–48 horas hábiles. Una vez despachado:\n• Gran Área Metropolitana (GAM): 1 a 3 días hábiles.\n• Resto del país: 3 a 6 días hábiles.\nCon Envío Express la entrega es más rápida. El costo se calcula automáticamente en el checkout según el método que elijas.",
  },
  {
    question: "¿Hacen envíos a todo el país?",
    answer:
      "Sí, realizamos envíos a todo Costa Rica desde nuestra bodega central en San José. Por ahora no realizamos envíos internacionales.",
  },
  {
    question: "¿Cómo sigo el estado de mi pedido?",
    answer:
      "Apenas hacés el pedido recibís un correo de confirmación. Podés ver el estado en cualquier momento desde tu cuenta, en la sección «Pedidos». Si creaste tu cuenta, ahí también queda el historial completo.",
  },
  {
    question: "¿Qué pasa si un producto aparece agotado?",
    answer:
      "Si un producto no tiene existencias no podrás agregarlo al carrito. Solemos reponer inventario con frecuencia, así que te invitamos a revisar más adelante o a escribirnos para consultar por disponibilidad.",
  },
  {
    question: "¿Puedo cancelar o modificar mi pedido?",
    answer:
      "Si tu pedido todavía no fue despachado, escribinos lo antes posible y hacemos el cambio o la cancelación. Una vez que el pedido salió de bodega ya no es posible modificarlo, pero podés gestionar una devolución cuando lo recibás.",
  },
  {
    question: "¿Puedo cambiar o devolver un producto?",
    answer:
      "Sí. Aceptamos cambios y devoluciones dentro de los 7 días posteriores a la entrega, siempre que el producto esté sin uso, con sus etiquetas y empaque original. Escribinos y te indicamos los pasos.",
  },
  {
    question: "¿Necesito crear una cuenta para comprar?",
    answer:
      "No es obligatorio: podés completar tu compra como invitado. Crear una cuenta te permite guardar direcciones, hacer seguimiento de tus pedidos y comprar más rápido la próxima vez.",
  },
  {
    question: "¿Cuál es el horario de atención?",
    answer:
      "Atendemos consultas de lunes a viernes de 8:00 a.m. a 5:00 p.m. y sábados de 9:00 a.m. a 1:00 p.m. Fuera de ese horario podés escribirnos y te respondemos el siguiente día hábil.",
  },
  {
    question: "¿Cómo los contacto?",
    answer: `Escribinos a ${siteConfig.support.email} o llamanos al ${siteConfig.support.phone}. También podés usar el botón de WhatsApp del sitio. Te respondemos lo antes posible dentro de nuestro horario de atención.`,
  },
]

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="-rotate-90 opacity-60">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ContactCard = ({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: string
  href: string
  icon: React.ReactNode
}) => (
  <a
    href={href}
    className="flex items-center gap-4 rounded-[16px] border border-black/10 p-5 hover:border-black transition-colors"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
      {icon}
    </span>
    <span className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-black/50">{label}</span>
      <span className="font-medium text-black">{value}</span>
    </span>
  </a>
)

const CustomerServiceTemplate = () => {
  const { support } = siteConfig
  const whatsappHref = support.whatsapp
    ? `https://wa.me/${support.whatsapp.replace(/\D/g, "")}`
    : null

  return (
    <div className="max-w-[900px] mx-auto px-4 small:px-6 py-6 small:py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-black/60 mb-6 flex-wrap">
        <LocalizedClientLink href="/" className="hover:text-black transition-colors">
          Inicio
        </LocalizedClientLink>
        <ChevronRight />
        <span className="text-black font-medium">Atención al cliente</span>
      </div>

      {/* Hero */}
      <h1 className="font-heading font-black text-[32px] small:text-[48px] uppercase text-black mb-3">
        ¿Cómo podemos ayudarte?
      </h1>
      <p className="text-sm small:text-base text-black/60 mb-10 max-w-[640px]">
        Encontrá respuestas a las preguntas más comunes sobre pagos, envíos,
        pedidos y devoluciones. Si no encontrás lo que buscás, escribinos y con
        gusto te ayudamos.
      </p>

      {/* FAQ */}
      <h2 className="font-bold text-xl small:text-2xl text-black mb-4">
        Preguntas frecuentes
      </h2>
      <FaqAccordion items={faqs} />

      {/* Contacto */}
      <h2 className="font-bold text-xl small:text-2xl text-black mt-12 mb-4">
        Contactanos
      </h2>
      <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
        <ContactCard
          label="Correo"
          value={support.email}
          href={`mailto:${support.email}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16.7 3.3H3.3A1.7 1.7 0 001.7 5v10a1.7 1.7 0 001.6 1.7h13.4A1.7 1.7 0 0018.3 15V5a1.7 1.7 0 00-1.6-1.7z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1.7 5l8.3 5.8L18.3 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          }
        />
        <ContactCard
          label="Teléfono"
          value={support.phone}
          href={`tel:${support.phone.replace(/\s/g, "")}`}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18 14.1v2.5a1.7 1.7 0 01-1.8 1.7 16.5 16.5 0 01-7.2-2.6 16.3 16.3 0 01-5-5A16.5 16.5 0 011.4 3.5 1.7 1.7 0 013.1 1.7h2.5a1.7 1.7 0 011.7 1.4c.1.8.3 1.6.6 2.4a1.7 1.7 0 01-.4 1.8l-1 1a13.3 13.3 0 005 5l1-1a1.7 1.7 0 011.8-.4c.8.3 1.6.5 2.4.6a1.7 1.7 0 011.4 1.7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        {whatsappHref && (
          <ContactCard
            label="WhatsApp"
            value={support.phone}
            href={whatsappHref}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 00-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.1-.3.2-.5 0a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.6-1.2l-.1-.3-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3c-.3.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.2.7 3 .6.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.3z" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  )
}

export default CustomerServiceTemplate
