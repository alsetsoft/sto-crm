"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TriangleAlert, Search, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { ProblemCriticality } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ProblemRegistryRow {
  id: string;
  description: string;
  criticality: ProblemCriticality;
  status: "open" | "closed";
  resolved_at: string | null;
  created_at: string;
  orders: {
    id: string;
    order_number: string;
    customers: { full_name: string } | null;
    cars: { make: string | null; model: string | null; plate: string | null } | null;
  } | null;
}

interface ProblemsClientProps {
  initialProblems: ProblemRegistryRow[];
  loadError: string | null;
}

const CRIT: Record<ProblemCriticality, { label: string; badge: string }> = {
  high: { label: "Висока", badge: "bg-red-200 text-red-800" },
  medium: { label: "Середня", badge: "bg-amber-200 text-amber-800" },
  low: { label: "Низька", badge: "bg-slate-200 text-slate-700" },
};

const ALL = "__all__";

export function ProblemsClient({
  initialProblems,
  loadError,
}: ProblemsClientProps) {
  const [problems, setProblems] = useState<ProblemRegistryRow[]>(initialProblems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | typeof ALL>(
    "open"
  );
  const [critFilter, setCritFilter] = useState<ProblemCriticality | typeof ALL>(ALL);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const openCount = problems.filter((p) => p.status === "open").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return problems.filter((p) => {
      if (statusFilter !== ALL && p.status !== statusFilter) return false;
      if (critFilter !== ALL && p.criticality !== critFilter) return false;
      if (!q) return true;
      const o = p.orders;
      return (
        p.description.toLowerCase().includes(q) ||
        (o?.order_number ?? "").toLowerCase().includes(q) ||
        (o?.customers?.full_name ?? "").toLowerCase().includes(q) ||
        (o?.cars?.make ?? "").toLowerCase().includes(q) ||
        (o?.cars?.model ?? "").toLowerCase().includes(q) ||
        (o?.cars?.plate ?? "").toLowerCase().includes(q)
      );
    });
  }, [problems, search, statusFilter, critFilter]);

  async function resolve(id: string) {
    setResolvingId(id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("problems")
      .update({ status: "closed", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status, resolved_at")
      .single();
    setResolvingId(null);
    if (error || !data) {
      toast.error("Не вдалося вирішити проблему", { description: error?.message });
      return;
    }
    setProblems((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: "closed", resolved_at: data.resolved_at as string }
          : p
      )
    );
    toast.success("Проблему вирішено");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <TriangleAlert className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Проблеми</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {problems.length} усього ·{" "}
            <span className={cn(openCount > 0 && "font-medium text-destructive")}>
              {openCount} відкритих
            </span>
          </p>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити проблеми: {loadError}
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
            placeholder="Пошук за описом, клієнтом, авто або номером наряду…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Пошук проблем"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={statusFilter === "open"} onClick={() => setStatusFilter("open")} label="Відкриті" />
          <Chip active={statusFilter === "closed"} onClick={() => setStatusFilter("closed")} label="Закриті" />
          <Chip active={statusFilter === ALL} onClick={() => setStatusFilter(ALL)} label="Усі статуси" />
          <span className="mx-1 h-5 w-px bg-border" />
          <Chip active={critFilter === ALL} onClick={() => setCritFilter(ALL)} label="Будь-яка" />
          {(["high", "medium", "low"] as ProblemCriticality[]).map((c) => (
            <Chip
              key={c}
              active={critFilter === c}
              onClick={() => setCritFilter(c)}
              label={CRIT[c].label}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Проблем не знайдено.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4 shadow-sm sm:flex-row sm:items-center",
                p.status === "open"
                  ? "border-red-300 bg-red-50"
                  : "border-border bg-card"
              )}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      CRIT[p.criticality].badge
                    )}
                  >
                    {CRIT[p.criticality].label}
                  </span>
                  {p.orders ? (
                    <Link
                      href={`/plan/${p.orders.id}`}
                      className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-foreground hover:underline"
                    >
                      №{p.orders.order_number}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  ) : null}
                  <span className="text-sm text-muted-foreground">
                    {p.orders?.customers?.full_name ?? ""}
                    {p.orders?.cars
                      ? ` · ${[p.orders.cars.make, p.orders.cars.model]
                          .filter(Boolean)
                          .join(" ")}${
                          p.orders.cars.plate ? ` (${p.orders.cars.plate})` : ""
                        }`
                      : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-foreground">{p.description}</p>
              </div>
              <div className="shrink-0">
                {p.status === "open" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolve(p.id)}
                    disabled={resolvingId === p.id}
                  >
                    {resolvingId === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Check className="h-4 w-4" aria-hidden />
                    )}
                    Вирішити проблему
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-success">
                    <Check className="h-4 w-4" aria-hidden />
                    Вирішено
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-smooth",
        active
          ? "border-primary bg-primary/10 font-medium text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
