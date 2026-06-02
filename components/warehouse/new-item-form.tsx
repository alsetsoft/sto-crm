"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
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
  location: "",
  unit: "шт",
  quantity: "0",
  min_stock: "0",
  recommended_stock: "0",
  purchase_price: "0",
  sale_price: "0",
};

export function NewItemForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const margin = num(form.sale_price) - num(form.purchase_price);

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

  async function handleСreate() {
    if (!form.name.trim()) {
      toast.error("Вкажіть назву позиції");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("warehouse_items")
      .insert({
        name: form.name.trim(),
        article: form.article.trim() || null,
        barcode: form.barcode.trim() || null,
        category: form.category.trim() || null,
        subcategory: null,
        location: form.location.trim() || null,
        unit: form.unit,
        quantity: num(form.quantity),
        min_stock: num(form.min_stock),
        recommended_stock: num(form.recommended_stock),
        purchase_price: num(form.purchase_price),
        purchase_price_avg: num(form.purchase_price),
        sale_price: num(form.sale_price),
        photo_url: photoUrl,
        is_archived: false,
      })
      .select("*")
      .single();

    if (error) {
      setSaving(false);
      toast.error("Не вдалося створити позицію", {
        description: error.message,
      });
      return;
    }

    toast.success("Позицію додано");
    router.push("/sklad");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/sklad">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            До складу
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Нова позиція складу</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Заповніть дані нової складської позиції.
          </p>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="ni-name">Назва</Label>
            <Input
              id="ni-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Олива моторна 5W-30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-article">Артикул</Label>
            <Input
              id="ni-article"
              value={form.article}
              onChange={(e) => set("article", e.target.value)}
              placeholder="OIL-5W30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-barcode">Штрих-код</Label>
            <Input
              id="ni-barcode"
              value={form.barcode}
              onChange={(e) => set("barcode", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-category">Категорія</Label>
            <Input
              id="ni-category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Оливи"
            />
          </div>
          <div className="flex flex-col gap-1.5">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-qty">Залишок</Label>
            <Input
              id="ni-qty"
              inputMode="decimal"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-loc">Місце</Label>
            <Input
              id="ni-loc"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-min">Мінімум</Label>
            <Input
              id="ni-min"
              inputMode="decimal"
              value={form.min_stock}
              onChange={(e) => set("min_stock", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-rec">Рекомендовано</Label>
            <Input
              id="ni-rec"
              inputMode="decimal"
              value={form.recommended_stock}
              onChange={(e) => set("recommended_stock", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-buy">Закупка (₴)</Label>
            <Input
              id="ni-buy"
              inputMode="decimal"
              value={form.purchase_price}
              onChange={(e) => set("purchase_price", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ni-sell">Продаж (₴)</Label>
            <Input
              id="ni-sell"
              inputMode="decimal"
              value={form.sale_price}
              onChange={(e) => set("sale_price", e.target.value)}
            />
          </div>

          {/* Margin (computed from input/output price) */}
          <div className="col-span-2 flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
            <span className="text-sm text-muted-foreground">Маржа на одиницю</span>
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

          {/* Photo */}
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Фото позиції</Label>
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
              <div className="relative h-32 w-32 overflow-hidden rounded-md border border-border">
                <Image
                  src={photoUrl}
                  alt="Фото позиції"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  aria-label="Прибрати фото"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm hover:bg-background"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden />
                )}
                Завантажити фото
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" asChild disabled={saving}>
            <Link href="/sklad">Скасувати</Link>
          </Button>
          <Button onClick={handleСreate} disabled={saving || uploading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Додати
          </Button>
        </div>
      </div>
    </div>
  );
}
