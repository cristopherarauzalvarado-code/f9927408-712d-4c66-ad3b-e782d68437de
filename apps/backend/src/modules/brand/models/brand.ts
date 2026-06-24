import { model } from "@medusajs/framework/utils"

export const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text(),
  // Readable URL slug, e.g. "craia" → /brands/craia.
  // Nullable so the migration applies cleanly to pre-existing rows; the seed
  // backfills it. Unique so each brand maps to one handle.
  handle: model.text().unique().nullable(),
})
