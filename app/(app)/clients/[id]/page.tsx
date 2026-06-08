import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  ClientDetail,
  type ClientCar,
  type ClientDetailData,
} from "@/components/clients/client-detail";
import type { VisitRow } from "@/components/plan/visit-history";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: cars }, { data: orders }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, comment")
      .eq("id", id)
      .single(),
    supabase
      .from("cars")
      .select("id, make, model, year, plate, vin")
      .eq("customer_id", id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, created_at, cars(make, model, plate), " +
          "order_works(price), order_parts(line_total), order_payments(amount)"
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const visits: VisitRow[] = (
    (orders ?? []) as unknown as (VisitRow & {
      cars: { make: string | null; model: string | null; plate: string | null } | null;
    })[]
  ).map((o) => ({
    ...o,
    subtitle: o.cars
      ? [[o.cars.make, o.cars.model].filter(Boolean).join(" "), o.cars.plate]
          .filter(Boolean)
          .join(" В· ")
      : undefined,
  }));

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ClientDetail
          client={client as ClientDetailData}
          cars={(cars ?? []) as ClientCar[]}
          visits={visits}
        />
      </div>
    </main>
  );
}
