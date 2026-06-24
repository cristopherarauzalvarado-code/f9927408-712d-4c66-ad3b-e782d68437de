import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type SetPaymentMethodBody = {
  payment_session_id?: string
  payment_method_id?: string
}

/**
 * POST /store/onvo/set-payment-method
 *
 * Updates an ONVO payment session's data with a payment_method_id obtained
 * from ONVO's frontend tokenization API. Called by the storefront after the
 * customer enters card details and the browser tokenizes them directly with ONVO.
 *
 * This is required because Medusa's authorizePayment for ONVO expects
 * payment_method_id in the session data before it can confirm the payment intent.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as SetPaymentMethodBody

  if (!body.payment_session_id || !body.payment_method_id) {
    return res
      .status(400)
      .json({ message: "payment_session_id and payment_method_id are required" })
  }

  const paymentModule = req.scope.resolve(Modules.PAYMENT)

  const [session] = await paymentModule.listPaymentSessions(
    { id: body.payment_session_id },
    { select: ["id", "data", "status", "provider_id", "currency_code", "amount"] }
  )

  if (!session) {
    return res.status(404).json({ message: "Payment session not found" })
  }

  if (session.status !== "pending") {
    return res.status(400).json({ message: "Payment session is not in pending state" })
  }

  if (!session.provider_id?.startsWith("pp_onvo-pay")) {
    return res.status(400).json({ message: "Payment session is not an ONVO session" })
  }

  await paymentModule.updatePaymentSession({
    id: session.id,
    currency_code: session.currency_code,
    amount: session.amount,
    data: {
      ...(session.data as Record<string, unknown>),
      payment_method_id: body.payment_method_id,
    },
  })

  res.status(200).json({ success: true })
}
