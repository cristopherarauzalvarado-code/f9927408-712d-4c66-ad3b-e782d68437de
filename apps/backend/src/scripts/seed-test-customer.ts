import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createCustomersWorkflow } from "@medusajs/medusa/core-flows"
import scryptKdf from "scrypt-kdf"

const EMAIL = "test@craia.net"
const PASSWORD = "password123"

export default async function seedTestCustomer({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const authModuleService = container.resolve(Modules.AUTH)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ─── Customer ────────────────────────────────────────────────────────────────

  const { data: existingCustomers } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { email: EMAIL },
  })

  let customerId: string
  if (existingCustomers.length > 0) {
    customerId = existingCustomers[0].id
    logger.info(`Customer ${EMAIL} already exists (${customerId}), skipping.`)
  } else {
    const { result } = await createCustomersWorkflow(container).run({
      input: {
        customersData: [{ email: EMAIL, first_name: "Test", last_name: "CRAIA" }],
      },
    })
    customerId = result[0].id
    logger.info(`Created customer ${EMAIL} (${customerId})`)
  }

  // ─── Auth identity ───────────────────────────────────────────────────────────
  // Uses the same scrypt-kdf config as the emailpass provider (logN:15, r:8, p:1)
  // so the storefront login flow can verify it normally.

  const existingIdentities = await authModuleService.listAuthIdentities({
    provider_identities: { entity_id: EMAIL, provider: "emailpass" },
  })

  if (existingIdentities.length > 0) {
    logger.info(`Auth identity for ${EMAIL} already exists, skipping.`)
  } else {
    const passwordHash = (
      await scryptKdf.kdf(PASSWORD, { logN: 15, r: 8, p: 1 })
    ).toString("base64")

    await authModuleService.createAuthIdentities([
      {
        provider_identities: [
          {
            entity_id: EMAIL,
            provider: "emailpass",
            provider_metadata: { password: passwordHash },
          },
        ],
        app_metadata: { customer_id: customerId },
      },
    ])
    logger.info(`Created auth identity for ${EMAIL}`)
  }

  logger.info("✓ Test customer ready:")
  logger.info(`  Email    → ${EMAIL}`)
  logger.info(`  Password → ${PASSWORD}`)
  logger.info(`  ID       → ${customerId}`)
  logger.info("")
  logger.info("  Run via: npx medusa exec src/scripts/seed-test-customer.ts")
}
