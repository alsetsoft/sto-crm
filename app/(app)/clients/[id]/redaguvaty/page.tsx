import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  ClientForm,
  type ClientFormInitial,
} from "@/components/clients/client-form";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("customers")
    .select("id, full_name, phone, comment")
    .eq("id", id)
    .single();

  if (!client) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <ClientForm initial={client as ClientFormInitial} />
      </div>
    </main>
  );
}
