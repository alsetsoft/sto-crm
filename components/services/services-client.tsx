"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, Search, Plus, ChevronRight } from "lucide-react";

import { formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ServiceListRow {
  id: string;
  name: string;
  price: number;
  labor_hours: number;
}

interface ServicesClientProps {
  initialServices: ServiceListRow[];
  loadError: string | null;
}

export function ServicesClient({
  initialServices,
  loadError,
}: ServicesClientProps) {
  const [services] = useState<ServiceListRow[]>(initialServices);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, search]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <ListChecks className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Послуги</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Довідник робіт · {services.length} позицій
          </p>
        </div>
        <Button asChild>
          <Link href="/services/nova">
            <Plus className="h-4 w-4" aria-hidden />
            Нова послуга
          </Link>
        </Button>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити послуги: {loadError}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Пошук за назвою…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Пошук послуг"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Послуг не знайдено.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {filtered.map((s, i) => (
            <Link
              key={s.id}
              href={`/services/${s.id}/redaguvaty`}
              className={
                "flex items-center gap-4 px-4 py-3 transition-smooth hover:bg-muted" +
                (i > 0 ? " border-t border-border" : "")
              }
            >
              <span className="flex-1 font-medium text-foreground">{s.name}</span>
              <span className="w-24 text-right text-sm text-muted-foreground">
                {s.labor_hours ? `${s.labor_hours} н-год` : "—"}
              </span>
              <span className="w-28 text-right font-semibold tabular-nums text-foreground">
                {formatUAH(Number(s.price))}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
