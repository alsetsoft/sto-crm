"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  List as ListIcon,
  CalendarDays,
} from "lucide-react";

import type { OrderStatus } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STATUS_CONFIG, STATUS_ORDER, ALL_STATUSES } from "./status";
import { carLabel, orderTotals, type PlanOrderRow } from "./types";

interface PlanClientProps {
  initialOrders: PlanOrderRow[];
  loadError: string | null;
}

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderBlock({ order }: { order: PlanOrderRow }) {
  const cfg = STATUS_CONFIG[order.status];
  const totals = orderTotals(order);
  return (
    <Link
      href={`/plan/${order.id}`}
      className={cn(
        "block rounded-lg border p-3 shadow-sm transition-smooth",
        cfg.block
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-sm font-semibold text-foreground">
          №{order.order_number}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            cfg.badge
          )}
        >
          {cfg.label}
        </span>
      </div>
      <div className="mt-1.5 truncate text-sm font-medium text-foreground">
        {order.customers?.full_name ?? "—"}
      </div>
      <div className="truncate text-xs text-muted-foreground">
        {carLabel(order.cars)}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {order.scheduled_at
            ? formatDateTime(order.scheduled_at)
            : "Без дати"}
        </span>
        <span className="font-semibold text-foreground">
          {formatUAH(totals.total)}
        </span>
      </div>
    </Link>
  );
}

export function PlanClient({ initialOrders, loadError }: PlanClientProps) {
  const [orders] = useState<PlanOrderRow[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | typeof ALL_STATUSES>(
    ALL_STATUSES
  );
  const [view, setView] = useState<"list" | "week">("list");
  const [weekOffset, setWeekOffset] = useState(0);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== ALL_STATUSES && o.status !== status) return false;
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.customers?.full_name ?? "").toLowerCase().includes(q) ||
        (o.customers?.phone ?? "").toLowerCase().includes(q) ||
        (o.cars?.plate ?? "").toLowerCase().includes(q) ||
        (o.cars?.vin ?? "").toLowerCase().includes(q) ||
        (o.cars?.make ?? "").toLowerCase().includes(q) ||
        (o.cars?.model ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, status]);

  // Week grid base (apply current status/search filter too).
  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return WEEK_DAYS.map((label, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayOrders = filtered.filter(
        (o) => o.scheduled_at && sameDay(new Date(o.scheduled_at), day)
      );
      return { label, day, orders: dayOrders };
    });
  }, [weekStart, filtered]);

  const weekRangeLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" });
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }, [weekStart]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <CalendarRange className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">План</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {orders.length} нарядів
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-smooth",
                view === "list"
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListIcon className="h-4 w-4" aria-hidden />
              Список
            </button>
            <button
              type="button"
              onClick={() => setView("week")}
              aria-pressed={view === "week"}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm transition-smooth",
                view === "week"
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              Тиждень
            </button>
          </div>
          <Button asChild>
            <Link href="/plan/nova">
              <Plus className="h-4 w-4" aria-hidden />
              Новий наряд
            </Link>
          </Button>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити наряди: {loadError}
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Пошук за номером, клієнтом, авто, держномером, VIN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Пошук нарядів"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={status === ALL_STATUSES}
            onClick={() => setStatus(ALL_STATUSES)}
            label="Усі"
            count={orders.length}
          />
          {STATUS_ORDER.map((s) => (
            <FilterChip
              key={s}
              active={status === s}
              onClick={() => setStatus(s)}
              label={STATUS_CONFIG[s].label}
              count={counts[s] ?? 0}
              dot={STATUS_CONFIG[s].dot}
            />
          ))}
        </div>
      </div>

      {/* List view */}
      {view === "list" ? (
        filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((o) => (
              <OrderBlock key={o.id} order={o} />
            ))}
          </div>
        )
      ) : (
        /* Week view */
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((v) => v - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Попередній
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {weekRangeLabel}
              </span>
              {weekOffset !== 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset(0)}
                >
                  Цей тиждень
                </Button>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset((v) => v + 1)}
            >
              Наступний
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map(({ label, day, orders: dayOrders }) => (
              <div
                key={label}
                className={cn(
                  "flex min-h-[120px] flex-col gap-2 rounded-lg border border-border bg-card p-2",
                  sameDay(day, new Date()) && "ring-2 ring-primary/40"
                )}
              >
                <div className="flex items-baseline justify-between px-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {day.getDate()}
                  </span>
                </div>
                {dayOrders.map((o) => (
                  <OrderBlock key={o.id} order={o} />
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            У тижневому плані відображаються наряди із призначеною датою.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-smooth",
        active
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {dot ? <span className={cn("h-2 w-2 rounded-full", dot)} /> : null}
      {label}
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
      Нарядів не знайдено.
    </div>
  );
}
