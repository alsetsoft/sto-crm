import type { OrderStatus } from "@/lib/supabase/types";

/** Order row enriched with the relations needed for the План list. */
export interface PlanOrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  scheduled_at: string | null;
  created_at: string;
  request_text: string | null;
  customers: { full_name: string; phone: string | null } | null;
  cars: {
    make: string | null;
    model: string | null;
    plate: string | null;
    vin: string | null;
  } | null;
  order_works: { price: number }[];
  order_parts: { line_total: number }[];
  order_payments: { amount: number }[];
}

export interface OrderTotals {
  works: number;
  parts: number;
  total: number;
  paid: number;
  due: number;
}

/** Sums works + parts (total), payments (paid) and the outstanding balance. */
export function orderTotals(o: {
  order_works: { price: number }[];
  order_parts: { line_total: number }[];
  order_payments: { amount: number }[];
}): OrderTotals {
  const works = o.order_works.reduce((s, w) => s + Number(w.price), 0);
  const parts = o.order_parts.reduce((s, p) => s + Number(p.line_total), 0);
  const paid = o.order_payments.reduce((s, p) => s + Number(p.amount), 0);
  const total = works + parts;
  return { works, parts, total, paid, due: total - paid };
}

/** Human label for a car, e.g. "Toyota Corolla · AA1234BB". */
export function carLabel(car: PlanOrderRow["cars"]): string {
  if (!car) return "—";
  const name = [car.make, car.model].filter(Boolean).join(" ").trim();
  return [name || "Авто", car.plate].filter(Boolean).join(" · ");
}
