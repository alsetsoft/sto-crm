import { createClient } from "@/lib/supabase/server";
import type { WarehouseOverview } from "@/lib/supabase/types";
import { NewItemForm } from "@/components/warehouse/new-item-form";

export const dynamic = "force-dynamic";

export default async function NovaPozytsiyaPage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("warehouse_overview");
  const overview = data as WarehouseOverview | null;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <NewItemForm categories={overview?.categories ?? []} />
      </div>
    </main>
  );
}
