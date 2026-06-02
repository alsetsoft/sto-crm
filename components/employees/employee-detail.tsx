"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  BarChart3,
  Wallet,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { EmployeeRole, OrderStatus, PayoutType } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CONFIG } from "@/components/plan/status";
import { ROLE_LABEL } from "./employee-form";

export interface AccrualRow {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  order_created_at: string;
  work_price: number;
  accrual: number;
}
export interface EmpPayout {
  id: string;
  amount: number;
  type: PayoutType;
  paid_at: string;
  comment: string | null;
}
export interface EmployeeDetailData {
  id: string;
  full_name: string;
  role: EmployeeRole;
  monthly_rate: number;
  work_percentage: number;
}

interface EmployeeDetailProps {
  employee: EmployeeDetailData;
  accruals: AccrualRow[];
  payouts: EmpPayout[];
}

type Period = "week" | "month" | "year" | "custom";

const PERIOD_LABEL: Record<Period, string> = {
  week: "Тиждень",
  month: "Місяць",
  year: "Рік",
  custom: "Період",
};
const PAYOUT_LABEL: Record<PayoutType, string> = {
  salary: "Зарплата",
  advance: "Аванс",
  bonus: "Премія",
};

function rangeFor(period: Period, from: string, to: string) {
  const now = new Date();
  if (period === "week") {
    const s = new Date(now);
    s.setHours(0, 0, 0, 0);
    s.setDate(s.getDate() - ((s.getDay() + 6) % 7));
    const e = new Date(s);
    e.setDate(s.getDate() + 7);
    return { start: s.getTime(), end: e.getTime() };
  }
  if (period === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(),
    };
  }
  if (period === "year") {
    return {
      start: new Date(now.getFullYear(), 0, 1).getTime(),
      end: new Date(now.getFullYear() + 1, 0, 1).getTime(),
    };
  }
  const start = from ? new Date(from).getTime() : 0;
  const end = to ? new Date(to).getTime() + 86_400_000 : 8.64e15;
  return { start, end };
}

function monthBounds() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime(),
  };
}

export function EmployeeDetail({
  employee,
  accruals,
  payouts: initialPayouts,
}: EmployeeDetailProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [payouts, setPayouts] = useState<EmpPayout[]>(initialPayouts);

  // ----- Reporting (period-filtered, works-based) -----
  const report = useMemo(() => {
    const { start, end } = rangeFor(period, from, to);
    const rows = accruals.filter((a) => {
      const t = new Date(a.order_created_at).getTime();
      return t >= start && t < end;
    });
    const byOrder = new Map<
      string,
      {
        order_id: string;
        order_number: string;
        status: OrderStatus;
        date: string;
        works: number;
        accrual: number;
      }
    >();
    for (const r of rows) {
      const cur = byOrder.get(r.order_id) ?? {
        order_id: r.order_id,
        order_number: r.order_number,
        status: r.status,
        date: r.order_created_at,
        works: 0,
        accrual: 0,
      };
      cur.works += Number(r.work_price);
      cur.accrual += Number(r.accrual);
      byOrder.set(r.order_id, cur);
    }
    const orders = Array.from(byOrder.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const worksSum = orders.reduce((s, o) => s + o.works, 0);
    const accrualSum = orders.reduce((s, o) => s + o.accrual, 0);
    return { orders, worksSum, accrualSum };
  }, [accruals, period, from, to]);

  // ----- Payroll balance (current month) -----
  const payroll = useMemo(() => {
    const { start, end } = monthBounds();
    const accrualMonth = accruals
      .filter((a) => {
        const t = new Date(a.order_created_at).getTime();
        return t >= start && t < end;
      })
      .reduce((s, a) => s + Number(a.accrual), 0);
    const payoutsMonth = payouts
      .filter((p) => {
        const t = new Date(p.paid_at).getTime();
        return t >= start && t < end;
      })
      .reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(employee.monthly_rate) + accrualMonth - payoutsMonth;
    return { accrualMonth, payoutsMonth, balance };
  }, [accruals, payouts, employee.monthly_rate]);

  // ----- Add / delete payout -----
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<PayoutType>("salary");
  const [busy, setBusy] = useState(false);

  async function addPayout() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Вкажіть суму виплати");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payouts")
      .insert({ employee_id: employee.id, amount: value, type })
      .select("id, amount, type, paid_at, comment")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Не вдалося додати виплату", { description: error?.message });
      return;
    }
    setPayouts((prev) => [data as EmpPayout, ...prev]);
    setAmount("");
    router.refresh();
  }

  async function removePayout(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("payouts").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setPayouts((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            До працівників
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {employee.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ROLE_LABEL[employee.role]} · ставка {formatUAH(employee.monthly_rate)} ·{" "}
              {employee.work_percentage}% від робіт
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/employees/${employee.id}/redaguvaty`}>
              <Pencil className="h-4 w-4" aria-hidden />
              Редагувати
            </Link>
          </Button>
        </div>
      </header>

      {/* Payroll balance (current month) */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
          Розрахунок за поточний місяць
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Ставка" value={formatUAH(employee.monthly_rate)} />
          <Stat label="Нараховано %" value={formatUAH(payroll.accrualMonth)} />
          <Stat label="Виплачено" value={formatUAH(payroll.payoutsMonth)} />
          <Stat
            label="Баланс до виплати"
            value={formatUAH(payroll.balance)}
            tone={payroll.balance > 0 ? "success" : "muted"}
          />
        </div>
      </section>

      {/* Reporting */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
            Звітність
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["week", "month", "year", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-smooth",
                  period === p
                    ? "border-primary bg-primary/10 font-medium text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {period === "custom" ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-auto"
              aria-label="Від"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-auto"
              aria-label="До"
            />
          </div>
        ) : null}

        {report.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            За обраний період наряди відсутні.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 font-medium">Наряд</th>
                  <th className="py-2 font-medium">Дата</th>
                  <th className="py-2 text-right font-medium">Сума робіт</th>
                  <th className="py-2 text-right font-medium">Нарахування</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map((o) => (
                  <tr key={o.order_id} className="border-b border-border last:border-0">
                    <td className="py-2">
                      <Link
                        href={`/plan/${o.order_id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <span
                          className={cn("h-2 w-2 rounded-full", STATUS_CONFIG[o.status].dot)}
                        />
                        <span className="font-mono font-medium text-foreground">
                          №{o.order_number}
                        </span>
                      </Link>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(o.date).toLocaleDateString("uk-UA")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">
                      {formatUAH(o.works)}
                    </td>
                    <td className="py-2 text-right font-medium tabular-nums text-foreground">
                      {formatUAH(o.accrual)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-2" colSpan={2}>
                    Разом ({employee.work_percentage}%)
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatUAH(report.worksSum)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-success">
                    {formatUAH(report.accrualSum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Payouts */}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
          Виплати
        </h2>

        {payouts.length > 0 ? (
          <div className="mb-3 flex flex-col divide-y divide-border">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-24 font-medium text-foreground">
                  {PAYOUT_LABEL[p.type]}
                </span>
                <span className="flex-1 text-muted-foreground">
                  {new Date(p.paid_at).toLocaleDateString("uk-UA")}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatUAH(Number(p.amount))}
                </span>
                <button
                  type="button"
                  onClick={() => removePayout(p.id)}
                  aria-label="Видалити виплату"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">Виплат ще не було.</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onValueChange={(v) => setType(v as PayoutType)}>
            <SelectTrigger className="h-9 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salary">Зарплата</SelectItem>
              <SelectItem value="advance">Аванс</SelectItem>
              <SelectItem value="bonus">Премія</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="h-9 w-36"
            inputMode="decimal"
            placeholder="Сума ₴"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={addPayout} disabled={busy} className="h-9">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Додати виплату
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "muted";
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-base font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "muted" && "text-muted-foreground",
          tone === "default" && "text-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}
