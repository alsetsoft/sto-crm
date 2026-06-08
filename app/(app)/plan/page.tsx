import { createClient } from "@/lib/supabase/server";
import { PlanClient } from "@/components/plan/plan-client";
import type { PlanOrderRow } from "@/components/plan/types";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, scheduled_at, created_at, request_text, " +
        "customers(full_name, phone), cars(make, model, plate, vin), " +
        "order_works(price), order_parts(line_total), order_payments(amount)"
    )
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as PlanOrderRow[];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <PlanClient initialOrders={orders} loadError={error?.message ?? null} />
      </div>
    </main>
  );
}
