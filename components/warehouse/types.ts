import type { WarehouseItemRow } from "@/lib/supabase/types";

/** Numeric fields that are editable inline in the warehouse table. */
export const EDITABLE_FIELDS = [
  "quantity",
  "min_stock",
  "recommended_stock",
  "purchase_price",
  "sale_price",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** Per-row pending edits keyed by item id. */
export type EditMap = Record<string, Partial<Record<EditableField, number>>>;

export const UNIT_OPTIONS = ["шт", "л", "компл", "м", "кг"] as const;

export const ALL_CATEGORIES = "__all__";

/** Rows per page for the server-paginated warehouse list. */
export const PAGE_SIZE = 20;

/** Returns the effective value of a field (pending edit if present, else stored). */
export function effective(
  item: WarehouseItemRow,
  edits: EditMap,
  field: EditableField
): number {
  const pending = edits[item.id]?.[field];
  return pending ?? item[field];
}

export type RowStatus = "ok" | "below" | "negative";

export function rowStatus(qty: number, minStock: number): RowStatus {
  if (qty < 0) return "negative";
  if (qty < minStock) return "below";
  return "ok";
}
