"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Car, Search, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface CarListRow {
  id: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  plate: string | null;
  customers: { full_name: string } | null;
}

interface CarsClientProps {
  initialCars: CarListRow[];
  loadError: string | null;
}

export function CarsClient({ initialCars, loadError }: CarsClientProps) {
  const [cars] = useState<CarListRow[]>(initialCars);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter(
      (c) =>
        (c.make ?? "").toLowerCase().includes(q) ||
        (c.model ?? "").toLowerCase().includes(q) ||
        (c.vin ?? "").toLowerCase().includes(q) ||
        (c.plate ?? "").toLowerCase().includes(q) ||
        (c.customers?.full_name ?? "").toLowerCase().includes(q)
    );
  }, [cars, search]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <Car className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Авто</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{cars.length} авто</p>
        </div>
        <Button asChild>
          <Link href="/cars/nova">
            <Plus className="h-4 w-4" aria-hidden />
            Нове авто
          </Link>
        </Button>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити авто: {loadError}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Пошук за маркою, моделлю, VIN, держномером, власником…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Пошук авто"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Авто не знайдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/cars/${c.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm transition-smooth hover:border-primary/50 hover:shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {[c.make, c.model].filter(Boolean).join(" ") || "Авто"}
                  {c.year ? `, ${c.year}` : ""}
                </span>
                {c.plate ? (
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {c.plate}
                  </span>
                ) : null}
              </div>
              {c.vin ? (
                <div className="text-xs text-muted-foreground">VIN: {c.vin}</div>
              ) : null}
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" aria-hidden />
                {c.customers?.full_name ?? "—"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
