import Link from "next/link";

import type { OrderStatus } from "@/lib/supabase/types";
import { cn, formatUAH } from "@/lib/utils";
import { STATUS_CONFIG } from "./status";
import { orderTotals } from "./types";

export interface VisitRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  created_at: string;
  /** Optional car/owner label shown next to the order. */
  subtitle?: string;
  order_works: { price: number }[];
  order_parts: { line_total: number }[];
  order_payments: { amount: number }[];
}

/** Read-only list of a customer's or car's orders ("історія візитів"). */
export function VisitHistory({ orders }: { orders: VisitRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Візитів ще не було.</p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {orders.map((o) => {
        const cfg = STATUS_CONFIG[o.status];
        const totals = orderTotals(o);
        return (
          <Link
            key={o.id}
            href={`/plan/${o.id}`}
            className="flex items-center gap-3 py-2.5 text-sm transition-smooth hover:opacity-80"
          >
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", cfg.dot)} />
            <span className="font-mono font-semibold text-foreground">
              №{o.order_number}
            </span>
            <div className="flex-1 truncate">
              <span className="text-muted-foreground">{cfg.label}</span>
              {o.subtitle ? (
                <span className="text-muted-foreground"> · {o.subtitle}</span>
              ) : null}
            </div>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {new Date(o.created_at).toLocaleDateString("uk-UA")}
            </span>
            <span className="w-24 text-right font-semibold tabular-nums text-foreground">
              {formatUAH(totals.total)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
