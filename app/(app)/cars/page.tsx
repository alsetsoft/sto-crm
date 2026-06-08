import { createClient } from "@/lib/supabase/server";
import { CarsClient, type CarListRow } from "@/components/cars/cars-client";

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cars")
    .select("id, make, model, year, vin, plate, customers(full_name)")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const cars = (data ?? []) as unknown as CarListRow[];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <CarsClient initialCars={cars} loadError={error?.message ?? null} />
      </div>
    </main>
  );
}
