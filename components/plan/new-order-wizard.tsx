"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  Search,
  User,
  Car as CarIcon,
  ClipboardList,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { lookupVehicleByPlate } from "@/components/cars/vehicle-lookup";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface WizardCustomer {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface WizardCar {
  id: string;
  customer_id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  plate: string | null;
}

interface NewOrderWizardProps {
  customers: WizardCustomer[];
  cars: WizardCar[];
}

const STEPS = [
  { n: 1, label: "Клієнт", icon: User },
  { n: 2, label: "Авто", icon: CarIcon },
  { n: 3, label: "Заявка", icon: ClipboardList },
] as const;

const EMPTY_CAR = {
  make: "",
  model: "",
  year: "",
  vin: "",
  plate: "",
  engine_number: "",
  mileage: "",
  transmission: "",
  drive_type: "",
  body_type: "",
  power: "",
  comment: "",
};

export function NewOrderWizard({ customers, cars }: NewOrderWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — client
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [newClientMode, setNewClientMode] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [newClient, setNewClient] = useState({ full_name: "", phone: "" });

  // Step 2 — car
  const [carId, setCarId] = useState<string | null>(null);
  const [newCarMode, setNewCarMode] = useState(false);
  const [newCar, setNewCar] = useState({ ...EMPTY_CAR });

  // Step 3 — request
  const [requestText, setRequestText] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const filteredCustomers = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 50);
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, clientSearch]);

  const customerCars = useMemo(
    () => cars.filter((c) => c.customer_id === customerId),
    [cars, customerId]
  );

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;

  const [looking, setLooking] = useState(false);

  async function handleLookup() {
    if (!newCar.plate.trim()) {
      toast.error("Вкажіть держномер");
      return;
    }
    setLooking(true);
    try {
      const v = await lookupVehicleByPlate(newCar.plate);
      setNewCar((c) => ({
        ...c,
        make: v.make ?? c.make,
        model: v.model ?? c.model,
        year: v.year != null ? String(v.year) : c.year,
        vin: v.vin ?? c.vin,
        body_type: v.body_type ?? c.body_type,
      }));
      toast.success("Дані підставлено за держномером");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Помилка автозаповнення");
    } finally {
      setLooking(false);
    }
  }

  // ---- Step validation ----
  const step1Valid = newClientMode
    ? newClient.full_name.trim().length > 0
    : customerId !== null;
  const step2Valid = newCarMode
    ? newCar.make.trim().length > 0 || newCar.plate.trim().length > 0
    : carId !== null;

  function goNext() {
    if (step === 1 && !step1Valid) {
      toast.error("Оберіть або створіть клієнта");
      return;
    }
    if (step === 2 && !step2Valid) {
      toast.error("Оберіть або створіть авто");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) && v.trim() !== "" ? n : null;
  };

  async function handleSubmit() {
    setSaving(true);
    const supabase = createClient();

    try {
      // 1. Resolve customer
      let resolvedCustomerId = customerId;
      if (newClientMode) {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            full_name: newClient.full_name.trim(),
            phone: newClient.phone.trim() || null,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("customer");
        resolvedCustomerId = data.id;
      }
      if (!resolvedCustomerId) throw new Error("Клієнт не визначений");

      // 2. Resolve car
      let resolvedCarId = carId;
      if (newCarMode) {
        const { data, error } = await supabase
          .from("cars")
          .insert({
            customer_id: resolvedCustomerId,
            make: newCar.make.trim() || null,
            model: newCar.model.trim() || null,
            year: num(newCar.year),
            vin: newCar.vin.trim() || null,
            plate: newCar.plate.trim() || null,
            engine_number: newCar.engine_number.trim() || null,
            mileage: num(newCar.mileage),
            transmission: newCar.transmission.trim() || null,
            drive_type: newCar.drive_type.trim() || null,
            body_type: newCar.body_type.trim() || null,
            power: newCar.power.trim() || null,
            comment: newCar.comment.trim() || null,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("car");
        resolvedCarId = data.id;
      }
      if (!resolvedCarId) throw new Error("Авто не визначене");

      // 3. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: resolvedCustomerId,
          car_id: resolvedCarId,
          request_text: requestText.trim() || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        })
        .select("id, order_number")
        .single();
      if (orderError || !order) throw orderError ?? new Error("order");

      toast.success(`Наряд №${order.order_number} створено`);
      router.push(`/plan/${order.id}`);
      router.refresh();
    } catch (e) {
      setSaving(false);
      toast.error("Не вдалося створити наряд", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/plan">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Назад
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Новий наряд</h1>
      </header>

      {/* Stepper */}
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.n;
          const done = step > s.n;
          return (
            <div key={s.n} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-smooth",
                    active && "border-primary bg-primary text-primary-foreground",
                    done && "border-success bg-success text-success-foreground",
                    !active && !done && "border-border text-muted-foreground"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    active || done ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-3 h-px flex-1",
                    step > s.n ? "bg-success" : "bg-border"
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {/* STEP 1 — Client */}
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                Вибір / створення клієнта
              </h2>
              <Button
                variant={newClientMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setNewClientMode((v) => !v);
                  setCustomerId(null);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Новий клієнт
              </Button>
            </div>

            {newClientMode ? (
              <div className="grid gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nc-name">ПІБ</Label>
                  <Input
                    id="nc-name"
                    value={newClient.full_name}
                    onChange={(e) =>
                      setNewClient((c) => ({ ...c, full_name: e.target.value }))
                    }
                    placeholder="Іваненко Іван"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nc-phone">Телефон</Label>
                  <Input
                    id="nc-phone"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient((c) => ({ ...c, phone: e.target.value }))
                    }
                    placeholder="+380…"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    className="pl-9"
                    placeholder="Пошук за ПІБ або телефоном…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
                <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Клієнтів не знайдено. Створіть нового.
                    </p>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id);
                          setCarId(null);
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                          customerId === c.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        <span className="font-medium text-foreground">
                          {c.full_name}
                        </span>
                        <span className="text-muted-foreground">
                          {c.phone ?? ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* STEP 2 — Car */}
        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                Авто {selectedCustomer ? `· ${selectedCustomer.full_name}` : ""}
              </h2>
              <Button
                variant={newCarMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setNewCarMode((v) => !v);
                  setCarId(null);
                }}
              >
                <Plus className="h-4 w-4" aria-hidden />
                Нове авто
              </Button>
            </div>

            {newCarMode ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="car-plate">Держномер</Label>
                  <div className="flex gap-2">
                    <Input
                      id="car-plate"
                      value={newCar.plate}
                      onChange={(e) =>
                        setNewCar((c) => ({ ...c, plate: e.target.value }))
                      }
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
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Марка" value={newCar.make} onChange={(v) => setNewCar((c) => ({ ...c, make: v }))} placeholder="Toyota" />
                  <Field label="Модель" value={newCar.model} onChange={(v) => setNewCar((c) => ({ ...c, model: v }))} placeholder="Corolla" />
                  <Field label="Рік" value={newCar.year} onChange={(v) => setNewCar((c) => ({ ...c, year: v }))} inputMode="numeric" />
                  <Field label="VIN" value={newCar.vin} onChange={(v) => setNewCar((c) => ({ ...c, vin: v }))} />
                  <Field label="Двигун №" value={newCar.engine_number} onChange={(v) => setNewCar((c) => ({ ...c, engine_number: v }))} />
                  <Field label="Пробіг" value={newCar.mileage} onChange={(v) => setNewCar((c) => ({ ...c, mileage: v }))} inputMode="numeric" />
                  <Field label="КПП" value={newCar.transmission} onChange={(v) => setNewCar((c) => ({ ...c, transmission: v }))} />
                  <Field label="Привід" value={newCar.drive_type} onChange={(v) => setNewCar((c) => ({ ...c, drive_type: v }))} />
                  <Field label="Кузов" value={newCar.body_type} onChange={(v) => setNewCar((c) => ({ ...c, body_type: v }))} />
                  <Field label="Потужність" value={newCar.power} onChange={(v) => setNewCar((c) => ({ ...c, power: v }))} />
                </div>
              </div>
            ) : customerCars.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                У цього клієнта ще немає авто. Додайте нове.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {customerCars.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCarId(c.id)}
                    className={cn(
                      "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-smooth",
                      carId === c.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <span className="font-medium text-foreground">
                      {[c.make, c.model].filter(Boolean).join(" ") || "Авто"}
                      {c.year ? `, ${c.year}` : ""}
                    </span>
                    <span className="text-muted-foreground">{c.plate ?? ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* STEP 3 — Request */}
        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-foreground">Заявка клієнта</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="req-text">Опис заявки</Label>
              <Textarea
                id="req-text"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Стук у підвісці, заміна гальмівних колодок…"
                rows={5}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="req-date">Запланована дата (необов’язково)</Label>
              <Input
                id="req-date"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-fit"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Nav buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || saving}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Назад
        </Button>
        {step < 3 ? (
          <Button onClick={goNext}>
            Далі
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Створити наряд
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </div>
  );
}
