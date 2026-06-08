import { createClient } from "@/lib/supabase/server";
import { CarForm, type CarFormCustomer } from "@/components/cars/car-form";

export const dynamic = "force-dynamic";

export default async function NewCarPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer } = await searchParams;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name")
    .eq("is_archived", false)
    .order("full_name");

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <CarForm
          customers={(customers ?? []) as CarFormCustomer[]}
          defaultCustomerId={customer}
        />
      </div>
    </main>
  );
}
