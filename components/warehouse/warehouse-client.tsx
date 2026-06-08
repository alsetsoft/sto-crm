"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Search, Archive, Save, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type {
  WarehouseItemRow,
  WarehouseOverview,
} from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WarehouseTable } from "./warehouse-table";
import { WarehousePagination } from "./pagination";
import { uploadWarehousePhoto } from "./photo";
import {
  ALL_CATEGORIES,
  type EditableField,
  type EditMap,
} from "./types";

interface WarehouseFilters {
  q: string;
  category: string;
  subcategory: string;
  showArchived: boolean;
}

interface WarehouseClientProps {
  initialItems: WarehouseItemRow[];
  loadError: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  overview: WarehouseOverview;
  filters: WarehouseFilters;
}

/** One entry of the merged category/subcategory dropdown. */
interface CategoryOption {
  value: string; // stable key used as the Select value
  label: string;
  category: string;
  subcategory: string;
  isSub: boolean;
}

export function WarehouseClient({
  initialItems,
  loadError,
  totalCount,
  page,
  pageSize,
  overview,
  filters,
}: WarehouseClientProps) {
  const router = useRouter();

  const [items, setItems] = useState<WarehouseItemRow[]>(initialItems);
  const [edits, setEdits] = useState<EditMap>({});
  const [search, setSearch] = useState(filters.q);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // The server is the source of truth for the visible page; re-sync whenever a
  // navigation/refresh delivers a new page of rows, and drop any pending edits.
  useEffect(() => {
    setItems(initialItems);
    setEdits({});
  }, [initialItems]);

  // Build a /sklad URL from the full filter state and navigate to it.
  function navigate(next: Partial<WarehouseFilters & { page: number }>) {
    const q = next.q ?? search.trim();
    const category = next.category ?? filters.category;
    const subcategory = next.subcategory ?? filters.subcategory;
    const showArchived = next.showArchived ?? filters.showArchived;
    const targetPage = next.page ?? 1;

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("cat", category);
    if (subcategory) params.set("sub", subcategory);
    if (showArchived) params.set("arch", "1");
    if (targetPage > 1) params.set("page", String(targetPage));

    const qs = params.toString();
    router.push(qs ? `/sklad?${qs}` : "/sklad");
  }

  // Debounced search → push to the URL (resets to page 1).
  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim() === filters.q) return;
      navigate({ q: search.trim(), page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Flat list of dropdown entries: each category followed by its subcategories.
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    const byCat = new Map<string, Set<string>>();
    for (const p of overview.categories) {
      if (!p.category) continue;
      if (!byCat.has(p.category)) byCat.set(p.category, new Set());
      if (p.subcategory) byCat.get(p.category)!.add(p.subcategory);
    }

    const out: CategoryOption[] = [];
    const cats = Array.from(byCat.keys()).sort((a, b) => a.localeCompare(b, "uk"));
    for (const c of cats) {
      out.push({ value: `c${out.length}`, label: c, category: c, subcategory: "", isSub: false });
      const subs = Array.from(byCat.get(c)!).sort((a, b) => a.localeCompare(b, "uk"));
      for (const s of subs) {
        out.push({ value: `s${out.length}`, label: s, category: c, subcategory: s, isSub: true });
      }
    }
    return out;
  }, [overview.categories]);

  // Which dropdown entry matches the active filter.
  const currentCategoryValue = useMemo(() => {
    if (!filters.category) return ALL_CATEGORIES;
    const match = categoryOptions.find(
      (o) => o.category === filters.category && o.subcategory === filters.subcategory
    );
    return match?.value ?? ALL_CATEGORIES;
  }, [categoryOptions, filters.category, filters.subcategory]);

  function handleCategorySelect(value: string) {
    if (value === ALL_CATEGORIES) {
      navigate({ category: "", subcategory: "", page: 1 });
      return;
    }
    const opt = categoryOptions.find((o) => o.value === value);
    navigate({
      category: opt?.category ?? "",
      subcategory: opt?.subcategory ?? "",
      page: 1,
    });
  }

  const dirtyCount = Object.keys(edits).length;

  function handleEdit(id: string, field: EditableField, value: number) {
    setEdits((prev) => {
      const item = items.find((it) => it.id === id);
      const next = { ...prev };
      const row = { ...(next[id] ?? {}) };

      if (item && item[field] === value) {
        delete row[field];
      } else {
        row[field] = value;
      }

      if (Object.keys(row).length === 0) delete next[id];
      else next[id] = row;
      return next;
    });
  }

  async function handleSave() {
    if (dirtyCount === 0) return;
    setSaving(true);
    const supabase = createClient();

    const updates = Object.entries(edits).map(([id, patch]) =>
      supabase.from("warehouse_items").update(patch).eq("id", id).select("id").single()
    );

    const results = await Promise.all(updates);
    const failed = results.filter((r) => r.error);

    if (failed.length > 0) {
      toast.error(`Не вдалося зберегти ${failed.length} поз.`, {
        description: failed[0].error?.message,
      });
      setSaving(false);
      return;
    }

    setSaving(false);
    toast.success("Зміни збережено");
    // Pull fresh rows + recomputed totals from the server.
    router.refresh();
  }

  async function handlePhoto(item: WarehouseItemRow, file: File) {
    setUploadingId(item.id);
    try {
      const url = await uploadWarehousePhoto(file);
      const supabase = createClient();
      const { error } = await supabase
        .from("warehouse_items")
        .update({ photo_url: url })
        .eq("id", item.id);

      if (error) {
        toast.error("Не вдалося зберегти фото", { description: error.message });
        return;
      }
      toast.success("Фото оновлено");
      router.refresh();
    } catch (e) {
      toast.error("Не вдалося завантажити фото", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <Package className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Склад</h1>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <span>{overview.active_count} позицій</span>
            <span aria-hidden>·</span>
            <span className={cn(overview.below_min > 0 && "font-medium text-warning")}>
              {overview.below_min} нижче мінімуму
            </span>
            <span aria-hidden>·</span>
            <span className={cn(overview.negative > 0 && "font-medium text-destructive")}>
              {overview.negative} в мінусі
            </span>
            <span aria-hidden>·</span>
            <span>
              Вартість:{" "}
              <span className="font-semibold text-foreground">
                {formatUAH(overview.total_value)}
              </span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/sklad/nova">
              <Plus className="h-4 w-4" aria-hidden />
              Нова позиція
            </Link>
          </Button>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити дані складу: {loadError}
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Пошук за назвою, артикулом, штрих-кодом…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Пошук позицій"
          />
        </div>
        <Select value={currentCategoryValue} onValueChange={handleCategorySelect}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Усі категорії" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Усі категорії</SelectItem>
            {categoryOptions.map((o) => (
              <SelectItem
                key={o.value}
                value={o.value}
                className={o.isSub ? "pl-10 text-muted-foreground" : "font-medium"}
              >
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={filters.showArchived ? "secondary" : "outline"}
          onClick={() => navigate({ showArchived: !filters.showArchived, page: 1 })}
          aria-pressed={filters.showArchived}
        >
          <Archive className="h-4 w-4" aria-hidden />
          {filters.showArchived ? "Усі" : "Активні"}
        </Button>
      </div>

      {/* Table */}
      <WarehouseTable
        items={items}
        edits={edits}
        uploadingId={uploadingId}
        onEdit={handleEdit}
        onPhoto={handlePhoto}
      />

      {/* Pagination */}
      <WarehousePagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={(p) => navigate({ page: p })}
      />

      {/* Sticky save bar */}
      {dirtyCount > 0 ? (
        <div className="sticky bottom-4 z-10 flex animate-fade-in-up flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-elegant sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Незбережених змін: <span className="font-semibold text-foreground">{dirtyCount}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setEdits({})}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Зберегти зміни ({dirtyCount})
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
