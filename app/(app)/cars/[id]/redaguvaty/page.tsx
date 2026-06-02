import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  CarForm,
  type CarFormCustomer,
  type CarFormInitial,
} from "@/components/cars/car-form";

export const dynamic = "force-dynamic";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: car }, { data: customers }] = await Promise.all([
    supabase
      .from("cars")
      .select(
        "id, customer_id, make, model, year, vin, engine_number, plate, mileage, " +
          "transmission, drive_type, body_type, power, comment"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("customers")
      .select("id, full_name")
      .eq("is_archived", false)
      .order("full_name"),
  ]);

  if (!car) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <CarForm
          customers={(customers ?? []) as CarFormCustomer[]}
          initial={car as unknown as CarFormInitial}
        />
      </div>
    </main>
  );
}
