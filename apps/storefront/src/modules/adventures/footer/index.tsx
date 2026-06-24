import Image from "next/image"
import Link from "next/link"
import { site, whatsappLink } from "@lib/adventures/site"
import PaymentLogo from "@modules/adventures/common/payment-icons"

export default function Footer() {
  return (
    <footer
      id="contacto"
      className="border-t border-jungle-line bg-[#F7F8FA]"
    >
      <div className="content-container grid gap-10 py-16 small:grid-cols-2 medium:grid-cols-4">
        <div className="medium:col-span-1">
          <Image
            src="/logo.png"
            alt="Costarican Adventures"
            width={418}
            height={136}
            className="h-12 w-auto"
          />
          <p className="mt-4 max-w-xs font-sans text-sm font-medium leading-relaxed text-ink-muted">
            Aventuras reales en Costa Rica desde {site.foundedYear}. Transporte,
            guía y comida incluidos.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Explorar</h3>
          <ul className="space-y-2.5 font-sans text-sm font-medium text-ink-muted">
            <li><Link href="/#tours" className="hover:text-ink">Tours nacionales</Link></li>
            <li><Link href="/tours/isla-del-coco-buceo" className="hover:text-ink">Buceo Isla del Coco</Link></li>
            <li><Link href="/#villas" className="hover:text-ink">Villas y hospedaje</Link></li>
            <li><Link href="/#internacional" className="hover:text-ink">Viajes internacionales</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Contacto</h3>
          <ul className="space-y-2.5 font-sans text-sm font-medium text-ink-muted">
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink"
              >
                WhatsApp {site.whatsapp.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-ink">
                {site.email}
              </a>
            </li>
            <li>{site.address}</li>
            <li>{site.departure}</li>
            <li>Horario: {site.hours}</li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4">Pagos</h3>
          <div className="flex flex-wrap items-center gap-2">
            {site.payments.map((p) => (
              <span
                key={p}
                title={p}
                className="flex h-9 min-w-[52px] items-center justify-center rounded-lg border border-jungle-line bg-white px-3"
              >
                <PaymentLogo name={p} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-jungle-line">
        <div className="content-container flex flex-col items-center justify-between gap-2 py-5 font-sans text-xs font-medium text-ink-faint small:flex-row">
          <span>
            © {new Date().getFullYear()} Costarican Adventures. Todos los
            derechos reservados.
          </span>
          <span>Hecho con 🌿 en Costa Rica</span>
        </div>
      </div>
    </footer>
  )
}
