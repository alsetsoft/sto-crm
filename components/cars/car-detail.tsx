"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { VisitHistory, type VisitRow } from "@/components/plan/visit-history";

export interface CarDetailData {
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
  customers: { id: string; full_name: string; phone: string | null } | null;
}

interface CarDetailProps {
  car: CarDetailData;
  visits: VisitRow[];
}

const SPECS: { key: keyof CarDetailData; label: string }[] = [
  { key: "year", label: "Рік" },
  { key: "plate", label: "Держномер" },
  { key: "vin", label: "VIN" },
  { key: "engine_number", label: "Номер двигуна" },
  { key: "mileage", label: "Пробіг (км)" },
  { key: "transmission", label: "Тип КПП" },
  { key: "drive_type", label: "Привід" },
  { key: "body_type", label: "Кузов" },
  { key: "power", label: "Потужність" },
];

export function CarDetail({ car, visits }: CarDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const title =
    [car.make, car.model].filter(Boolean).join(" ") || "Авто";

  async function handleDelete() {
    if (!window.confirm(`Видалити авто «${title}»?`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("cars").delete().eq("id", car.id);

    if (error) {
      setDeleting(false);
      toast.error("Не вдалося видалити авто", {
        description: error.message.includes("foreign key")
          ? "Авто має пов'язані наряди."
          : error.message,
      });
      return;
    }
    toast.success("Авто видалено");
    router.push("/cars");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/cars">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            До авто
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {title}
            {car.year ? `, ${car.year}` : ""}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/cars/${car.id}/redaguvaty`}>
                <Pencil className="h-4 w-4" aria-hidden />
                Редагувати
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Видалити
            </Button>
          </div>
        </div>
      </header>

      {/* Owner */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden />
          Власник
        </h2>
        {car.customers ? (
          <Link
            href={`/clients/${car.customers.id}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {car.customers.full_name}
            {car.customers.phone ? (
              <span className="ml-2 font-normal text-muted-foreground">
                {car.customers.phone}
              </span>
            ) : null}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </section>

      {/* Specs */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {SPECS.map(({ key, label }) => {
            const value = car[key];
            return (
              <div key={key} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium text-foreground">
                  {value == null || value === "" ? "—" : String(value)}
                </dd>
              </div>
            );
          })}
        </dl>
        {car.comment ? (
          <p className="mt-4 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
            {car.comment}
          </p>
        ) : null}
      </section>

      {/* Visit history */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
          Історія візитів ({visits.length})
        </h2>
        <VisitHistory orders={visits} />
      </section>
    </div>
  );
}
