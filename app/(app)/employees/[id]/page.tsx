import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  EmployeeDetail,
  type AccrualRow,
  type EmpPayout,
  type EmployeeDetailData,
} from "@/components/employees/employee-detail";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: accruals }, { data: payouts }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("id, full_name, role, monthly_rate, work_percentage")
        .eq("id", id)
        .single(),
      supabase
        .from("employee_work_accruals")
        .select("order_id, order_number, status, order_created_at, work_price, accrual")
        .eq("employee_id", id),
      supabase
        .from("payouts")
        .select("id, amount, type, paid_at, comment")
        .eq("employee_id", id)
        .order("paid_at", { ascending: false }),
    ]);

  if (!employee) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <EmployeeDetail
          employee={employee as EmployeeDetailData}
          accruals={(accruals ?? []) as AccrualRow[]}
          payouts={(payouts ?? []) as EmpPayout[]}
        />
      </div>
    </main>
  );
}
