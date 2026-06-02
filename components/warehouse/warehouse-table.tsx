"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ImagePlus,
  Loader2,
  Trash2,
} from "lucide-react";

import type { WarehouseItemRow } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import {
  Table,
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
  onToggleArchive: (item: WarehouseItemRow) => void;
  onDelete: (item: WarehouseItemRow) => void;
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
      className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 text-muted-foreground transition-smooth hover:border-primary hover:text-primary"
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
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <ImagePlus className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

const NUMERIC_HEADERS: { field: EditableField; label: string }[] = [
  { field: "quantity", label: "Залишок" },
  { field: "min_stock", label: "Мін." },
  { field: "recommended_stock", label: "Реком." },
  { field: "purchase_price", label: "Закупка" },
  { field: "sale_price", label: "Продаж" },
];

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
      <input
        inputMode="decimal"
        className={cn(
          "h-9 w-20 rounded-md border bg-card px-2 text-center text-sm text-foreground shadow-sm transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          status === "negative" && "border-destructive text-destructive",
          status === "below" && "border-warning text-warning",
          (!status || status === "ok") && "border-input",
          dirty && "border-primary ring-1 ring-primary/40"
        )}
        value={Number.isInteger(value) ? String(value) : String(value)}
        onChange={(e) => {
          const n = Number(e.target.value.replace(",", "."));
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
      {unit ? (
        <span className="text-[11px] text-muted-foreground">{unit}</span>
      ) : null}
    </div>
  );
}

export function WarehouseTable({
  items,
  edits,
  uploadingId,
  onEdit,
  onToggleArchive,
  onDelete,
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
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[60px]">Фото</TableHead>
            <TableHead className="min-w-[220px]">Назва / Артикул</TableHead>
            <TableHead>Категорія</TableHead>
            {NUMERIC_HEADERS.map((h) => (
              <TableHead key={h.field} className="text-center">
                {h.label}
              </TableHead>
            ))}
            <TableHead className="text-center">Маржа</TableHead>
            <TableHead>Місце</TableHead>
            <TableHead className="w-[88px] text-right">{""}</TableHead>
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
                <TableCell>
                  <PhotoCell
                    item={item}
                    uploading={uploadingId === item.id}
                    onPhoto={onPhoto}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{item.name}</div>
                  {item.article ? (
                    <div className="text-xs uppercase text-muted-foreground">
                      {item.article}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.category ?? "—"}
                </TableCell>

                {NUMERIC_HEADERS.map((h) => (
                  <TableCell key={h.field}>
                    <NumberCell
                      value={effective(item, edits, h.field)}
                      unit={h.field === "quantity" ? item.unit : undefined}
                      status={h.field === "quantity" ? status : undefined}
                      dirty={rowEdits?.[h.field] !== undefined}
                      onChange={(v) => onEdit(item.id, h.field, v)}
                    />
                  </TableCell>
                ))}

                <TableCell className="text-center">
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

                <TableCell className="text-muted-foreground">
                  {item.location ?? "—"}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {status !== "ok" ? (
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4",
                          status === "negative"
                            ? "text-destructive"
                            : "text-warning"
                        )}
                        aria-label={
                          status === "negative" ? "В мінусі" : "Нижче мінімуму"
                        }
                      />
                    ) : null}
                    <div className="flex items-center opacity-0 transition-smooth group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          item.is_archived ? "Відновити" : "Архівувати"
                        }
                        onClick={() => onToggleArchive(item)}
                      >
                        {item.is_archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label="Видалити"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { EDITABLE_FIELDS };
