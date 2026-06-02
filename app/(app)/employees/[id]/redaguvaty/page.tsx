import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  EmployeeForm,
  type EmployeeFormInitial,
} from "@/components/employees/employee-form";

export const dynamic = "force-dynamic";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, role, monthly_rate, work_percentage")
    .eq("id", id)
    .single();

  if (!employee) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <EmployeeForm initial={employee as EmployeeFormInitial} />
      </div>
    </main>
  );
}
