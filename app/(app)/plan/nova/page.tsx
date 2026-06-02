import { createClient } from "@/lib/supabase/server";
import { NewOrderWizard } from "@/components/plan/new-order-wizard";
import type {
  WizardCar,
  WizardCustomer,
} from "@/components/plan/new-order-wizard";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: cars }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone")
      .eq("is_archived", false)
      .order("full_name"),
    supabase
      .from("cars")
      .select("id, customer_id, make, model, year, vin, plate")
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <NewOrderWizard
          customers={(customers ?? []) as WizardCustomer[]}
          cars={(cars ?? []) as WizardCar[]}
        />
      </div>
    </main>
  );
}
