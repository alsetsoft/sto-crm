import { createClient } from "@/lib/supabase/server";
import {
  ServicesClient,
  type ServiceListRow,
} from "@/components/services/services-client";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, name, price, labor_hours")
    .eq("is_archived", false)
    .order("name");

  const services = (data ?? []) as ServiceListRow[];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ServicesClient
          initialServices={services}
          loadError={error?.message ?? null}
        />
      </div>
    </main>
  );
}
