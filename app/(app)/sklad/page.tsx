import { createClient } from "@/lib/supabase/server";
import type {
  WarehouseItemRow,
  WarehouseOverview,
} from "@/lib/supabase/types";
import { WarehouseClient } from "@/components/warehouse/warehouse-client";
import { PAGE_SIZE } from "@/components/warehouse/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function SkladPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = param(sp.q);
  const category = param(sp.cat);
  const subcategory = param(sp.sub);
  const showArchived = param(sp.arch) === "1";
  const pageRaw = Number.parseInt(param(sp.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const supabase = await createClient();

  let query = supabase
    .from("warehouse_items")
    .select("*", { count: "exact" })
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (!showArchived) query = query.eq("is_archived", false);
  if (category) query = query.eq("category", category);
  if (subcategory) query = query.eq("subcategory", subcategory);
  if (q) {
    // Strip PostgREST or()-filter delimiters so user input can't break the syntax.
    const safe = q.replace(/[,()%]/g, " ").trim();
    if (safe) {
      query = query.or(
        `name.ilike.%${safe}%,article.ilike.%${safe}%,barcode.ilike.%${safe}%`
      );
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const [listRes, overviewRes] = await Promise.all([
    query,
    supabase.rpc("warehouse_overview"),
  ]);

  const items = (listRes.data ?? []) as WarehouseItemRow[];
  const totalCount = listRes.count ?? 0;
  const loadError = listRes.error?.message ?? overviewRes.error?.message ?? null;

  const overview = (overviewRes.data as WarehouseOverview | null) ?? {
    active_count: 0,
    below_min: 0,
    negative: 0,
    total_value: 0,
    categories: [],
  };

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <WarehouseClient
          initialItems={items}
          loadError={loadError}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          overview={overview}
          filters={{ q, category, subcategory, showArchived }}
        />
      </div>
    </main>
  );
}
