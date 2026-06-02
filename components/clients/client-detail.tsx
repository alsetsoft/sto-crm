"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Car,
  ClipboardList,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { VisitHistory, type VisitRow } from "@/components/plan/visit-history";

export interface ClientDetailData {
  id: string;
  full_name: string;
  phone: string | null;
  comment: string | null;
}

export interface ClientCar {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  vin: string | null;
}

interface ClientDetailProps {
  client: ClientDetailData;
  cars: ClientCar[];
  visits: VisitRow[];
}

export function ClientDetail({ client, cars, visits }: ClientDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Видалити клієнта «${client.full_name}»? Авто клієнта також буде видалено.`
      )
    )
      return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", client.id);

    if (error) {
      setDeleting(false);
      toast.error("Не вдалося видалити клієнта", {
        description: error.message.includes("foreign key")
          ? "У клієнта є пов'язані наряди."
          : error.message,
      });
      return;
    }
    toast.success("Клієнта видалено");
    router.push("/clients");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            До клієнтів
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {client.full_name}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/clients/${client.id}/redaguvaty`}>
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

      {/* Contact */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="h-4 w-4 text-muted-foreground" aria-hidden />
            {client.phone ?? "Без телефону"}
          </div>
          {client.comment ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {client.comment}
            </p>
          ) : null}
        </div>
      </section>

      {/* Cars */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Car className="h-4 w-4 text-muted-foreground" aria-hidden />
            Авто ({cars.length})
          </h2>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/cars/nova?customer=${client.id}`}>
              <Plus className="h-4 w-4" aria-hidden />
              Додати авто
            </Link>
          </Button>
        </div>
        {cars.length === 0 ? (
          <p className="text-sm text-muted-foreground">Авто ще немає.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {cars.map((c) => (
              <Link
                key={c.id}
                href={`/cars/${c.id}`}
                className="flex items-center justify-between py-2.5 text-sm transition-smooth hover:opacity-80"
              >
                <span className="font-medium text-foreground">
                  {[c.make, c.model].filter(Boolean).join(" ") || "Авто"}
                  {c.year ? `, ${c.year}` : ""}
                </span>
                <span className="text-muted-foreground">{c.plate ?? c.vin ?? ""}</span>
              </Link>
            ))}
          </div>
        )}
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
