import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(ModuleRegistrationName.FULFILLMENT)

  // ─── Sales channel ──────────────────────────────────────────────────────────

  logger.info("Seeding sales channel...")
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [{ name: "Default Sales Channel", description: "Created by Medusa" }],
    },
  })

  // ─── API key ────────────────────────────────────────────────────────────────

  const {
    result: [publishableApiKey],
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

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [defaultSalesChannel.id] },
  })

  // ─── Store ───────────────────────────────────────────────────────────────────
  // createStoresWorkflow is required here — the store does not exist yet at
  // migration time (it's not auto-created until server startup).

  logger.info("Seeding store...")
  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Default Store",
          supported_currencies: [
            { currency_code: "crc", is_default: true },
            { currency_code: "usd", is_default: false },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  })

  // ─── Region ─────────────────────────────────────────────────────────────────

  logger.info("Seeding Costa Rica region...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Costa Rica",
          currency_code: "crc",
          countries: ["cr"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regionResult[0]

  // ─── Tax region ─────────────────────────────────────────────────────────────

  logger.info("Seeding CR tax region...")
  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "cr", provider_id: "tp_system" }],
  })

  // ─── Stock location ─────────────────────────────────────────────────────────

  logger.info("Seeding stock location...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: "Bodega Central CR",
          address: { city: "San José", country_code: "CR", address_1: "" },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })

  // ─── Fulfillment set ─────────────────────────────────────────────────────────

  logger.info("Seeding fulfillment set...")
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfileResult[0]

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

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })

  // ─── Shipping options ────────────────────────────────────────────────────────

  logger.info("Seeding shipping options...")
  const commonRules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Envío Estándar",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Estándar", description: "Entrega en 2-3 días hábiles.", code: "standard" },
        prices: [
          { currency_code: "crc", amount: 3500 },
          { currency_code: "usd", amount: 8 },
          { region_id: region.id, amount: 3500 },
        ],
        rules: commonRules,
      },
      {
        name: "Envío Express",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: { label: "Express", description: "Entrega en 24 horas hábiles.", code: "express" },
        prices: [
          { currency_code: "crc", amount: 8000 },
          { currency_code: "usd", amount: 18 },
          { region_id: region.id, amount: 8000 },
        ],
        rules: commonRules,
      },
    ],
  })

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [defaultSalesChannel.id] },
  })

  // ─── Demo products ───────────────────────────────────────────────────────────

  logger.info("Seeding demo products...")
  const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        { name: "Shirts", is_active: true },
        { name: "Sweatshirts", is_active: true },
        { name: "Pants", is_active: true },
        { name: "Merch", is_active: true },
      ],
    },
  })

  const shirtVariants = (skuPrefix: string, sizes = ["S", "M", "L", "XL"], colors = ["Black", "White"]) =>
    sizes.flatMap((size) =>
      colors.map((color) => ({
        title: `${size} / ${color}`,
        sku: `${skuPrefix}-${size.toUpperCase()}-${color.toUpperCase()}`,
        options: { Size: size, Color: color },
        prices: [
          { currency_code: "crc", amount: 10_000 },
          { currency_code: "usd", amount: 15 },
        ],
      }))
    )

  const sizeOnlyVariants = (skuPrefix: string, crcAmount: number, usdAmount: number) =>
    ["S", "M", "L", "XL"].map((size) => ({
      title: size,
      sku: `${skuPrefix}-${size}`,
      options: { Size: size },
      prices: [
        { currency_code: "crc", amount: crcAmount },
        { currency_code: "usd", amount: usdAmount },
      ],
    }))

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Medusa T-Shirt",
          category_ids: [categoryResult.find((c) => c.name === "Shirts")!.id],
          description:
            "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          options: [
            { title: "Size", values: ["S", "M", "L", "XL"] },
            { title: "Color", values: ["Black", "White"] },
          ],
          variants: shirtVariants("SHIRT"),
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Medusa Sweatshirt",
          category_ids: [categoryResult.find((c) => c.name === "Sweatshirts")!.id],
          description:
            "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          handle: "sweatshirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" },
          ],
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: sizeOnlyVariants("SWEATSHIRT", 15_000, 20),
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Medusa Sweatpants",
          category_ids: [categoryResult.find((c) => c.name === "Pants")!.id],
          description:
            "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
          handle: "sweatpants",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png" },
          ],
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: sizeOnlyVariants("SWEATPANTS", 13_000, 18),
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Medusa Shorts",
          category_ids: [categoryResult.find((c) => c.name === "Merch")!.id],
          description:
            "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
          handle: "shorts",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" },
          ],
          options: [{ title: "Size", values: ["S", "M", "L", "XL"] }],
          variants: sizeOnlyVariants("SHORTS", 8_000, 12),
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
      ],
    },
  })

  // ─── Inventory levels ────────────────────────────────────────────────────────

  logger.info("Seeding inventory levels...")
  const { data: inventoryItems } = await query.graph({ entity: "inventory_item", fields: ["id"] })

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        inventory_item_id: item.id,
        stocked_quantity: 1_000_000,
      })),
    },
  })

  // ─── Refund reasons (translate Medusa core defaults to Spanish) ──────────────
  // Medusa's payment migration seeds these in English. We overwrite the labels
  // and descriptions here so every fresh DB gets Spanish from the start.

  logger.info("Translating refund reasons to Spanish...")
  const paymentModuleService = container.resolve(ModuleRegistrationName.PAYMENT)

  const refundReasons = await paymentModuleService.listRefundReasons()
  const translations: Record<string, { label: string; description: string }> = {
    shipping_issue: {
      label: "Problema de Envío",
      description: "Reembolso por envío perdido, retrasado o entregado incorrectamente",
    },
    customer_care_adjustment: {
      label: "Ajuste por Servicio al Cliente",
      description: "Reembolso otorgado como compensación o gesto de buena voluntad por inconvenientes",
    },
    pricing_error: {
      label: "Error de Precio",
      description: "Reembolso para corregir un cobro excesivo, descuento faltante o precio incorrecto",
    },
  }

  for (const reason of refundReasons) {
    const key = reason.label.toLowerCase().replace(/\s+/g, "_")
    const t = translations[key]
    if (t) {
      await paymentModuleService.updateRefundReasons([{ id: reason.id, ...t }])
    }
  }

  logger.info("✓ Initial data seed complete.")
  logger.info("  Store       → CRC (default) + USD")
  logger.info("  Region      → Costa Rica (cr)")
  logger.info("  Location    → Bodega Central CR, San José")
  logger.info("  Shipping    → Envío Estándar (₡3,500 / $8) + Envío Express (₡8,000 / $18)")
  logger.info("  Products    → T-Shirt, Sweatshirt, Sweatpants, Shorts (CRC + USD prices)")
  logger.info("  Inventory   → All variants at Bodega Central CR (qty: 1,000,000)")
  logger.info("  Refunds     → Labels translated to Spanish")
}
