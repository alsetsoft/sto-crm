"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { EmployeeRole } from "@/lib/supabase/types";
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

export interface EmployeeFormInitial {
  id: string;
  full_name: string;
  role: EmployeeRole;
  monthly_rate: number;
  work_percentage: number;
}

export function EmployeeForm({ initial }: { initial?: EmployeeFormInitial }) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [role, setRole] = useState<EmployeeRole>(initial?.role ?? "master");
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? "",
    monthly_rate: initial ? String(initial.monthly_rate) : "0",
    work_percentage: initial ? String(initial.work_percentage) : "0",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  async function handleSave() {
    if (!form.full_name.trim()) {
      toast.error("Вкажіть ПІБ працівника");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      full_name: form.full_name.trim(),
      role,
      monthly_rate: num(form.monthly_rate),
      work_percentage: num(form.work_percentage),
    };

    const { data, error } = editing
      ? await supabase
          .from("employees")
          .update(payload)
          .eq("id", initial!.id)
          .select("id")
          .single()
      : await supabase.from("employees").insert(payload).select("id").single();

    if (error || !data) {
      setSaving(false);
      toast.error("Не вдалося зберегти працівника", { description: error?.message });
      return;
    }

    toast.success(editing ? "Дані оновлено" : "Працівника додано");
    router.push(`/employees/${data.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Видалити працівника «${initial.full_name}»?`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("employees").delete().eq("id", initial.id);
    if (error) {
      setDeleting(false);
      toast.error("Не вдалося видалити", {
        description: error.message.includes("foreign key")
          ? "Працівник призначений виконавцем у нарядах."
          : error.message,
      });
      return;
    }
    toast.success("Працівника видалено");
    router.push("/employees");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href={editing ? `/employees/${initial!.id}` : "/employees"}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {editing ? "До картки" : "До працівників"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {editing ? "Редагування працівника" : "Новий працівник"}
        </h1>
      </header>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ef-name">ПІБ</Label>
          <Input
            id="ef-name"
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Коваль Олександр"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ef-role">Роль</Label>
          <Select value={role} onValueChange={(v) => setRole(v as EmployeeRole)}>
            <SelectTrigger id="ef-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="master">Майстер</SelectItem>
              <SelectItem value="admin">Адміністратор</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ef-rate">Місячна ставка (₴)</Label>
            <Input
              id="ef-rate"
              inputMode="decimal"
              value={form.monthly_rate}
              onChange={(e) => set("monthly_rate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ef-pct">Відсоток від робіт (%)</Label>
            <Input
              id="ef-pct"
              inputMode="decimal"
              value={form.work_percentage}
              onChange={(e) => set("work_percentage", e.target.value)}
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
              <Link href={editing ? `/employees/${initial!.id}` : "/employees"}>
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
    </div>
  );
}

export const ROLE_LABEL: Record<EmployeeRole, string> = {
  master: "Майстер",
  admin: "Адміністратор",
};
