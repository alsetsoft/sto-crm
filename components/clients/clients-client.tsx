"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, Car, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ClientListRow {
  id: string;
  full_name: string;
  phone: string | null;
  cars: { id: string }[];
  orders: { id: string }[];
}

interface ClientsClientProps {
  initialClients: ClientListRow[];
  loadError: string | null;
}

export function ClientsClient({ initialClients, loadError }: ClientsClientProps) {
  const [clients] = useState<ClientListRow[]>(initialClients);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <Users className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Клієнти</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {clients.length} клієнтів
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/nova">
            <Plus className="h-4 w-4" aria-hidden />
            Новий клієнт
          </Link>
        </Button>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити клієнтів: {loadError}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Пошук за ПІБ або телефоном…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Пошук клієнтів"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Клієнтів не знайдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm transition-smooth hover:border-primary/50 hover:shadow-card"
            >
              <div className="font-medium text-foreground">{c.full_name}</div>
              <div className="text-sm text-muted-foreground">
                {c.phone ?? "Без телефону"}
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Car className="h-3.5 w-3.5" aria-hidden />
                  {c.cars.length} авто
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                  {c.orders.length} візитів
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
