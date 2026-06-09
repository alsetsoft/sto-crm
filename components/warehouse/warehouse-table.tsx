"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ImagePlus,
  Loader2,
  Minus,
  Pencil,
  Plus,
} from "lucide-react";

import type { WarehouseItemRow } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  EDITABLE_FIELDS,
  type EditableField,
  type EditMap,
  effective,
  rowStatus,
} from "./types";

interface WarehouseTableProps {
  items: WarehouseItemRow[];
  edits: EditMap;
  uploadingId: string | null;
  onEdit: (id: string, field: EditableField, value: number) => void;
  onPhoto: (item: WarehouseItemRow, file: File) => void;
}

function PhotoCell({
  item,
  uploading,
  onPhoto,
}: {
  item: WarehouseItemRow;
  uploading: boolean;
  onPhoto: (item: WarehouseItemRow, file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      title={item.photo_url ? "Змінити фото" : "Додати фото"}
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPhoto(item, file);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : item.photo_url ? (
        <Image
          src={item.photo_url}
          alt={item.name}
          fill
          sizes="40px"
          className="object-cover"
        />
      ) : (
        <ImagePlus className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

// Sticky column header: opaque card background so scrolling rows don't show
// through, raised above row content. Sticks to the top of the scroll region
// (the wrapper below), which contains the table on both axes.
const STICKY_HEAD = "sticky top-0 z-20 border-b border-border bg-card";

const NUMERIC_HEADERS: { field: EditableField; label: string }[] = [
  { field: "quantity", label: "Залишок" },
  { field: "min_stock", label: "Мін." },
  { field: "recommended_stock", label: "Реком." },
  { field: "purchase_price", label: "Закупка" },
  { field: "sale_price", label: "Продаж" },
];

const STEP_BTN =
  "flex h-9 w-6 shrink-0 items-center justify-center text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

function NumberCell({
  value,
  unit,
  status,
  dirty,
  onChange,
}: {
  value: number;
  unit?: string;
  status?: "ok" | "below" | "negative";
  dirty: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={cn(
          "flex h-9 w-[88px] items-center overflow-hidden rounded-md border bg-card shadow-sm transition-smooth focus-within:ring-2 focus-within:ring-ring",
          status === "negative" && "border-destructive",
          status === "below" && "border-warning",
          (!status || status === "ok") && "border-input",
          dirty && "border-primary ring-1 ring-primary/40"
        )}
      >
        <button
          type="button"
          aria-label="Зменшити на 1"
          // Stepper is bounded at 0; manual entry below stays free (negative stock).
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className={cn(STEP_BTN, "border-r border-input")}
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <input
          inputMode="decimal"
          className={cn(
            "h-9 w-full min-w-0 flex-1 bg-transparent px-0.5 text-center text-sm text-foreground focus-visible:outline-none",
            status === "negative" && "text-destructive",
            status === "below" && "text-warning"
          )}
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(",", "."));
            onChange(Number.isFinite(n) ? n : 0);
          }}
        />
        <button
          type="button"
          aria-label="Збільшити на 1"
          onClick={() => onChange(value + 1)}
          className={cn(STEP_BTN, "border-l border-input")}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {/* Always reserve the label line so every numeric cell is the same
          height and all input boxes align on one horizontal row. */}
      <span className="h-3.5 text-[11px] leading-none text-muted-foreground">
        {unit ?? ""}
      </span>
    </div>
  );
}

export function WarehouseTable({
  items,
  edits,
  uploadingId,
  onEdit,
  onPhoto,
}: WarehouseTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-card">
        Позицій не знайдено.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-lg border border-border bg-card shadow-card">
      <table className="w-full caption-bottom text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(STICKY_HEAD, "w-[56px] px-2 rounded-tl-lg")}>
              Фото
            </TableHead>
            {/* Rubbery column — absorbs slack (w-full), but never collapses (min-w). */}
            <TableHead className={cn(STICKY_HEAD, "w-full min-w-[160px] px-2")}>
              Назва / Артикул
            </TableHead>
            <TableHead className={cn(STICKY_HEAD, "px-2")}>Категорія</TableHead>
            {NUMERIC_HEADERS.map((h) => (
              <TableHead
                key={h.field}
                className={cn(STICKY_HEAD, "whitespace-nowrap px-1 text-center")}
              >
                {h.label}
              </TableHead>
            ))}
            <TableHead
              className={cn(STICKY_HEAD, "whitespace-nowrap px-1 text-center")}
            >
              Маржа
            </TableHead>
            <TableHead className={cn(STICKY_HEAD, "px-2")}>Місце</TableHead>
            <TableHead
              className={cn(STICKY_HEAD, "w-[60px] px-1 rounded-tr-lg text-right")}
            >
              {""}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const qty = effective(item, edits, "quantity");
            const minStock = effective(item, edits, "min_stock");
            const status = rowStatus(qty, minStock);
            const rowEdits = edits[item.id];

            return (
              <TableRow
                key={item.id}
                className={cn(
                  "group",
                  item.is_archived && "opacity-60",
                  status === "negative" && "bg-destructive/5",
                  status === "below" && "bg-warning/5"
                )}
              >
                <TableCell className="px-2">
                  <PhotoCell
                    item={item}
                    uploading={uploadingId === item.id}
                    onPhoto={onPhoto}
                  />
                </TableCell>
                <TableCell className="px-2">
                  <div className="break-words font-medium text-foreground">
                    {item.name}
                  </div>
                  {item.article ? (
                    <div className="break-words text-xs uppercase text-muted-foreground">
                      {item.article}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="px-2 text-muted-foreground">
                  <div className="max-w-[120px] break-words">
                    {item.category ?? "—"}
                  </div>
                  {item.subcategory ? (
                    <div className="max-w-[120px] break-words text-xs text-muted-foreground/70">
                      {item.subcategory}
                    </div>
                  ) : null}
                </TableCell>

                {NUMERIC_HEADERS.map((h) => (
                  <TableCell key={h.field} className="px-1">
                    <NumberCell
                      value={effective(item, edits, h.field)}
                      unit={h.field === "quantity" ? item.unit : undefined}
                      status={h.field === "quantity" ? status : undefined}
                      dirty={rowEdits?.[h.field] !== undefined}
                      onChange={(v) => onEdit(item.id, h.field, v)}
                    />
                  </TableCell>
                ))}

                <TableCell className="px-1 text-center">
                  {(() => {
                    const margin =
                      effective(item, edits, "sale_price") -
                      effective(item, edits, "purchase_price");
                    return (
                      <span
                        className={cn(
                          "text-sm font-medium tabular-nums",
                          margin > 0 && "text-success",
                          margin < 0 && "text-destructive",
                          margin === 0 && "text-muted-foreground"
                        )}
                      >
                        {formatUAH(margin)}
                      </span>
                    );
                  })()}
                </TableCell>

                <TableCell className="px-2 text-muted-foreground">
                  <div className="max-w-[100px] break-words">
                    {item.location ?? "—"}
                  </div>
                </TableCell>

                <TableCell className="px-1">
                  <div className="flex items-center justify-end gap-0.5">
                    {status !== "ok" ? (
                      <AlertTriangle
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          status === "negative"
                            ? "text-destructive"
                            : "text-warning"
                        )}
                        aria-label={
                          status === "negative" ? "В мінусі" : "Нижче мінімуму"
                        }
                      />
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Редагувати"
                      title="Редагувати"
                      className="h-8 w-8 shrink-0"
                      asChild
                    >
                      <Link href={`/sklad/${item.id}/redaguvaty`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </table>
    </div>
  );
}

export { EDITABLE_FIELDS };
