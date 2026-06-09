"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ServiceFormInitial {
  id: string;
  name: string;
  price: number;
  labor_hours: number;
}

export function ServiceForm({ initial }: { initial?: ServiceFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    price: initial ? String(initial.price) : "0",
    labor_hours: initial ? String(initial.labor_hours) : "0",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Вкажіть назву послуги");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name: form.name.trim(),
      price: num(form.price),
      labor_hours: num(form.labor_hours),
    };

    const { error } = editing
      ? await supabase.from("services").update(payload).eq("id", initial!.id)
      : await supabase.from("services").insert(payload);

    if (error) {
      setSaving(false);
      toast.error("Не вдалося зберегти послугу", { description: error.message });
      return;
    }

    toast.success(editing ? "Послугу оновлено" : "Послугу додано");
    router.push("/services");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Видалити послугу «${initial.name}»?`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("services").delete().eq("id", initial.id);
    if (error) {
      setDeleting(false);
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    toast.success("Послугу видалено");
    router.push("/services");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/services">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Назад
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {editing ? "Редагування послуги" : "Нова послуга"}
        </h1>
      </header>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sf-name">Назва</Label>
          <Input
            id="sf-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Заміна масла та фільтра"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-price">Ціна (₴)</Label>
            <Input
              id="sf-price"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sf-hours">Нормо-години</Label>
            <Input
              id="sf-hours"
              inputMode="decimal"
              value={form.labor_hours}
              onChange={(e) => set("labor_hours", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            {editing ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Видалити
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild disabled={saving}>
              <Link href="/services">Скасувати</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {editing ? "Зберегти" : "Додати"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
