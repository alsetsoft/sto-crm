import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/role";
import { OrderDetail } from "@/components/plan/order-detail";
import type {
  OrderDetailData,
  PickerEmployee,
  PickerService,
  PickerWarehouseItem,
} from "@/components/plan/order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { canSeeFinancials } = await getViewer();

  const [{ data: order }, { data: employees }, { data: services }, { data: warehouse }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, status, request_text, scheduled_at, intake_notes, signature_url, created_at, " +
            "customers(id, full_name, phone, comment), " +
            "cars(id, make, model, year, vin, engine_number, plate, mileage, transmission, drive_type, body_type, power, comment), " +
            "order_executors(id, employee_id), " +
            "order_works(id, service_id, source, name, price, labor_hours, executor_id), " +
            "order_parts(id, warehouse_item_id, source, name, quantity, sale_price, purchase_price, line_total, line_margin), " +
            "order_payments(id, amount, method, paid_at, comment), " +
            "problems(id, description, criticality, status, resolved_at, created_at), " +
            "order_photos(id, url, kind, source)"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("employees")
        .select("id, full_name, role")
        .eq("is_archived", false)
        .order("full_name"),
      supabase
        .from("services")
        .select("id, name, price, labor_hours")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("warehouse_items")
        .select("id, name, quantity, unit, sale_price, purchase_price_avg")
        .eq("is_archived", false)
        .order("name"),
    ]);

  if (!order) notFound();

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <OrderDetail
          order={order as unknown as OrderDetailData}
          employees={(employees ?? []) as PickerEmployee[]}
          services={(services ?? []) as PickerService[]}
          warehouseItems={(warehouse ?? []) as PickerWarehouseItem[]}
          canSeeFinancials={canSeeFinancials}
        />
      </div>
    </main>
  );
}
