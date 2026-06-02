import type { OrderStatus } from "@/lib/supabase/types";

export interface StatusConfig {
  /** Ukrainian label shown in the UI. */
  label: string;
  /** Classes applied to the WHOLE order block (per spec — color the block, not a badge). */
  block: string;
  /** Compact badge/dot styling for the same status. */
  badge: string;
  /** Solid dot color. */
  dot: string;
}

/**
 * Status → colour mapping (required by the spec):
 *  Запис — сірий, Прийнято — синій, В роботі — помаранчевий/жовтий,
 *  Готово — зелений, Розраховано — фіолетовий, Проблема — червоний.
 * Colours intentionally use literal Tailwind classes so JIT keeps them.
 */
export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  scheduled: {
    label: "Запис",
    block: "border-slate-300 bg-slate-50 hover:bg-slate-100",
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
  },
  accepted: {
    label: "Прийнято",
    block: "border-blue-300 bg-blue-50 hover:bg-blue-100",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "В роботі",
    block: "border-amber-300 bg-amber-50 hover:bg-amber-100",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  done: {
    label: "Готово",
    block: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  settled: {
    label: "Розраховано",
    block: "border-violet-300 bg-violet-50 hover:bg-violet-100",
    badge: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  problem: {
    label: "Проблема",
    block: "border-red-300 bg-red-50 hover:bg-red-100",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

/** Ordered list for filters and the status stepper. */
export const STATUS_ORDER: OrderStatus[] = [
  "scheduled",
  "accepted",
  "in_progress",
  "done",
  "settled",
  "problem",
];

export const ALL_STATUSES = "__all__";
