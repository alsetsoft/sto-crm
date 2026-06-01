"use client";

import { useMemo, useState } from "react";
import { Package, Search, Archive, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { WarehouseItemRow } from "@/lib/supabase/types";
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
import { NewItemDialog } from "./new-item-dialog";
import {
  ALL_CATEGORIES,
  computeStats,
  type EditableField,
  type EditMap,
} from "./types";

interface WarehouseClientProps {
  initialItems: WarehouseItemRow[];
  loadError: string | null;
}

export function WarehouseClient({
  initialItems,
  loadError,
}: WarehouseClientProps) {
  const [items, setItems] = useState<WarehouseItemRow[]>(initialItems);
  const [edits, setEdits] = useState<EditMap>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.category) set.add(it.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (!showArchived && it.is_archived) return false;
      if (category !== ALL_CATEGORIES && it.category !== category) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        (it.article ?? "").toLowerCase().includes(q) ||
        (it.barcode ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, category, showArchived]);

  const activeItems = useMemo(
    () => items.filter((it) => !it.is_archived),
    [items]
  );
  const stats = useMemo(
    () => computeStats(activeItems, edits),
    [activeItems, edits]
  );

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
      supabase.from("warehouse_items").update(patch).eq("id", id).select("*").single()
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

    setItems((prev) => {
      const byId = new Map(prev.map((it) => [it.id, it]));
      for (const r of results) {
        const row = r.data as WarehouseItemRow | null;
        if (row) byId.set(row.id, row);
      }
      return Array.from(byId.values());
    });
    setEdits({});
    setSaving(false);
    toast.success("Зміни збережено");
  }

  async function handleToggleArchive(item: WarehouseItemRow) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("warehouse_items")
      .update({ is_archived: !item.is_archived })
      .eq("id", item.id)
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Не вдалося змінити статус", { description: error?.message });
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? (data as WarehouseItemRow) : it))
    );
    toast.success(item.is_archived ? "Позицію відновлено" : "Позицію архівовано");
  }

  async function handleDelete(item: WarehouseItemRow) {
    if (!window.confirm(`Видалити позицію «${item.name}»?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("warehouse_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    setEdits((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
    toast.success("Позицію видалено");
  }

  function handleCreated(item: WarehouseItemRow) {
    setItems((prev) => [item, ...prev]);
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
            <span>{stats.count} позицій</span>
            <span aria-hidden>·</span>
            <span className={cn(stats.belowMin > 0 && "font-medium text-warning")}>
              {stats.belowMin} нижче мінімуму
            </span>
            <span aria-hidden>·</span>
            <span className={cn(stats.negative > 0 && "font-medium text-destructive")}>
              {stats.negative} в мінусі
            </span>
            <span aria-hidden>·</span>
            <span>
              Вартість:{" "}
              <span className="font-semibold text-foreground">
                {formatUAH(stats.totalValue)}
              </span>
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewItemDialog onCreated={handleCreated} />
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
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Усі категорії" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Усі категорії</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showArchived ? "secondary" : "outline"}
          onClick={() => setShowArchived((v) => !v)}
          aria-pressed={showArchived}
        >
          <Archive className="h-4 w-4" aria-hidden />
          {showArchived ? "Усі" : "Активні"}
        </Button>
      </div>

      {/* Table */}
      <WarehouseTable
        items={visibleItems}
        edits={edits}
        onEdit={handleEdit}
        onToggleArchive={handleToggleArchive}
        onDelete={handleDelete}
      />

      {/* Sticky save bar */}
      {dirtyCount > 0 ? (
        <div className="sticky bottom-4 z-10 flex animate-fade-in-up items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 shadow-elegant">
          <span className="text-sm text-muted-foreground">
            Незбережених змін: <span className="font-semibold text-foreground">{dirtyCount}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setEdits({})} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
