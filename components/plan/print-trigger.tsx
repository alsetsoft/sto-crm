"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Doc = "intake" | "work";

/** Preview toolbar for the printable acts: back, act switcher and a print button. Hidden in print. */
export function PrintToolbar({ orderId, doc }: { orderId: string; doc: Doc }) {
  const router = useRouter();

  return (
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Назад
      </Button>

      <div className="flex rounded-md border border-border p-0.5">
        <DocTab orderId={orderId} target="intake" active={doc === "intake"}>
          Акт приймання
        </DocTab>
        <DocTab orderId={orderId} target="work" active={doc === "work"}>
          Акт виконаних робіт
        </DocTab>
      </div>

      <Button size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" aria-hidden />
        Друк / Зберегти PDF
      </Button>
    </div>
  );
}

function DocTab({
  orderId,
  target,
  active,
  children,
}: {
  orderId: string;
  target: Doc;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/plan/${orderId}/druk?doc=${target}`}
      className={cn(
        "rounded px-3 py-1.5 text-sm transition-smooth",
        active
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
