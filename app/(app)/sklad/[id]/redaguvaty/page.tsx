import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type {
  WarehouseItemRow,
  WarehouseOverview,
} from "@/lib/supabase/types";
import { NewItemForm } from "@/components/warehouse/new-item-form";

export const dynamic = "force-dynamic";

export default async function RedaguvatyPozytsiyuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [itemRes, overviewRes] = await Promise.all([
    supabase.from("warehouse_items").select("*").eq("id", id).single(),
    supabase.rpc("warehouse_overview"),
  ]);

  if (!itemRes.data) notFound();

  const item = itemRes.data as WarehouseItemRow;
  const overview = overviewRes.data as WarehouseOverview | null;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <NewItemForm categories={overview?.categories ?? []} initial={item} />
      </div>
    </main>
  );
}
