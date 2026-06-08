"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type {
  WarehouseCategoryPair,
  WarehouseItemRow,
} from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_OPTIONS } from "./types";
import { uploadWarehousePhoto } from "./photo";

const EMPTY = {
  name: "",
  article: "",
  barcode: "",
  category: "",
  subcategory: "",
  location: "",
  unit: "шт",
  quantity: "0",
  min_stock: "0",
  recommended_stock: "0",
  purchase_price: "0",
  sale_price: "0",
};

/** Maps a stored item onto the string-keyed form shape. */
function toForm(item: WarehouseItemRow): typeof EMPTY {
  return {
    name: item.name,
    article: item.article ?? "",
    barcode: item.barcode ?? "",
    category: item.category ?? "",
    subcategory: item.subcategory ?? "",
    location: item.location ?? "",
    unit: item.unit,
    quantity: String(item.quantity),
    min_stock: String(item.min_stock),
    recommended_stock: String(item.recommended_stock),
    purchase_price: String(item.purchase_price),
    sale_price: String(item.sale_price),
  };
}

export function NewItemForm({
  categories,
  initial,
}: {
  categories: WarehouseCategoryPair[];
  initial?: WarehouseItemRow;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() =>
    initial ? toForm(initial) : { ...EMPTY }
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    initial?.photo_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  // Which danger-zone action (if any) is in flight — disables the whole form.
  const [busy, setBusy] = useState<null | "archive" | "delete">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const margin = num(form.sale_price) - num(form.purchase_price);

  // Existing category names for the combobox suggestions.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of categories) if (p.category) set.add(p.category);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [categories]);

  // Subcategory suggestions for the typed category (all when none matches yet).
  const subcategoryOptions = useMemo(() => {
    const cat = form.category.trim();
    const set = new Set<string>();
    for (const p of categories) {
      if (!p.subcategory) continue;
      if (cat && p.category !== cat) continue;
      set.add(p.subcategory);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [categories, form.category]);

  async function handlePhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadWarehousePhoto(file);
      setPhotoUrl(url);
    } catch (e) {
      toast.error("Не вдалося завантажити фото", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Вкажіть назву позиції");
      return;
    }
    setSaving(true);
    const supabase = createClient();

    // Fields common to create and edit. The running average purchase price
    // (purchase_price_avg) is only seeded on create — editing must not clobber it.
    const payload = {
      name: form.name.trim(),
      article: form.article.trim() || null,
      barcode: form.barcode.trim() || null,
      category: form.category.trim() || null,
      subcategory: form.subcategory.trim() || null,
      location: form.location.trim() || null,
      unit: form.unit,
      quantity: num(form.quantity),
      min_stock: num(form.min_stock),
      recommended_stock: num(form.recommended_stock),
      purchase_price: num(form.purchase_price),
      sale_price: num(form.sale_price),
      photo_url: photoUrl,
    };

    const { error } = editing
      ? await supabase
          .from("warehouse_items")
          .update(payload)
          .eq("id", initial!.id)
          .select("id")
          .single()
      : await supabase
          .from("warehouse_items")
          .insert({
            ...payload,
            purchase_price_avg: num(form.purchase_price),
            is_archived: false,
          })
          .select("id")
          .single();

    if (error) {
      setSaving(false);
      toast.error(
        editing ? "Не вдалося зберегти зміни" : "Не вдалося створити позицію",
        { description: error.message }
      );
      return;
    }

    toast.success(editing ? "Позицію оновлено" : "Позицію додано");
    router.push("/sklad");
    router.refresh();
  }

  async function handleToggleArchive() {
    if (!initial) return;
    setBusy("archive");
    const supabase = createClient();
    const { error } = await supabase
      .from("warehouse_items")
      .update({ is_archived: !initial.is_archived })
      .eq("id", initial.id);

    if (error) {
      setBusy(null);
      toast.error("Не вдалося змінити статус", { description: error.message });
      return;
    }
    toast.success(initial.is_archived ? "Позицію відновлено" : "Позицію архівовано");
    router.push("/sklad");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Видалити позицію «${initial.name}»?`)) return;
    setBusy("delete");
    const supabase = createClient();
    const { error } = await supabase
      .from("warehouse_items")
      .delete()
      .eq("id", initial.id);

    if (error) {
      setBusy(null);
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    toast.success("Позицію видалено");
    router.push("/sklad");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/sklad">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            До складу
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {editing ? "Редагування позиції" : "Нова позиція складу"}
        </h1>
      </header>

      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        {/* Suggestions for the category/subcategory comboboxes */}
        <datalist id="ni-categories">
          {categoryOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="ni-subcategories">
          {subcategoryOptions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-1 md:col-span-4">
            <Label htmlFor="ni-name">Назва</Label>
            <Input
              id="ni-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Олива моторна 5W-30"
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="ni-article">Артикул</Label>
            <Input
              id="ni-article"
              value={form.article}
              onChange={(e) => set("article", e.target.value)}
              placeholder="OIL-5W30"
            />
          </div>
          <div className="col-span-1 flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="ni-barcode">Штрих-код</Label>
            <Input
              id="ni-barcode"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
            />
          </div>

          <div className="col-span-1 flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="ni-category">Категорія</Label>
            <Input
              id="ni-category"
              list="ni-categories"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Оберіть або впишіть"
              autoComplete="off"
            />
          </div>
          <div className="col-span-1 flex flex-col gap-1 md:col-span-2">
            <Label htmlFor="ni-subcategory">Підкатегорія</Label>
            <Input
              id="ni-subcategory"
              list="ni-subcategories"
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              placeholder="Оберіть або впишіть"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-unit">Одиниця</Label>
            <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
              <SelectTrigger id="ni-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-qty">Залишок</Label>
            <Input
              id="ni-qty"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="ni-loc">Місце</Label>
            <Input
              id="ni-loc"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Стелаж А-3"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-min">Мінімум</Label>
            <Input
              id="ni-min"
              inputMode="decimal"
              value={form.min_stock}
              onChange={(e) => set("min_stock", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-rec">Реком.</Label>
            <Input
              id="ni-rec"
              inputMode="decimal"
              value={form.recommended_stock}
              onChange={(e) => set("recommended_stock", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-buy">Закупка (₴)</Label>
            <Input
              id="ni-buy"
              inputMode="decimal"
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="ni-sell">Продаж (₴)</Label>
            <Input
              id="ni-sell"
              inputMode="decimal"
              value={form.sale_price}
              onChange={(e) => set("sale_price", e.target.value)}
            />
          </div>

          {/* Margin + photo share one compact row */}
          <div className="col-span-2 flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 md:col-span-2">
            <span className="text-sm text-muted-foreground">Маржа на од.</span>
            <span
              className={cn(
                "text-sm font-semibold",
                margin > 0 && "text-success",
                margin < 0 && "text-destructive",
                margin === 0 && "text-foreground"
              )}
            >
              {formatUAH(margin)}
            </span>
          </div>

          <div className="col-span-2 flex items-center gap-3 md:col-span-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhoto(file);
                e.target.value = "";
              }}
            />
            {photoUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
                <Image
                  src={photoUrl}
                  alt="Фото позиції"
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  aria-label="Прибрати фото"
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden />
                )}
                Фото
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" asChild disabled={saving || busy !== null}>
            <Link href="/sklad">Скасувати</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading || busy !== null}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {editing ? "Зберегти" : "Додати"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Небезпечна зона
              </h2>
              <p className="text-xs text-muted-foreground">
                {initial!.is_archived
                  ? "Відновіть позицію або видаліть її назавжди."
                  : "Архівуйте, щоб приховати зі списку, або видаліть назавжди."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleArchive}
                disabled={saving || busy !== null}
              >
                {busy === "archive" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : initial!.is_archived ? (
                  <ArchiveRestore className="h-4 w-4" aria-hidden />
                ) : (
                  <Archive className="h-4 w-4" aria-hidden />
                )}
                {initial!.is_archived ? "Відновити" : "Архівувати"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving || busy !== null}
              >
                {busy === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Видалити
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
