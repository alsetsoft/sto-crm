import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PrintAct, type ActData } from "@/components/plan/print-act";
import { PrintToolbar } from "@/components/plan/print-trigger";

export const dynamic = "force-dynamic";

interface OrderForAct {
  order_number: string;
  created_at: string;
  request_text: string | null;
  intake_notes: string | null;
  signature_url: string | null;
  customers: { full_name: string; phone: string | null } | null;
  cars: {
    make: string | null;
    model: string | null;
    year: number | null;
    vin: string | null;
    plate: string | null;
    mileage: number | null;
    engine_number: string | null;
  } | null;
  order_works: { name: string; labor_hours: number; price: number }[];
  order_parts: {
    name: string;
    quantity: number;
    sale_price: number;
    line_total: number;
  }[];
  order_payments: { amount: number }[];
}

export default async function PrintActPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc } = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "order_number, created_at, request_text, intake_notes, signature_url, " +
        "customers(full_name, phone), " +
        "cars(make, model, year, vin, plate, mileage, engine_number), " +
        "order_works(name, labor_hours, price), " +
        "order_parts(name, quantity, sale_price, line_total), " +
        "order_payments(amount)"
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const o = data as unknown as OrderForAct;
  const total =
    o.order_works.reduce((s, w) => s + Number(w.price), 0) +
    o.order_parts.reduce((s, p) => s + Number(p.line_total), 0);
  const paid = o.order_payments.reduce((s, p) => s + Number(p.amount), 0);

  const docType: "intake" | "work" = doc === "intake" ? "intake" : "work";
  const act: ActData = {
    doc: docType,
    orderNumber: o.order_number,
    date: o.created_at,
    client: o.customers,
    car: o.cars,
    requestText: o.request_text,
    intakeNotes: o.intake_notes,
    signatureUrl: o.signature_url,
    works: o.order_works,
    parts: o.order_parts,
    total,
    paid,
    due: total - paid,
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 print:p-0">
      <PrintToolbar orderId={id} doc={docType} />
      <PrintAct {...act} />
    </div>
  );
}
