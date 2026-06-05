"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WarehousePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

/** Builds a compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20. */
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function WarehousePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
}: WarehousePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalCount === 0) return null;

  const clamped = Math.min(page, totalPages);
  const first = (clamped - 1) * pageSize + 1;
  const last = Math.min(clamped * pageSize, totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Показано{" "}
        <span className="font-medium text-foreground">
          {first}–{last}
        </span>{" "}
        з <span className="font-medium text-foreground">{totalCount}</span>
      </p>

      {totalPages > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Пагінація">
          <Button
            variant="outline"
            size="icon"
            aria-label="Попередня сторінка"
            disabled={clamped <= 1}
            onClick={() => onPageChange(clamped - 1)}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>

          {pageList(clamped, totalPages).map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="px-2 text-sm text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === clamped ? "default" : "outline"}
                size="icon"
                aria-label={`Сторінка ${p}`}
                aria-current={p === clamped ? "page" : undefined}
                className={cn("min-w-9 tabular-nums")}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            aria-label="Наступна сторінка"
            disabled={clamped >= totalPages}
            onClick={() => onPageChange(clamped + 1)}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
