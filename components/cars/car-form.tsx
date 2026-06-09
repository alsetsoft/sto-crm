"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { lookupVehicleByPlate } from "./vehicle-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CarFormCustomer {
  id: string;
  full_name: string;
}

export interface CarFormInitial {
  id: string;
  customer_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  engine_number: string | null;
  plate: string | null;
  mileage: number | null;
  transmission: string | null;
  drive_type: string | null;
  body_type: string | null;
  power: string | null;
  comment: string | null;
}

interface CarFormProps {
  customers: CarFormCustomer[];
  initial?: CarFormInitial;
  defaultCustomerId?: string;
}

const s = (v: string | null | undefined) => v ?? "";
const n = (v: number | null | undefined) => (v == null ? "" : String(v));

export function CarForm({ customers, initial, defaultCustomerId }: CarFormProps) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(
    initial?.customer_id ?? defaultCustomerId ?? ""
  );
  const [form, setForm] = useState({
    make: s(initial?.make),
    model: s(initial?.model),
    year: n(initial?.year),
    vin: s(initial?.vin),
    engine_number: s(initial?.engine_number),
    plate: s(initial?.plate),
    mileage: n(initial?.mileage),
    transmission: s(initial?.transmission),
    drive_type: s(initial?.drive_type),
    body_type: s(initial?.body_type),
    power: s(initial?.power),
    comment: s(initial?.comment),
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const [looking, setLooking] = useState(false);

  async function handleLookup() {
    if (!form.plate.trim()) {
      toast.error("Вкажіть держномер");
      return;
    }
    setLooking(true);
    try {
      const v = await lookupVehicleByPlate(form.plate);
      setForm((f) => ({
        ...f,
        make: v.make ?? f.make,
        model: v.model ?? f.model,
        year: v.year != null ? String(v.year) : f.year,
        vin: v.vin ?? f.vin,
        body_type: v.body_type ?? f.body_type,
      }));
      toast.success("Дані підставлено за держномером");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка автозаповнення");
    } finally {
      setLooking(false);
    }
  }

  const num = (v: string) => {
    const x = Number(v.replace(",", "."));
    return Number.isFinite(x) && v.trim() !== "" ? x : null;
  };

  async function handleSave() {
    if (!customerId) {
      toast.error("Оберіть власника авто");
      return;
    }
    if (!form.make.trim() && !form.plate.trim()) {
      toast.error("Вкажіть марку або держномер");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      customer_id: customerId,
      make: form.make.trim() || null,
      model: form.model.trim() || null,
      year: num(form.year),
      vin: form.vin.trim() || null,
      engine_number: form.engine_number.trim() || null,
      plate: form.plate.trim() || null,
      mileage: num(form.mileage),
      transmission: form.transmission.trim() || null,
      drive_type: form.drive_type.trim() || null,
      body_type: form.body_type.trim() || null,
      power: form.power.trim() || null,
      comment: form.comment.trim() || null,
    };

    const { data, error } = editing
      ? await supabase
          .from("cars")
          .update(payload)
          .eq("id", initial!.id)
          .select("id")
          .single()
      : await supabase.from("cars").insert(payload).select("id").single();

    if (error || !data) {
      setSaving(false);
      toast.error("Не вдалося зберегти авто", { description: error?.message });
      return;
    }

    toast.success(editing ? "Авто оновлено" : "Авто додано");
    router.push(`/cars/${data.id}`);
    router.refresh();
  }

  const backHref = editing ? `/cars/${initial!.id}` : "/cars";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Назад
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {editing ? "Редагування авто" : "Нове авто"}
        </h1>
      </header>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="car-owner">Власник</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger id="car-owner">
              <SelectValue placeholder="Оберіть клієнта" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="car-plate">Держномер</Label>
          <div className="flex gap-2">
            <Input
              id="car-plate"
              value={form.plate}
              onChange={(e) => set("plate", e.target.value)}
              placeholder="AA1234BB"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleLookup}
              disabled={looking}
            >
              {looking ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="h-4 w-4" aria-hidden />
              )}
              Заповнити
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Авто-заповнення марки, моделі, року та VIN за держномером.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <F label="Марка" v={form.make} set={(v) => set("make", v)} placeholder="Toyota" />
          <F label="Модель" v={form.model} set={(v) => set("model", v)} placeholder="Corolla" />
          <F label="Рік" v={form.year} set={(v) => set("year", v)} inputMode="numeric" />
          <F label="VIN" v={form.vin} set={(v) => set("vin", v)} />
          <F label="Номер двигуна" v={form.engine_number} set={(v) => set("engine_number", v)} />
          <F label="Пробіг (км)" v={form.mileage} set={(v) => set("mileage", v)} inputMode="numeric" />
          <F label="Тип КПП" v={form.transmission} set={(v) => set("transmission", v)} placeholder="Автомат" />
          <F label="Привід" v={form.drive_type} set={(v) => set("drive_type", v)} placeholder="Передній" />
          <F label="Кузов" v={form.body_type} set={(v) => set("body_type", v)} placeholder="Седан" />
          <F label="Потужність" v={form.power} set={(v) => set("power", v)} placeholder="150 к.с." />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="car-comment">Коментар</Label>
          <Textarea
            id="car-comment"
            value={form.comment}
            onChange={(e) => set("comment", e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild disabled={saving}>
            <Link href={backHref}>Скасувати</Link>
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

function F({
  label,
  v,
  set,
  placeholder,
  inputMode,
}: {
  label: string;
  v: string;
  set: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={v}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </div>
  );
}
