"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { WarehouseItemRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_OPTIONS } from "./types";

interface NewItemDialogProps {
  onCreated: (item: WarehouseItemRow) => void;
}

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

export function NewItemDialog({ onCreated }: NewItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  async function handleСreate() {
    if (!form.name.trim()) {
      toast.error("Вкажіть назву позиції");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
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
        photo_url: null,
        is_archived: false,
      })
      .select("*")
      .single();

    setSaving(false);

    if (error || !data) {
      toast.error("Не вдалося створити позицію", {
        description: error?.message,
      });
      return;
    }

    toast.success("Позицію додано");
    onCreated(data as WarehouseItemRow);
    setForm({ ...EMPTY });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" aria-hidden />
          Нова позиція
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нова позиція складу</DialogTitle>
          <DialogDescription>
            Заповніть дані нової складської позиції.
          </DialogDescription>
        </DialogHeader>

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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Скасувати
          </Button>
          <Button onClick={handleСreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Додати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
