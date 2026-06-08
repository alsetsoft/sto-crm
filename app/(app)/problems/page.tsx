import { createClient } from "@/lib/supabase/server";
import {
  ProblemsClient,
  type ProblemRegistryRow,
} from "@/components/problems/problems-client";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("problems")
    .select(
      "id, description, criticality, status, resolved_at, created_at, " +
        "orders(id, order_number, customers(full_name), cars(make, model, plate))"
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  const problems = (data ?? []) as unknown as ProblemRegistryRow[];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <ProblemsClient
          initialProblems={problems}
          loadError={error?.message ?? null}
        />
      </div>
    </main>
  );
}
