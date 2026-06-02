import { createClient } from "@/lib/supabase/server";
import {
  ClientsClient,
  type ClientListRow,
} from "@/components/clients/clients-client";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, cars(id), orders(id)")
    .eq("is_archived", false)
    .order("full_name");

  const clients = (data ?? []) as unknown as ClientListRow[];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ClientsClient
          initialClients={clients}
          loadError={error?.message ?? null}
        />
      </div>
    </main>
  );
}
