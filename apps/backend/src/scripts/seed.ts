import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
} from "@medusajs/framework/utils"

import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

// Placeholder price applied to any variant that has no CRC price yet.
// Clients should set real prices via admin → Products after seeding.
const CRC_DEFAULT_PRICE = 10_000

export default async function seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT)

  // ─── Agency admin user ───────────────────────────────────────────────────────
  // User creation is intentionally NOT done here.
  // createAuthIdentities() bypasses the emailpass provider's scrypt hashing,
  // which would store the password in plaintext. Use the CLI instead:
  //
  //   npx medusa user -e admin@craia.net -p <password>
  //
  // Run this once after the first deploy, from the Railway shell or locally
  // with DATABASE_URL pointed at the client database.
  logger.info("Admin user: run post-seed → npx medusa user -e admin@craia.net -p <password>")

  // ─── Sales channel ──────────────────────────────────────────────────────────

  logger.info("Seeding sales channel...")
  const { data: existingChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })

  let salesChannelId: string
  if (existingChannels.length > 0) {
    salesChannelId = existingChannels[0].id
    logger.info(`Sales channel already exists (${existingChannels[0].name}), skipping.`)
  } else {
    const {
      result: [channel],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    })
    salesChannelId = channel.id
  }

  // ─── API key ────────────────────────────────────────────────────────────────

  logger.info("Seeding publishable API key...")
  const { data: existingApiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type"],
  })
  const existingPubKey = existingApiKeys.find((k) => k.type === "publishable")

  let apiKeyId: string
  if (existingPubKey) {
    apiKeyId = existingPubKey.id
    logger.info("Publishable API key already exists, skipping.")
  } else {
    const {
      result: [apiKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Default Publishable API Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    apiKeyId = apiKey.id

    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKeyId, add: [salesChannelId] },
    })
  }

  // ─── Store ──────────────────────────────────────────────────────────────────
  // Update the store that Medusa auto-creates. We set CRC as the default
  // currency and keep USD as optional. The store name is intentionally generic
  // ("Default Store") — clients rename it via the admin dashboard.

  logger.info("Updating store currencies to CRC (default) + USD...")
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name"],
  })
  const store = stores[0]

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "crc", is_default: true },
          { currency_code: "usd", is_default: false },
        ],
        default_sales_channel_id: salesChannelId,
      },
    },
  })

  // ─── Region ─────────────────────────────────────────────────────────────────

  logger.info("Seeding Costa Rica region...")
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  })
  const crRegion = existingRegions.find((r) => r.name === "Costa Rica")

  let regionId: string
  if (crRegion) {
    regionId = crRegion.id
    logger.info("Costa Rica region already exists, skipping.")
  } else {
    const { result: regions } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Costa Rica",
            currency_code: "crc",
            countries: ["cr"],
            payment_providers: ["pp_system_default", "pp_onvo-pay_onvo-pay"],
          },
        ],
      },
    })
    regionId = regions[0].id
  }

  // ─── Tax region ─────────────────────────────────────────────────────────────

  logger.info("Seeding Costa Rica tax region...")
  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  const hasCrTax = existingTaxRegions.some((t) => t.country_code === "cr")

  if (!hasCrTax) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "cr", provider_id: "tp_system" }],
    })
  } else {
    logger.info("CR tax region already exists, skipping.")
  }

  // ─── Shipping profile ────────────────────────────────────────────────────────
  // Auto-created by Medusa's own migrations — just read it.

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
  })
  const shippingProfileId = shippingProfiles[0].id

  // ─── Stock location ─────────────────────────────────────────────────────────

  logger.info("Seeding stock location...")
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const crLocation = existingLocations.find((l) => l.name === "Bodega Central CR")

  let stockLocationId: string
  if (crLocation) {
    stockLocationId = crLocation.id
    logger.info("Stock location already exists, skipping.")
  } else {
    const { result: locations } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Bodega Central CR",
            address: {
              city: "San José",
              country_code: "CR",
              address_1: "",
            },
          },
        ],
      },
    })
    stockLocationId = locations[0].id

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  }

  // ─── Fulfillment set ─────────────────────────────────────────────────────────

  logger.info("Seeding fulfillment set...")
  const existingFulfillmentSets = await fulfillmentModuleService.listFulfillmentSets(
    { name: ["Entrega Costa Rica"] },
    { relations: ["service_zones"] }
  )

  let serviceZoneId: string
  if (existingFulfillmentSets.length > 0) {
    serviceZoneId = existingFulfillmentSets[0].service_zones[0].id
    logger.info("Fulfillment set already exists, skipping.")
  } else {
    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Entrega Costa Rica",
      type: "shipping",
      service_zones: [
        {
          name: "Costa Rica",
          geo_zones: [{ country_code: "cr", type: "country" }],
        },
      ],
    })
    serviceZoneId = fulfillmentSet.service_zones[0].id

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
  }

  // ─── Shipping options ────────────────────────────────────────────────────────
  // Prices are stored as-is in Medusa v2 — no cents conversion.
  // CRC standard: ₡3,500 | CRC express: ₡8,000
  // USD standard: $8     | USD express: $18

  logger.info("Seeding shipping options...")
  const { data: existingShippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })

  const commonRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  if (!existingShippingOptions.find((o) => o.name === "Envío Estándar")) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Envío Estándar",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfileId,
          type: {
            label: "Estándar",
            description: "Entrega en 2-3 días hábiles.",
            code: "standard",
          },
          prices: [
            { currency_code: "crc", amount: 3500 },
            { currency_code: "usd", amount: 8 },
            { region_id: regionId, amount: 3500 },
          ],
          rules: commonRules,
        },
        {
          name: "Envío Express",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfileId,
          type: {
            label: "Express",
            description: "Entrega en 24 horas hábiles.",
            code: "express",
          },
          prices: [
            { currency_code: "crc", amount: 8000 },
            { currency_code: "usd", amount: 18 },
            { region_id: regionId, amount: 8000 },
          ],
          rules: commonRules,
        },
      ],
    })
  } else {
    logger.info("Shipping options already exist, skipping.")
  }

  // ─── Stock location ↔ sales channel link ─────────────────────────────────────

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocationId, add: [salesChannelId] },
  })

  // ─── Inventory levels ────────────────────────────────────────────────────────
  // Inventory items are auto-created by Medusa when product variants are created.
  // Inventory LEVELS (item ↔ location) must be created explicitly.
  // We only create missing levels — existing counts (set via admin) are preserved.

  logger.info("Seeding inventory levels for CR location...")
  const { data: allInventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id"],
    filters: { location_id: stockLocationId },
  })

  const leveledItemIds = new Set(existingLevels.map((l) => l.inventory_item_id))
  const itemsNeedingLevels = allInventoryItems.filter((i) => !leveledItemIds.has(i.id))

  if (itemsNeedingLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: itemsNeedingLevels.map((item) => ({
          location_id: stockLocationId,
          inventory_item_id: item.id,
          stocked_quantity: 1_000_000,
        })),
      },
    })
    logger.info(`Created ${itemsNeedingLevels.length} inventory level(s) at Bodega Central CR.`)
  } else {
    logger.info("All inventory items already have levels at CR location, skipping.")
  }

  // ─── CRC prices on product variants ──────────────────────────────────────────
  // Prices live on price_set records linked to variants via a module link.
  // addPrices() appends without replacing existing EUR/USD prices.

  logger.info("Seeding CRC prices on product variants...")
  const pricingModuleService = container.resolve(ModuleRegistrationName.PRICING)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "variants.id",
      "variants.price_set.id",
      "variants.price_set.prices.id",
      "variants.price_set.prices.currency_code",
    ],
  })

  const priceSetsToUpdate: { priceSetId: string; amount: number }[] = []

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const priceSet = variant.price_set
      if (!priceSet) continue
      const hasCrc = (priceSet.prices ?? []).some(
        (p) => p != null && p.currency_code === "crc"
      )
      if (!hasCrc) {
        priceSetsToUpdate.push({ priceSetId: priceSet.id, amount: CRC_DEFAULT_PRICE })
      }
    }
  }

  if (priceSetsToUpdate.length > 0) {
    await pricingModuleService.addPrices(
      priceSetsToUpdate.map(({ priceSetId, amount }) => ({
        priceSetId,
        prices: [{ currency_code: "crc", amount }],
      }))
    )
    logger.info(`Added CRC prices to ${priceSetsToUpdate.length} price set(s).`)
  } else {
    logger.info("All variants already have CRC prices, skipping.")
  }

  logger.info("✓ Seed complete. Summary:")
  logger.info("  Admin       → run: npx medusa user -e admin@craia.net -p <password>")
  logger.info("  Store       → CRC (default) + USD")
  logger.info("  Region      → Costa Rica (cr)")
  logger.info("  Tax         → tp_system / cr")
  logger.info("  Location    → Bodega Central CR, San José")
  logger.info("  Fulfillment → Entrega Costa Rica")
  logger.info("  Shipping    → Envío Estándar (₡3,500 / $8) + Envío Express (₡8,000 / $18)")
  logger.info("  Inventory   → All items linked to Bodega Central CR (qty: 1,000,000)")
  logger.info("  Prices      → CRC added to all product variants")
  logger.info("")
  logger.info("  Run via: npx medusa exec src/scripts/seed.ts")
}
