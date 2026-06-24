# Spec: Costa Rica Seed Localization

**Date:** 2026-06-10  
**Status:** Approved  
**Scope:** `apps/backend/src/scripts/seed.ts`

---

## Problem

The current DB has a mix of Medusa default/EU data and partial CR data:

| Issue | Root cause |
|---|---|
| EU region visible in admin | Soft-deleted row still in DB; admin shows cached state |
| Zero inventory on CR storefront | All 20 `inventory_level` rows tied to soft-deleted EU location |
| No CRC prices on demo products | `createProductsWorkflow` in old seed only set EUR + USD |
| Stale soft-deleted EU rows | `deleteRegionsWorkflow` soft-deletes — Medusa never hard-deletes |

The EU soft-deleted rows are invisible to live queries and do not need intervention. The admin visibility is a Next.js cache issue resolved by a hard refresh. The real gaps are **inventory levels** and **CRC prices**.

---

## Decision

Extend `seed.ts` with two new idempotent phases:

1. **Inventory levels** — link all existing inventory items to the CR stock location
2. **CRC prices** — add CRC prices to all product variant price sets

This makes `seed.ts` the single source of truth for a complete, working CR shop. Running it on any fresh client DB produces a fully functional storefront with no manual admin steps.

---

## Seed phases (complete sequence)

| # | Phase | Idempotency check |
|---|---|---|
| 1 | Sales channel | Skip if any exists |
| 2 | Publishable API key | Skip if publishable key exists |
| 3 | Store currencies → CRC default + USD | Always runs `updateStoresWorkflow` |
| 4 | Costa Rica region (crc, country: cr) | Skip if "Costa Rica" region exists |
| 5 | CR tax region (tp_system / cr) | Skip if cr tax region exists |
| 6 | Shipping profile | Read-only — auto-created by Medusa migrations |
| 7 | Stock location → Bodega Central CR, San José | Skip if "Bodega Central CR" exists |
| 8 | Fulfillment set → Entrega Costa Rica | Skip if "Entrega Costa Rica" exists |
| 9 | Shipping options → Envío Estándar + Envío Express | Skip if "Envío Estándar" exists |
| 10 | Sales channel ↔ stock location link | Always runs (workflow is idempotent) |
| 11 | **[NEW] Inventory levels** | Skip per item if level already exists at CR location |
| 12 | **[NEW] CRC prices on product variants** | Skip per price set if CRC price already exists |

---

## Phase 11 — Inventory levels

**Data path:**
```
inventory_item  →  inventory_level (location_id, stocked_quantity)
```

**Logic:**
1. Query all `inventory_item` IDs via `query.graph()`
2. Query existing `inventory_level` rows at the CR location
3. Filter to items that have no level at that location
4. Call `createInventoryLevelsWorkflow` for missing ones
5. Default `stocked_quantity`: `1_000_000` (effectively unlimited for template)

**Why not update stocked_quantity for existing levels?**  
If a client has already set real stock counts via the admin, re-running the seed should not overwrite them. The check is existence-only.

---

## Phase 12 — CRC prices on product variants

**Data path in Medusa v2:**
```
product_variant
  → product_variant_price_set (join)
    → price_set
      → price (amount, currency_code)
```

Prices are NOT directly on variants. They live on `price_set` records linked to variants. To add a price, call `pricingModuleService.addPrices()` with the price set ID.

**Logic:**
1. Query all product variants with their linked `price_set.id` via `query.graph()` using the relation path `variants.price_set`
2. For each price set, check if a `price` with `currency_code: "crc"` already exists
3. If not, add CRC price via `pricingModuleService.addPrices()`

**Default CRC amounts (demo products — clients override via admin):**

| Product title match | CRC amount |
|---|---|
| Contains "T-Shirt" or "Shirt" | 10,000 |
| Contains "Sweatshirt" | 15,000 |
| Contains "Sweatpants" or "Pants" | 13,000 |
| Contains "Shorts" | 8,000 |
| Default (anything else) | 10,000 |

Prices stored as-is per Medusa v2 convention — `10000` = ₡10,000, no cents conversion.

**Note on product-title matching:** The seed queries `variant → product.title` to determine the CRC price. This only runs if no CRC price exists yet, so client-set prices are never overwritten.

---

## What this does NOT do

- **Hard-delete soft-deleted EU rows** — Medusa's ORM always filters `deleted_at IS NOT NULL`. No action needed; they don't appear in any query the app makes.
- **Delete demo products** — clients start with 4 test products, remove them via admin when ready for production.
- **Set province-level tax rates** — Costa Rica's 13% IVA is not configured. Tax rates are a client-specific setup done via the admin after onboarding. The seed only creates the tax region (the container), not the rates inside it.
- **Create the admin user** — already exists as `admin@craia.net` from the initial Medusa setup.

---

## Files changed

| File | Change |
|---|---|
| `apps/backend/src/scripts/seed.ts` | Add phases 11 and 12 |

No new files. No schema changes. No migrations required.

---

## How to run

```bash
# From apps/backend/
npm run seed
# or
npx medusa exec src/scripts/seed.ts
```

Safe to re-run at any time. All phases skip gracefully if data already exists.
