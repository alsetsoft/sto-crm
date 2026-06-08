import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  ServiceForm,
  type ServiceFormInitial,
} from "@/components/services/service-form";

export const dynamic = "force-dynamic";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("id, name, price, labor_hours")
    .eq("id", id)
    .single();

  if (!service) notFound();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <ServiceForm initial={service as ServiceFormInitial} />
      </div>
    </main>
  );
}
