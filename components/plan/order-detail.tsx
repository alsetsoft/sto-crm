"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Wrench,
  Package,
  Users,
  AlertTriangle,
  CreditCard,
  Camera,
  Check,
  Printer,
  ClipboardCheck,
  Save,
  Undo2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { cn, formatUAH } from "@/lib/utils";
import type {
  OrderStatus,
  PaymentMethod,
  PartSource,
  ProblemCriticality,
  WorkSource,
} from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CONFIG } from "./status";
import { uploadOrderPhoto } from "./photo";
import { SignaturePad } from "./signature-pad";

// ---- Types ----
export interface PickerEmployee {
  id: string;
  full_name: string;
  role: string;
}
export interface PickerService {
  id: string;
  name: string;
  price: number;
  labor_hours: number;
}
export interface PickerWarehouseItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  sale_price: number;
  purchase_price_avg: number;
}

interface DExecutor {
  id: string;
  employee_id: string;
}
interface DWork {
  id: string;
  service_id: string | null;
  source: WorkSource;
  name: string;
  price: number;
  labor_hours: number;
  executor_id: string | null;
}
interface DPart {
  id: string;
  warehouse_item_id: string | null;
  source: PartSource;
  name: string;
  quantity: number;
  sale_price: number;
  purchase_price: number;
  line_total: number;
  line_margin: number;
}
interface DPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  comment: string | null;
}
interface DProblem {
  id: string;
  description: string;
  criticality: ProblemCriticality;
  status: "open" | "closed";
  resolved_at: string | null;
  created_at: string;
}
interface DPhoto {
  id: string;
  url: string;
  kind: string;
  source: string;
}

export interface OrderDetailData {
  id: string;
  order_number: string;
  status: OrderStatus;
  request_text: string | null;
  scheduled_at: string | null;
  intake_notes: string | null;
  signature_url: string | null;
  created_at: string;
  customers: {
    id: string;
    full_name: string;
    phone: string | null;
    comment: string | null;
  } | null;
  cars: {
    id: string;
    make: string | null;
    model: string | null;
    year: number | null;
    vin: string | null;
    engine_number: string | null;
    plate: string | null;
    mileage: number | null;
    transmission: string | null;
    drive_type: string | null;
    body_type: string | null;
    power: string | null;
    comment: string | null;
  } | null;
  order_executors: DExecutor[];
  order_works: DWork[];
  order_parts: DPart[];
  order_payments: DPayment[];
  problems: DProblem[];
  order_photos: DPhoto[];
}

interface OrderDetailProps {
  order: OrderDetailData;
  employees: PickerEmployee[];
  services: PickerService[];
  warehouseItems: PickerWarehouseItem[];
  /** Owner/admin see internal financials; masters see only the final total. */
  canSeeFinancials: boolean;
}

const CRITICALITY_LABEL: Record<ProblemCriticality, string> = {
  low: "Низька",
  medium: "Середня",
  high: "Висока",
};

// Workflow steps (problem is a side-state shown over in_progress).
const FLOW: OrderStatus[] = [
  "scheduled",
  "accepted",
  "in_progress",
  "done",
  "settled",
];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  scheduled: "accepted",
  accepted: "in_progress",
  in_progress: "done",
  done: "settled",
};
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  scheduled: "Прийняти авто",
  accepted: "Розпочати роботу",
  in_progress: "Завершити роботу",
  done: "Перейти до розрахунку",
};

export function OrderDetail({
  order,
  employees,
  services,
  warehouseItems,
  canSeeFinancials,
}: OrderDetailProps) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [executors, setExecutors] = useState<DExecutor[]>(order.order_executors);
  const [works, setWorks] = useState<DWork[]>(order.order_works);
  const [parts, setParts] = useState<DPart[]>(order.order_parts);
  const [payments, setPayments] = useState<DPayment[]>(order.order_payments);
  const [problems, setProblems] = useState<DProblem[]>(order.problems);
  const [photos, setPhotos] = useState<DPhoto[]>(order.order_photos);
  const [advancing, setAdvancing] = useState(false);

  const empName = (id: string | null) =>
    employees.find((e) => e.id === id)?.full_name ?? "—";

  const totals = useMemo(() => {
    const worksSum = works.reduce((s, w) => s + Number(w.price), 0);
    const partsSum = parts.reduce((s, p) => s + Number(p.line_total), 0);
    const total = worksSum + partsSum;
    const paid = payments.reduce((s, p) => s + Number(p.amount), 0);
    return { worksSum, partsSum, total, paid, due: total - paid };
  }, [works, parts, payments]);

  const openProblems = problems.filter((p) => p.status === "open").length;

  async function setOrderStatus(next: OrderStatus, silent = false) {
    const prev = status;
    setAdvancing(true);
    setStatus(next);
    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", order.id);
    setAdvancing(false);
    if (error) {
      setStatus(prev);
      toast.error("Не вдалося змінити статус", { description: error.message });
      return;
    }
    if (!silent) toast.success(`Статус: ${STATUS_CONFIG[next].label}`);
    router.refresh();
  }

  // Stepper index (problem maps onto the in_progress column).
  const activeIndex =
    status === "problem" ? FLOW.indexOf("in_progress") : FLOW.indexOf(status);
  const isWorkStage = status === "in_progress" || status === "problem";
  const next = NEXT_STATUS[status];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href="/plan">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Назад
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              Наряд №{order.order_number}
            </h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_CONFIG[status].badge
              )}
            >
              {STATUS_CONFIG[status].label}
            </span>
          </div>
        </div>
      </header>

      {/* Workflow stepper */}
      <WorkflowStepper
        activeIndex={activeIndex}
        isProblem={status === "problem"}
        onJump={(s) => setOrderStatus(s)}
      />

      {/* Always-visible compact client/car summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Клієнт" icon={Users}>
          <div className="text-base font-medium text-foreground">
            {order.customers ? (
              <Link
                href={`/clients/${order.customers.id}`}
                className="hover:underline"
              >
                {order.customers.full_name}
              </Link>
            ) : (
              "—"
            )}
          </div>
          {order.customers?.phone ? (
            <div className="text-sm text-muted-foreground">
              {order.customers.phone}
            </div>
          ) : null}
        </InfoCard>
        <InfoCard title="Авто" icon={Package}>
          <div className="text-base font-medium text-foreground">
            {order.cars ? (
              <Link href={`/cars/${order.cars.id}`} className="hover:underline">
                {[order.cars.make, order.cars.model].filter(Boolean).join(" ") ||
                  "Авто"}
                {order.cars.year ? `, ${order.cars.year}` : ""}
              </Link>
            ) : (
              "—"
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
            {order.cars?.plate ? <span>{order.cars.plate}</span> : null}
            {order.cars?.vin ? <span>VIN: {order.cars.vin}</span> : null}
            {order.cars?.mileage ? <span>{order.cars.mileage} км</span> : null}
          </div>
        </InfoCard>
      </div>

      {/* Documents — both acts available for preview & print at any step */}
      <InfoCard title="Документи" icon={FileText}>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/plan/${order.id}/druk?doc=intake`}
              target="_blank"
              rel="noreferrer"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Акт приймання авто
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={`/plan/${order.id}/druk?doc=work`}
              target="_blank"
              rel="noreferrer"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Акт виконаних робіт
            </a>
          </Button>
        </div>
      </InfoCard>

      {/* Problem alert (whenever there are open problems) */}
      {openProblems > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Відкритих проблем: <span className="font-semibold">{openProblems}</span>
        </div>
      ) : null}

      {/* ---------- STEP CONTENT ---------- */}

      {/* Step: Запис — request */}
      {status === "scheduled" ? (
        <InfoCard title="Заявка клієнта" icon={Wrench}>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {order.request_text || "Опис заявки не вказано."}
          </p>
          {order.scheduled_at ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Запланований візит:{" "}
              {new Date(order.scheduled_at).toLocaleString("uk-UA", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : null}
        </InfoCard>
      ) : null}

      {/* Step: Приймання — photos, notes, signature */}
      {status === "accepted" ? (
        <IntakeSection
          orderId={order.id}
          requestText={order.request_text}
          initialNotes={order.intake_notes}
          initialSignature={order.signature_url}
          photos={photos}
          setPhotos={setPhotos}
        />
      ) : null}

      {/* Step: В роботі / Проблема — executors, works, parts, problems */}
      {isWorkStage ? (
        <>
          <ExecutorsSection
            orderId={order.id}
            executors={executors}
            setExecutors={setExecutors}
            employees={employees}
            empName={empName}
          />
          <WorksSection
            orderId={order.id}
            works={works}
            setWorks={setWorks}
            services={services}
            employees={employees}
            empName={empName}
            worksSum={totals.worksSum}
          />
          <PartsSection
            orderId={order.id}
            parts={parts}
            setParts={setParts}
            warehouseItems={warehouseItems}
            partsSum={totals.partsSum}
          />
          <ProblemsSection
            orderId={order.id}
            status={status}
            problems={problems}
            setProblems={setProblems}
          />
        </>
      ) : null}

      {/* Step: Готово — read-only summary + totals */}
      {status === "done" ? (
        <>
          <SummarySection
            works={works}
            parts={parts}
            empName={empName}
            totals={totals}
            canSeeFinancials={canSeeFinancials}
          />
        </>
      ) : null}

      {/* Step: Розраховано — totals + payments (financials gated by role) */}
      {status === "settled" ? (
        <>
          <SummarySection
            works={works}
            parts={parts}
            empName={empName}
            totals={totals}
            canSeeFinancials={canSeeFinancials}
          />
          {canSeeFinancials ? (
            <PaymentsSection
              orderId={order.id}
              payments={payments}
              setPayments={setPayments}
              totals={totals}
            />
          ) : null}
        </>
      ) : null}

      {/* ---------- STEP ACTIONS ---------- */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-elegant">
        <div className="flex items-center gap-2">
          {activeIndex > 0 && status !== "problem" ? (
            <Button
              variant="ghost"
              onClick={() => setOrderStatus(FLOW[activeIndex - 1])}
              disabled={advancing}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              Крок назад
            </Button>
          ) : null}
          {status !== "problem" && isWorkStage ? (
            <Button
              variant="outline"
              className="text-red-700"
              onClick={() => setOrderStatus("problem")}
              disabled={advancing}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
              Позначити проблему
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {status === "problem" ? (
            <Button onClick={() => setOrderStatus("in_progress")} disabled={advancing}>
              {advancing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden />
              )}
              Повернути в роботу
            </Button>
          ) : next ? (
            <Button onClick={() => setOrderStatus(next)} disabled={advancing}>
              {advancing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : status === "in_progress" ? (
                <ClipboardCheck className="h-4 w-4" aria-hidden />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden />
              )}
              {NEXT_LABEL[status]}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-success">
              <Check className="h-4 w-4" aria-hidden />
              Наряд завершено
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workflow stepper
// ---------------------------------------------------------------------------

function WorkflowStepper({
  activeIndex,
  isProblem,
  onJump,
}: {
  activeIndex: number;
  isProblem: boolean;
  onJump: (s: OrderStatus) => void;
}) {
  const STEP_LABELS = ["Запис", "Приймання", "В роботі", "Готово", "Розрахунок"];
  return (
    <div className="flex items-center overflow-x-auto rounded-lg border border-border bg-card p-3 shadow-sm">
      {FLOW.map((s, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const problemHere = isProblem && i === activeIndex;
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onJump(s)}
              className="flex items-center gap-2"
              title={`Перейти: ${STEP_LABELS[i]}`}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-smooth",
                  problemHere && "border-red-400 bg-red-500 text-white",
                  active && !problemHere &&
                    "border-primary bg-primary text-primary-foreground",
                  done && "border-success bg-success text-success-foreground",
                  !active && !done && "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-sm font-medium",
                  active || done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {STEP_LABELS[i]}
              </span>
            </button>
            {i < FLOW.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-px min-w-[16px] flex-1",
                  i < activeIndex ? "bg-success" : "bg-border"
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function InfoCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h2>
        {action}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Intake (Приймання): notes + signature + photos
// ---------------------------------------------------------------------------

function IntakeSection({
  orderId,
  requestText,
  initialNotes,
  initialSignature,
  photos,
  setPhotos,
}: {
  orderId: string;
  requestText: string | null;
  initialNotes: string | null;
  initialSignature: string | null;
  photos: DPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<DPhoto[]>>;
}) {
  const supabase = createClient();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [signature, setSignature] = useState<string | null>(initialSignature);
  const [savingSig, setSavingSig] = useState(false);

  async function saveNotes() {
    setSavingNotes(true);
    const { error } = await supabase
      .from("orders")
      .update({ intake_notes: notes.trim() || null })
      .eq("id", orderId);
    setSavingNotes(false);
    if (error) {
      toast.error("Не вдалося зберегти примітки", { description: error.message });
      return;
    }
    toast.success("Примітки збережено");
  }

  async function saveSignature(blob: Blob) {
    setSavingSig(true);
    try {
      const file = new File([blob], "signature.png", { type: "image/png" });
      const url = await uploadOrderPhoto(file);
      const { error } = await supabase
        .from("orders")
        .update({ signature_url: url })
        .eq("id", orderId);
      if (error) throw error;
      setSignature(url);
      toast.success("Підпис збережено");
    } catch (e) {
      toast.error("Не вдалося зберегти підпис", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSavingSig(false);
    }
  }

  return (
    <>
      {requestText ? (
        <InfoCard title="Заявка клієнта" icon={Wrench}>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {requestText}
          </p>
        </InfoCard>
      ) : null}

      <PhotosSection orderId={orderId} photos={photos} setPhotos={setPhotos} />

      <InfoCard
        title="Примітки приймання"
        icon={ClipboardCheck}
        action={
          <Button size="sm" variant="outline" onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Зберегти
          </Button>
        }
      >
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Стан авто при прийманні, наявні пошкодження, рівень пального тощо…"
          rows={3}
        />
      </InfoCard>

      <InfoCard title="Підпис клієнта" icon={Camera}>
        {signature ? (
          <div className="flex flex-col gap-2">
            <div className="relative h-40 w-full max-w-md overflow-hidden rounded-md border border-border bg-white">
              <Image src={signature} alt="Підпис клієнта" fill className="object-contain" sizes="448px" />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={() => setSignature(null)}
            >
              Підписати заново
            </Button>
          </div>
        ) : (
          <SignaturePad saving={savingSig} onSave={saveSignature} />
        )}
      </InfoCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Read-only summary (Готово / Розраховано)
// ---------------------------------------------------------------------------

function SummarySection({
  works,
  parts,
  empName,
  totals,
  canSeeFinancials,
}: {
  works: DWork[];
  parts: DPart[];
  empName: (id: string | null) => string;
  totals: { worksSum: number; partsSum: number; total: number };
  canSeeFinancials: boolean;
}) {
  return (
    <InfoCard title="Виконані роботи та деталі" icon={ClipboardCheck}>
      {works.length === 0 && parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Роботи та деталі відсутні.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {works.length > 0 ? (
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                Роботи
              </div>
              <div className="flex flex-col divide-y divide-border">
                {works.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="flex-1 text-foreground">{w.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {empName(w.executor_id)}
                    </span>
                    {canSeeFinancials ? (
                      <span className="w-24 text-right font-medium tabular-nums">
                        {formatUAH(Number(w.price))}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {parts.length > 0 ? (
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                Деталі
              </div>
              <div className="flex flex-col divide-y divide-border">
                {parts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-1.5 text-sm">
                    <span className="flex-1 text-foreground">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {canSeeFinancials
                        ? `${p.quantity} × ${formatUAH(Number(p.sale_price))}`
                        : `${p.quantity} шт`}
                    </span>
                    {canSeeFinancials ? (
                      <span className="w-24 text-right font-medium tabular-nums">
                        {formatUAH(Number(p.line_total))}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Разом до сплати</span>
        <span className="text-lg font-bold tabular-nums text-foreground">
          {formatUAH(totals.total)}
        </span>
      </div>
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Executors
// ---------------------------------------------------------------------------

function ExecutorsSection({
  orderId,
  executors,
  setExecutors,
  employees,
  empName,
}: {
  orderId: string;
  executors: DExecutor[];
  setExecutors: React.Dispatch<React.SetStateAction<DExecutor[]>>;
  employees: PickerEmployee[];
  empName: (id: string | null) => string;
}) {
  const supabase = createClient();
  const [pick, setPick] = useState("");
  const available = employees.filter(
    (e) => !executors.some((x) => x.employee_id === e.id)
  );

  async function add() {
    if (!pick) return;
    const { data, error } = await supabase
      .from("order_executors")
      .insert({ order_id: orderId, employee_id: pick })
      .select("id, employee_id")
      .single();
    if (error || !data) {
      toast.error("Не вдалося додати виконавця", { description: error?.message });
      return;
    }
    setExecutors((prev) => [...prev, data as DExecutor]);
    setPick("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("order_executors").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setExecutors((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <InfoCard
      title="Виконавці"
      icon={Users}
      action={
        available.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="Додати виконавця" />
              </SelectTrigger>
              <SelectContent>
                {available.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" className="h-9 w-9" onClick={add} disabled={!pick}>
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : null
      }
    >
      {executors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Виконавців не призначено.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {executors.map((e) => (
            <span
              key={e.id}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
            >
              {empName(e.employee_id)}
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label="Прибрати виконавця"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Works
// ---------------------------------------------------------------------------

function WorksSection({
  orderId,
  works,
  setWorks,
  services,
  employees,
  empName,
  worksSum,
}: {
  orderId: string;
  works: DWork[];
  setWorks: React.Dispatch<React.SetStateAction<DWork[]>>;
  services: PickerService[];
  employees: PickerEmployee[];
  empName: (id: string | null) => string;
  worksSum: number;
}) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [executor, setExecutor] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [busy, setBusy] = useState(false);

  function pickService(id: string) {
    setServiceId(id);
    const s = services.find((x) => x.id === id);
    if (s) {
      setName(s.name);
      setPrice(String(s.price));
      setHours(String(s.labor_hours));
    }
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  async function add() {
    if (!name.trim()) {
      toast.error("Вкажіть назву роботи");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("order_works")
      .insert({
        order_id: orderId,
        service_id: serviceId || null,
        source: serviceId ? "catalog" : "manual",
        name: name.trim(),
        price: num(price),
        labor_hours: num(hours),
        executor_id: executor || null,
      })
      .select("id, service_id, source, name, price, labor_hours, executor_id")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Не вдалося додати роботу", { description: error?.message });
      return;
    }
    setWorks((prev) => [...prev, data as DWork]);
    setName("");
    setPrice("");
    setHours("");
    setExecutor("");
    setServiceId("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("order_works").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setWorks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <InfoCard title="Роботи" icon={Wrench}>
      {works.length > 0 ? (
        <div className="mb-3 flex flex-col divide-y divide-border">
          {works.map((w) => (
            <div key={w.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium text-foreground">{w.name}</div>
                <div className="text-xs text-muted-foreground">
                  {w.labor_hours ? `${w.labor_hours} н-год · ` : ""}
                  {empName(w.executor_id)}
                </div>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {formatUAH(Number(w.price))}
              </span>
              <button
                type="button"
                onClick={() => remove(w.id)}
                aria-label="Видалити роботу"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">Робіт ще немає.</p>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        {services.length > 0 ? (
          <Select value={serviceId} onValueChange={pickService}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Вибрати з довідника послуг" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {formatUAH(s.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input
            className="col-span-2 h-9"
            placeholder="Назва роботи"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="h-9"
            inputMode="decimal"
            placeholder="Ціна ₴"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <Input
            className="h-9"
            inputMode="decimal"
            placeholder="Н-год"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={executor} onValueChange={setExecutor}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="Виконавець" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={busy} className="h-9">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Додати
          </Button>
        </div>
      </div>

      <div className="mt-3 flex justify-end text-sm">
        <span className="text-muted-foreground">
          Сума робіт:{" "}
          <span className="font-semibold text-foreground">{formatUAH(worksSum)}</span>
        </span>
      </div>
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

function PartsSection({
  orderId,
  parts,
  setParts,
  warehouseItems,
  partsSum,
}: {
  orderId: string;
  parts: DPart[];
  setParts: React.Dispatch<React.SetStateAction<DPart[]>>;
  warehouseItems: PickerWarehouseItem[];
  partsSum: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [itemId, setItemId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [busy, setBusy] = useState(false);

  function pickItem(id: string) {
    setItemId(id);
    const it = warehouseItems.find((x) => x.id === id);
    if (it) {
      setName(it.name);
      setPrice(String(it.sale_price));
      setCost(String(it.purchase_price_avg));
    }
  }

  const num = (v: string) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  async function add() {
    if (!name.trim()) {
      toast.error("Вкажіть назву деталі");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("order_parts")
      .insert({
        order_id: orderId,
        warehouse_item_id: itemId || null,
        source: itemId ? "warehouse" : "manual",
        name: name.trim(),
        quantity: num(qty) || 1,
        sale_price: num(price),
        purchase_price: num(cost),
      })
      .select(
        "id, warehouse_item_id, source, name, quantity, sale_price, purchase_price, line_total, line_margin"
      )
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Не вдалося додати деталь", { description: error?.message });
      return;
    }
    setParts((prev) => [...prev, data as DPart]);
    setItemId("");
    setName("");
    setQty("1");
    setPrice("");
    setCost("");
    if ((data as DPart).source === "warehouse") router.refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("order_parts").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setParts((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  return (
    <InfoCard title="Деталі" icon={Package}>
      {parts.length > 0 ? (
        <div className="mb-3 flex flex-col divide-y divide-border">
          {parts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="flex-1">
                <div className="font-medium text-foreground">
                  {p.name}
                  {p.source === "warehouse" ? (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      зі складу
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.quantity} × {formatUAH(Number(p.sale_price))}
                </div>
              </div>
              <span className="font-semibold tabular-nums text-foreground">
                {formatUAH(Number(p.line_total))}
              </span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Видалити деталь"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">Деталей ще немає.</p>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
        {warehouseItems.length > 0 ? (
          <Select value={itemId} onValueChange={pickItem}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Зі складу" />
            </SelectTrigger>
            <SelectContent>
              {warehouseItems.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {it.name} · {it.quantity} {it.unit} · {formatUAH(it.sale_price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input
            className="col-span-2 h-9"
            placeholder="Назва деталі"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="h-9"
            inputMode="decimal"
            placeholder="К-сть"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <Input
            className="h-9"
            inputMode="decimal"
            placeholder="Ціна ₴"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={add} disabled={busy} className="h-9">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Додати
          </Button>
        </div>
      </div>

      <div className="mt-3 flex justify-end text-sm">
        <span className="text-muted-foreground">
          Сума деталей:{" "}
          <span className="font-semibold text-foreground">{formatUAH(partsSum)}</span>
        </span>
      </div>
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Payments + totals
// ---------------------------------------------------------------------------

function PaymentsSection({
  orderId,
  payments,
  setPayments,
  totals,
}: {
  orderId: string;
  payments: DPayment[];
  setPayments: React.Dispatch<React.SetStateAction<DPayment[]>>;
  totals: { total: number; paid: number; due: number };
}) {
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  async function add() {
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Вкажіть суму оплати");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("order_payments")
      .insert({ order_id: orderId, amount: value, method })
      .select("id, amount, method, paid_at, comment")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Не вдалося додати оплату", { description: error?.message });
      return;
    }
    setPayments((prev) => [...prev, data as DPayment]);
    setAmount("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("order_payments").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  function payRest() {
    if (totals.due > 0) setAmount(String(totals.due));
  }

  return (
    <InfoCard title="Розрахунок та оплата" icon={CreditCard}>
      <div className="mb-3 grid grid-cols-3 gap-3 text-center">
        <Total label="Усього" value={totals.total} />
        <Total label="Сплачено" value={totals.paid} tone="success" />
        <Total
          label="Залишок"
          value={totals.due}
          tone={totals.due > 0 ? "destructive" : "muted"}
        />
      </div>

      {payments.length > 0 ? (
        <div className="mb-3 flex flex-col divide-y divide-border">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1 text-muted-foreground">
                {p.method === "cash" ? "Готівка" : "Безнал"} ·{" "}
                {new Date(p.paid_at).toLocaleDateString("uk-UA")}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatUAH(Number(p.amount))}
              </span>
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Видалити оплату"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            className="h-9"
            inputMode="decimal"
            placeholder="Сума ₴"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        {totals.due > 0 ? (
          <Button variant="ghost" className="h-9" onClick={payRest}>
            Решта
          </Button>
        ) : null}
        <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Готівка</SelectItem>
            <SelectItem value="cashless">Безнал</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={add} disabled={busy} className="h-9">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Оплата
        </Button>
      </div>
    </InfoCard>
  );
}

function Total({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
          tone === "default" && "text-foreground"
        )}
      >
        {formatUAH(value)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problems
// ---------------------------------------------------------------------------

function ProblemsSection({
  orderId,
  status,
  problems,
  setProblems,
}: {
  orderId: string;
  status: OrderStatus;
  problems: DProblem[];
  setProblems: React.Dispatch<React.SetStateAction<DProblem[]>>;
}) {
  const supabase = createClient();
  const [description, setDescription] = useState("");
  const [criticality, setCriticality] = useState<ProblemCriticality>("medium");
  const [busy, setBusy] = useState(false);
  const canCreate = status === "in_progress" || status === "problem";

  async function add() {
    if (!description.trim()) {
      toast.error("Опишіть проблему");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("problems")
      .insert({ order_id: orderId, description: description.trim(), criticality })
      .select("id, description, criticality, status, resolved_at, created_at")
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error("Не вдалося створити проблему", { description: error?.message });
      return;
    }
    setProblems((prev) => [data as DProblem, ...prev]);
    setDescription("");
    setCriticality("medium");
  }

  async function resolve(id: string) {
    const { data, error } = await supabase
      .from("problems")
      .update({ status: "closed", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, description, criticality, status, resolved_at, created_at")
      .single();
    if (error || !data) {
      toast.error("Не вдалося вирішити", { description: error?.message });
      return;
    }
    setProblems((prev) => prev.map((p) => (p.id === id ? (data as DProblem) : p)));
    toast.success("Проблему вирішено");
  }

  return (
    <InfoCard title="Проблеми" icon={AlertTriangle}>
      {problems.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          {problems.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-sm",
                p.status === "closed"
                  ? "border-border bg-muted/30 opacity-70"
                  : "border-red-300 bg-red-50"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 rounded px-1.5 py-0.5 text-xs font-medium",
                  p.criticality === "high" && "bg-red-200 text-red-800",
                  p.criticality === "medium" && "bg-amber-200 text-amber-800",
                  p.criticality === "low" && "bg-slate-200 text-slate-700"
                )}
              >
                {CRITICALITY_LABEL[p.criticality]}
              </span>
              <p className="flex-1 text-foreground">{p.description}</p>
              {p.status === "open" ? (
                <Button size="sm" variant="outline" onClick={() => resolve(p.id)}>
                  <Check className="h-4 w-4" aria-hidden />
                  Вирішити
                </Button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="h-3.5 w-3.5" /> Вирішено
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">Проблем немає.</p>
      )}

      {canCreate ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <Textarea
            placeholder="Опис проблеми…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="flex items-center gap-2">
            <Select
              value={criticality}
              onValueChange={(v) => setCriticality(v as ProblemCriticality)}
            >
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низька</SelectItem>
                <SelectItem value="medium">Середня</SelectItem>
                <SelectItem value="high">Висока</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={add} disabled={busy} className="h-9">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Додати проблему
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Проблему можна створити лише коли наряд у статусі «В роботі».
        </p>
      )}
    </InfoCard>
  );
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

function PhotosSection({
  orderId,
  photos,
  setPhotos,
}: {
  orderId: string;
  photos: DPhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<DPhoto[]>>;
}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadOrderPhoto(file);
      const { data, error } = await supabase
        .from("order_photos")
        .insert({ order_id: orderId, url, kind: "intake", source: "upload" })
        .select("id, url, kind, source")
        .single();
      if (error || !data) throw error ?? new Error("photo");
      setPhotos((prev) => [...prev, data as DPhoto]);
    } catch (e) {
      toast.error("Не вдалося додати фото", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("order_photos").delete().eq("id", id);
    if (error) {
      toast.error("Не вдалося видалити", { description: error.message });
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <InfoCard
      title="Фото авто"
      icon={Camera}
      action={
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Додати фото
        </Button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Фото ще немає. Їх також можна передавати через Telegram.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="group relative h-24 w-24 overflow-hidden rounded-md border border-border"
            >
              <Image
                src={p.url}
                alt="Фото наряду"
                fill
                sizes="96px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => remove(p.id)}
                aria-label="Видалити фото"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 shadow-sm transition-smooth hover:bg-background group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </InfoCard>
  );
}
