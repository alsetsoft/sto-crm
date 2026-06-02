"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UserCog, Search, Plus, ChevronRight } from "lucide-react";

import type { EmployeeRole } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABEL } from "./employee-form";

export interface EmployeeStat {
  id: string;
  full_name: string;
  role: EmployeeRole;
  monthly_rate: number;
  work_percentage: number;
  accrual_month: number;
  payouts_month: number;
  balance: number;
}

interface EmployeesListProps {
  employees: EmployeeStat[];
  monthLabel: string;
  loadError: string | null;
}

export function EmployeesList({
  employees,
  monthLabel,
  loadError,
}: EmployeesListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.full_name.toLowerCase().includes(q));
  }, [employees, search]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
              <UserCog className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="text-2xl font-bold text-foreground">Працівники</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {employees.length} працівників · нарахування за {monthLabel}
          </p>
        </div>
        <Button asChild>
          <Link href="/employees/nova">
            <Plus className="h-4 w-4" aria-hidden />
            Новий працівник
          </Link>
        </Button>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Не вдалося завантажити працівників: {loadError}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Пошук за ПІБ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Пошук працівників"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground shadow-sm">
          Працівників не знайдено.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Працівник</th>
                <th className="px-4 py-2.5 text-right font-medium">Ставка</th>
                <th className="px-4 py-2.5 text-right font-medium">%</th>
                <th className="px-4 py-2.5 text-right font-medium">Нараховано</th>
                <th className="px-4 py-2.5 text-right font-medium">Виплати</th>
                <th className="px-4 py-2.5 text-right font-medium">Баланс</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border last:border-0 transition-smooth hover:bg-muted"
                >
                  <td className="px-4 py-3">
                    <Link href={`/employees/${e.id}`} className="block">
                      <div className="font-medium text-foreground">
                        {e.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_LABEL[e.role]}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatUAH(e.monthly_rate)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {e.work_percentage}%
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatUAH(e.accrual_month)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {formatUAH(e.payouts_month)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold tabular-nums",
                      e.balance > 0 ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {formatUAH(e.balance)}
                  </td>
                  <td className="px-2">
                    <Link href={`/employees/${e.id}`} aria-label="Відкрити">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
