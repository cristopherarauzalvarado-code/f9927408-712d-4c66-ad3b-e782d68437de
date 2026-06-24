import OnvoPayService from "@craiahq/medusa-plugin-base/dist/modules/onvo-pay/service"
import type { WebhookActionResult } from "@medusajs/framework/types"

/**
 * Local override of the ONVO payment provider.
 *
 * Fixes the webhook capture flow in @craiahq/medusa-plugin-base@0.2.0, whose
 * `getWebhookActionAndData`:
 *   1. matched the event type `payment_intent.succeeded` (underscore), but ONVO
 *      actually sends `payment-intent.succeeded` (hyphen), wrapped as
 *      `{ type, data }`; and
 *   2. returned `{ action }` without `data.session_id` / `data.amount`, which
 *      Medusa requires to correlate the webhook to a payment.
 *
 * Keeps the same provider identifier ("onvo-pay") so the provider id stays
 * `pp_onvo-pay_onvo-pay` and existing region links / sessions keep working.
 *
 * Remove this override once the fix is published upstream in the plugin and the
 * dependency is bumped.
 */
class OnvoPayPatchedService extends OnvoPayService {
  static identifier = "onvo-pay"

  async getWebhookActionAndData(
    payload: { data?: unknown }
  ): Promise<WebhookActionResult> {
    const event = payload?.data as {
      type?: string
      data?: {
        amount?: number
        status?: string
        metadata?: { session_id?: string }
      }
    }

    const intent = event?.data
    const sessionId = intent?.metadata?.session_id
    // ONVO amounts are in minor units (cents); Medusa expects the major unit.
    const amount =
      typeof intent?.amount === "number" ? intent.amount / 100 : 0

    if (!sessionId) {
      return { action: "not_supported" }
    }

    switch (event?.type) {
      case "payment-intent.succeeded":
        return { action: "captured", data: { session_id: sessionId, amount } }
      case "payment-intent.failed":
      case "payment-intent.payment_failed":
        return { action: "failed", data: { session_id: sessionId, amount } }
      default:
        return { action: "not_supported" }
    }
  }
}

export default OnvoPayPatchedService
