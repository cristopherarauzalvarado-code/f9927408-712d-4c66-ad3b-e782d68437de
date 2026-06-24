# CR Seed Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `seed.ts` with two new idempotent phases — inventory levels for the CR stock location and CRC prices on all product variant price sets — so a single `npm run seed` produces a fully working CR storefront.

**Architecture:** Both phases append to the end of the existing `seed.ts` function. Phase 11 queries all inventory items, diffs against existing levels at the CR location, and creates missing ones. Phase 12 queries all products → variants → price sets, finds price sets without a CRC price, and adds one via the pricing module service.

**Tech Stack:** Medusa v2 (`@medusajs/framework`, `@medusajs/medusa/core-flows`), TypeScript, `query.graph()` for data retrieval, `pricingModuleService.addPrices()` for price writes, `createInventoryLevelsWorkflow` for inventory writes.

---

## File map

| File | Change |
|---|---|
| `apps/backend/src/scripts/seed.ts` | Add `createInventoryLevelsWorkflow` import + Phase 11 + Phase 12 code |

---

### Task 1: Add `createInventoryLevelsWorkflow` import

**Files:**
- Modify: `apps/backend/src/scripts/seed.ts:7-17`

The workflow is already installed (part of `@medusajs/medusa`) but not yet imported.

- [ ] **Step 1: Add the import**

Replace the existing core-flows import block (lines 7–17) with:

```typescript
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
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd apps/backend
npx tsc --noEmit
```

Expected: only the existing npm warn about `auto-install-peers`, zero TypeScript errors.

---

### Task 2: Add Phase 11 — inventory levels

**Files:**
- Modify: `apps/backend/src/scripts/seed.ts` (append before the final summary log block)

- [ ] **Step 1: Insert Phase 11 block**

Locate the line:
```typescript
  logger.info("✓ Seed complete. Summary:")
```

Insert the following block immediately above it:

```typescript
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

```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero TypeScript errors.

---

### Task 3: Add Phase 12 — CRC prices on product variants

**Files:**
- Modify: `apps/backend/src/scripts/seed.ts` (append after Phase 11, before the summary log)

The pricing module service exposes `addPrices()` which appends prices to an existing price set without touching other currencies. The price set for each variant is accessible via `query.graph()` by traversing the module link: `product → variants → price_set → prices`.

- [ ] **Step 1: Insert the CRC price helper function**

Add this function at the **module level** (outside the `seed` export, just before the `export default` line):

```typescript
function crcAmountForProduct(productTitle: string): number {
  const t = productTitle.toLowerCase()
  if (t.includes("sweatshirt")) return 15_000
  if (t.includes("sweatpants") || t.includes("pants")) return 13_000
  if (t.includes("shirt")) return 10_000
  if (t.includes("shorts")) return 8_000
  return 10_000
}
```

- [ ] **Step 2: Insert Phase 12 block**

Immediately after the Phase 11 block (still above the summary log), insert:

```typescript
  // ─── CRC prices on product variants ──────────────────────────────────────────
  // Prices live on price_set records linked to variants via a module link.
  // addPrices() appends without replacing existing EUR/USD prices.

  logger.info("Seeding CRC prices on product variants...")
  const pricingModuleService = container.resolve(ModuleRegistrationName.PRICING)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "variants.id",
      "variants.price_set.id",
      "variants.price_set.prices.id",
      "variants.price_set.prices.currency_code",
    ],
  })

  const priceSetsToUpdate: { priceSetId: string; amount: number }[] = []

  for (const product of products) {
    const amount = crcAmountForProduct(product.title)
    for (const variant of product.variants ?? []) {
      const priceSet = variant.price_set
      if (!priceSet) continue
      const hasCrc = (priceSet.prices ?? []).some(
        (p: { currency_code: string }) => p.currency_code === "crc"
      )
      if (!hasCrc) {
        priceSetsToUpdate.push({ priceSetId: priceSet.id, amount })
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

```

- [ ] **Step 3: Update the summary log to mention CRC prices**

Find this line:
```typescript
  logger.info("  Shipping    → Envío Estándar (₡3,500 / $8) + Envío Express (₡8,000 / $18)")
```

Replace it with:
```typescript
  logger.info("  Shipping    → Envío Estándar (₡3,500 / $8) + Envío Express (₡8,000 / $18)")
  logger.info("  Inventory   → All items linked to Bodega Central CR (qty: 1,000,000)")
  logger.info("  Prices      → CRC added to all product variants")
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero TypeScript errors.

---

### Task 4: Run the seed and verify

- [ ] **Step 1: Run the seed**

```bash
npm run seed
```

Expected output (key lines):
```
info:    Seeding inventory levels for CR location...
info:    Created 20 inventory level(s) at Bodega Central CR.
info:    Seeding CRC prices on product variants...
info:    Added CRC prices to 20 price set(s).
info:    ✓ Seed complete. Summary:
```

If you see `All inventory items already have levels` or `All variants already have CRC prices` instead — the data was already there from a previous run, which is correct idempotent behavior.

- [ ] **Step 2: Verify inventory levels in DB**

```bash
node -e "
const {Client} = require('pg');
const c = new Client({connectionString:'postgres://postgres:password123@localhost/medusa-shop'});
c.connect().then(async () => {
  const r = await c.query('SELECT il.location_id, sl.name, COUNT(*) as levels, SUM(il.stocked_quantity) as stock FROM inventory_level il JOIN stock_location sl ON sl.id = il.location_id WHERE sl.deleted_at IS NULL GROUP BY il.location_id, sl.name');
  console.log(JSON.stringify(r.rows, null, 2));
  c.end();
}).catch(e => console.error(e.message));
"
```

Expected:
```json
[
  {
    "location_id": "sloc_...",
    "name": "Bodega Central CR",
    "levels": "20",
    "stock": "20000000"
  }
]
```

- [ ] **Step 3: Verify CRC prices in DB**

```bash
node -e "
const {Client} = require('pg');
const c = new Client({connectionString:'postgres://postgres:password123@localhost/medusa-shop'});
c.connect().then(async () => {
  const r = await c.query(\"SELECT currency_code, COUNT(*) as count, MIN(amount) as min_amount, MAX(amount) as max_amount FROM price WHERE currency_code = 'crc' GROUP BY currency_code\");
  console.log(JSON.stringify(r.rows, null, 2));
  c.end();
}).catch(e => console.error(e.message));
"
```

Expected:
```json
[
  {
    "currency_code": "crc",
    "count": "20",
    "min_amount": "8000",
    "max_amount": "15000"
  }
]
```

- [ ] **Step 4: Check the storefront**

Open `http://localhost:8000` in the browser.

Verify:
- Products show inventory > 0 (not "Out of stock")
- Product prices display in CRC (₡) when region is set to Costa Rica
- Adding an item to cart works without errors

- [ ] **Step 5: Run seed a second time to confirm idempotency**

```bash
npm run seed
```

Expected: All phases log "already exists, skipping" or "already have levels/prices, skipping". No duplicates created. No errors.

- [ ] **Step 6: Commit**

```bash
cd ../..   # repo root
git add apps/backend/src/scripts/seed.ts docs/superpowers/specs/2026-06-10-cr-seed-localization-design.md docs/superpowers/plans/2026-06-10-cr-seed-localization.md
git commit -m "feat(seed): add CR inventory levels and CRC prices to seed script"
```

---

## Troubleshooting

**`price_set` is undefined on variants**
The `price_set` field is a module link — if `query.graph()` returns `undefined` for it, the link resolution failed. Fall back to a raw query:

```typescript
// Replace the query.graph products block with:
const rows = await (container.resolve(ContainerRegistrationKeys.QUERY) as any)
  .__container.resolve("manager")
  .getRepository("product_variant_price_set")
  .find({ select: ["variant_id", "price_set_id"] })
// Then cross-reference variant IDs manually
```

In practice, Medusa v2's built-in `product_variant ↔ price_set` link is always registered, so `query.graph()` with `variants.price_set.id` should work.

**`ModuleRegistrationName.PRICING` not resolving**
Check that `@medusajs/framework/utils` exports it. Fallback:
```typescript
const pricingModuleService = container.resolve("pricingModuleService")
```

**Inventory levels created but storefront still shows 0**
Medusa's storefront inventory check uses `stocked_quantity - reserved_quantity`. If `reserved_quantity` is unexpectedly high (from old test orders), the available quantity can appear as 0. Check:
```sql
SELECT inventory_item_id, stocked_quantity, reserved_quantity
FROM inventory_level
WHERE location_id = '<cr-location-id>';
```
