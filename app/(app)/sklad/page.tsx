import { createClient } from "@/lib/supabase/server";
import type { WarehouseItemRow } from "@/lib/supabase/types";
import { WarehouseClient } from "@/components/warehouse/warehouse-client";

export const dynamic = "force-dynamic";

export default async function SkladPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("warehouse_items")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const items = (data ?? []) as WarehouseItemRow[];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <WarehouseClient initialItems={items} loadError={error?.message ?? null} />
      </div>
    </main>
  );
}
