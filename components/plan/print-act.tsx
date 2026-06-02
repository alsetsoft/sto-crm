import Image from "next/image";

import { formatUAH } from "@/lib/utils";

export interface ActData {
  doc: "intake" | "work";
  orderNumber: string;
  date: string;
  client: { full_name: string; phone: string | null } | null;
  car: {
    make: string | null;
    model: string | null;
    year: number | null;
    vin: string | null;
    plate: string | null;
    mileage: number | null;
    engine_number: string | null;
  } | null;
  requestText: string | null;
  intakeNotes: string | null;
  signatureUrl: string | null;
  works: { name: string; labor_hours: number; price: number }[];
  parts: { name: string; quantity: number; sale_price: number; line_total: number }[];
  total: number;
  paid: number;
  due: number;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function carTitle(car: ActData["car"]) {
  if (!car) return "—";
  return (
    [car.make, car.model].filter(Boolean).join(" ") +
      (car.year ? `, ${car.year}` : "") || "Авто"
  );
}

export function PrintAct(data: ActData) {
  const title =
    data.doc === "intake" ? "Акт приймання авто" : "Акт виконаних робіт";

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-sm text-black print:p-0">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-black/20 pb-4">
        <div>
          <div className="text-lg font-bold">СТО CRM — Автосервіс</div>
          <div className="text-xs text-black/60">Станція технічного обслуговування</div>
        </div>
        <div className="text-right">
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-black/60">
            № {data.orderNumber} від {fmtDate(data.date)}
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="mb-5 grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs uppercase text-black/50">Замовник</div>
          <div className="font-medium">{data.client?.full_name ?? "—"}</div>
          {data.client?.phone ? (
            <div className="text-black/70">{data.client.phone}</div>
          ) : null}
        </div>
        <div>
          <div className="text-xs uppercase text-black/50">Автомобіль</div>
          <div className="font-medium">{carTitle(data.car)}</div>
          <div className="text-black/70">
            {data.car?.plate ? `Держномер: ${data.car.plate}` : ""}
          </div>
          {data.car?.vin ? <div className="text-black/70">VIN: {data.car.vin}</div> : null}
          {data.car?.mileage ? (
            <div className="text-black/70">Пробіг: {data.car.mileage} км</div>
          ) : null}
        </div>
      </div>

      {/* Intake-specific */}
      {data.doc === "intake" ? (
        <>
          {data.requestText ? (
            <Section title="Заявка клієнта">
              <p className="whitespace-pre-wrap">{data.requestText}</p>
            </Section>
          ) : null}
          <Section title="Стан авто при прийманні">
            <p className="whitespace-pre-wrap">
              {data.intakeNotes || "Зауважень немає."}
            </p>
          </Section>
          <p className="mb-8 mt-4">
            Автомобіль прийнято на станцію технічного обслуговування для виконання
            заявлених робіт. Сторони підтверджують зафіксований вище стан авто.
          </p>
        </>
      ) : (
        <>
          {/* Works table */}
          <Section title="Виконані роботи">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black/30 text-xs uppercase text-black/50">
                  <th className="py-1.5">Найменування</th>
                  <th className="w-20 py-1.5 text-right">Н-год</th>
                  <th className="w-28 py-1.5 text-right">Сума</th>
                </tr>
              </thead>
              <tbody>
                {data.works.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 text-black/50">
                      Роботи відсутні
                    </td>
                  </tr>
                ) : (
                  data.works.map((w, i) => (
                    <tr key={i} className="border-b border-black/10">
                      <td className="py-1.5">{w.name}</td>
                      <td className="py-1.5 text-right">{w.labor_hours || "—"}</td>
                      <td className="py-1.5 text-right">{formatUAH(Number(w.price))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Section>

          {/* Parts table */}
          <Section title="Використані деталі">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black/30 text-xs uppercase text-black/50">
                  <th className="py-1.5">Найменування</th>
                  <th className="w-16 py-1.5 text-right">К-сть</th>
                  <th className="w-24 py-1.5 text-right">Ціна</th>
                  <th className="w-28 py-1.5 text-right">Сума</th>
                </tr>
              </thead>
              <tbody>
                {data.parts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-2 text-black/50">
                      Деталі відсутні
                    </td>
                  </tr>
                ) : (
                  data.parts.map((p, i) => (
                    <tr key={i} className="border-b border-black/10">
                      <td className="py-1.5">{p.name}</td>
                      <td className="py-1.5 text-right">{p.quantity}</td>
                      <td className="py-1.5 text-right">
                        {formatUAH(Number(p.sale_price))}
                      </td>
                      <td className="py-1.5 text-right">
                        {formatUAH(Number(p.line_total))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Section>

          {/* Totals */}
          <div className="mb-8 ml-auto mt-4 w-64 space-y-1">
            <Row label="Разом до сплати" value={formatUAH(data.total)} bold />
            <Row label="Сплачено" value={formatUAH(data.paid)} />
            <Row label="Залишок" value={formatUAH(data.due)} />
          </div>
        </>
      )}

      {/* Signatures */}
      <div className="mt-10 grid grid-cols-2 gap-10">
        <Signature label="Виконавець" />
        <Signature label="Замовник" image={data.signatureUrl} />
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-black/60">{label}</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}

function Signature({ label, image }: { label: string; image?: string | null }) {
  return (
    <div>
      {image ? (
        <div className="relative mb-1 h-16 w-full">
          <Image src={image} alt="Підпис" fill className="object-contain object-left" sizes="300px" />
        </div>
      ) : (
        <div className="mb-1 h-16" />
      )}
      <div className="border-t border-black/40 pt-1 text-xs text-black/60">
        {label} (підпис)
      </div>
    </div>
  );
}
