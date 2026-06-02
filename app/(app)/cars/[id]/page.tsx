import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CarDetail, type CarDetailData } from "@/components/cars/car-detail";
import type { VisitRow } from "@/components/plan/visit-history";

export const dynamic = "force-dynamic";

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: car }, { data: orders }] = await Promise.all([
    supabase
      .from("cars")
      .select(
        "id, customer_id, make, model, year, vin, engine_number, plate, mileage, " +
          "transmission, drive_type, body_type, power, comment, " +
          "customers(id, full_name, phone)"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("orders")
      .select(
        "id, order_number, status, created_at, " +
          "order_works(price), order_parts(line_total), order_payments(amount)"
      )
      .eq("car_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!car) notFound();

  const visits = (orders ?? []) as unknown as VisitRow[];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <CarDetail car={car as unknown as CarDetailData} visits={visits} />
      </div>
    </main>
  );
}
