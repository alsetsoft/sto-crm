"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ClientFormInitial {
  id: string;
  full_name: string;
  phone: string | null;
  comment: string | null;
}

export function ClientForm({ initial }: { initial?: ClientFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    phone: initial?.phone ?? "",
    comment: initial?.comment ?? "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast.error("Вкажіть ПІБ клієнта");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      comment: form.comment.trim() || null,
    };

    const { data, error } = editing
      ? await supabase
          .from("customers")
          .update(payload)
          .eq("id", initial!.id)
          .select("id")
          .single()
      : await supabase.from("customers").insert(payload).select("id").single();

    if (error || !data) {
      setSaving(false);
      toast.error("Не вдалося зберегти клієнта", { description: error?.message });
      return;
    }

    toast.success(editing ? "Клієнта оновлено" : "Клієнта додано");
    router.push(`/clients/${data.id}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href={editing ? `/clients/${initial!.id}` : "/clients"}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {editing ? "До картки" : "До клієнтів"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {editing ? "Редагування клієнта" : "Новий клієнт"}
        </h1>
      </header>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cf-name">ПІБ</Label>
          <Input
            id="cf-name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Іваненко Іван Іванович"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cf-phone">Телефон</Label>
          <Input
            id="cf-phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+380…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cf-comment">Коментар</Label>
          <Textarea
            id="cf-comment"
            value={form.comment}
            onChange={(e) => set("comment", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild disabled={saving}>
            <Link href={editing ? `/clients/${initial!.id}` : "/clients"}>
              Скасувати
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {editing ? "Зберегти" : "Додати"}
          </Button>
        </div>
      </div>
    </div>
  );
}
