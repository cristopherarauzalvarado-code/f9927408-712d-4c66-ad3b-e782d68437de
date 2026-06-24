import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const ONVO_PROVIDER_ID = "pp_onvo-pay_onvo-pay"

/**
 * Enlaza el provider de pago ONVO a la región Costa Rica.
 *
 * Por qué existe: la migración `initial-data-seed.ts` crea la región CR solo con
 * `pp_system_default`, y `seed.ts` no actualiza los providers de una región ya
 * existente. Este script repara ese estado de forma idempotente.
 *
 * Uso: npx medusa exec src/scripts/link-onvo-region.ts
 */
export default async function linkOnvoRegion({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
    filters: { name: "Costa Rica" },
  })

  const region = regions[0]
  if (!region) {
    logger.error("No se encontró la región 'Costa Rica'. ¿Corriste el seed?")
    return
  }

  const current: string[] = ((region.payment_providers ?? []) as { id: string }[])
    .map((p) => p?.id)
    .filter((id): id is string => Boolean(id))
  logger.info(`Región CR (${region.id}) — providers actuales: ${current.join(", ") || "ninguno"}`)

  if (current.includes(ONVO_PROVIDER_ID)) {
    logger.info(`ONVO (${ONVO_PROVIDER_ID}) ya está enlazado. Nada que hacer.`)
    return
  }

  const next = Array.from(new Set([...current, ONVO_PROVIDER_ID]))

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: region.id },
      update: { payment_providers: next },
    },
  })

  logger.info(`✓ ONVO enlazado. Providers ahora: ${next.join(", ")}`)
}
