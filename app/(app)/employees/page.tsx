import { createClient } from "@/lib/supabase/server";
import {
  EmployeesList,
  type EmployeeStat,
} from "@/components/employees/employees-list";
import type { EmployeeRole } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const monthLabel = now.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const [{ data: employees, error }, { data: accruals }, { data: payouts }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, full_name, role, monthly_rate, work_percentage")
        .eq("is_archived", false)
        .order("full_name"),
      supabase
        .from("employee_work_accruals")
        .select("employee_id, accrual")
        .gte("order_created_at", monthStart)
        .lt("order_created_at", monthEnd),
      supabase
        .from("payouts")
        .select("employee_id, amount")
        .gte("paid_at", monthStart)
        .lt("paid_at", monthEnd),
    ]);

  const accrualByEmp = new Map<string, number>();
  for (const a of accruals ?? []) {
    const id = a.employee_id as string | null;
    if (id) accrualByEmp.set(id, (accrualByEmp.get(id) ?? 0) + Number(a.accrual));
  }
  const payoutByEmp = new Map<string, number>();
  for (const p of payouts ?? []) {
    payoutByEmp.set(
      p.employee_id,
      (payoutByEmp.get(p.employee_id) ?? 0) + Number(p.amount)
    );
  }

  const stats: EmployeeStat[] = (employees ?? []).map((e) => {
    const accrual = accrualByEmp.get(e.id) ?? 0;
    const paid = payoutByEmp.get(e.id) ?? 0;
    return {
      id: e.id,
      full_name: e.full_name,
      role: e.role as EmployeeRole,
      monthly_rate: Number(e.monthly_rate),
      work_percentage: Number(e.work_percentage),
      accrual_month: accrual,
      payouts_month: paid,
      balance: Number(e.monthly_rate) + accrual - paid,
    };
  });

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <EmployeesList
          employees={stats}
          monthLabel={monthLabel}
          loadError={error?.message ?? null}
        />
      </div>
    </main>
  );
}
