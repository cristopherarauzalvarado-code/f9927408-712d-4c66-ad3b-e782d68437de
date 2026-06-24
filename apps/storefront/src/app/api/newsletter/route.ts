import { NextResponse } from "next/server"

/**
 * Suscripción al newsletter.
 *
 * Valida el email y, si `NEWSLETTER_WEBHOOK_URL` está configurado, reenvía el
 * email a ese endpoint (Mailchimp/Brevo/Zapier/webhook propio, etc.). Si no hay
 * webhook configurado, responde OK igual para que el flujo funcione en dev — el
 * cliente solo tiene que setear la variable para conectarlo a su proveedor.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let email: string | undefined
  try {
    const body = await request.json()
    email = typeof body?.email === "string" ? body.email.trim() : undefined
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 })
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Ingresá un correo electrónico válido." },
      { status: 400 }
    )
  }

  const webhookUrl = process.env.NEWSLETTER_WEBHOOK_URL

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error(`Webhook respondió ${res.status}`)
    } catch (err) {
      console.error("[newsletter] error al reenviar al webhook:", err)
      return NextResponse.json(
        { error: "No pudimos completar la suscripción. Intentá más tarde." },
        { status: 502 }
      )
    }
  } else {
    // Sin proveedor configurado: dejamos rastro para no perder el lead en dev.
    console.info(`[newsletter] suscripción (sin webhook configurado): ${email}`)
  }

  return NextResponse.json({ success: true })
}
