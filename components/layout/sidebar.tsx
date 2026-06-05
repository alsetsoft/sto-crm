"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, LogOut, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-items";
import { ROLE_LABEL, type Viewer } from "@/lib/auth/roles";

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
        <Package className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-foreground">СТО CRM</span>
        <span className="text-xs text-muted-foreground">Автосервіс</span>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        if (!item.available) {
          return (
            <div
              key={item.href}
              aria-disabled
              title="Поки недоступно"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/45"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
              <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                Скоро
              </span>
            </div>
          );
        }

        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountFooter({ viewer }: { viewer: Viewer }) {
  const roleLabel = viewer.role ? ROLE_LABEL[viewer.role] : "—";
  const initial = (viewer.email ?? "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5 rounded-md bg-muted/40 px-3 py-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-foreground">
          {initial}
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">{roleLabel}</span>
          {viewer.email ? (
            <span className="truncate text-xs text-muted-foreground">
              {viewer.email}
            </span>
          ) : null}
        </div>
      </div>
      <form action="/auth/signout" method="post" className="px-1">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Вийти
        </Button>
      </form>
    </div>
  );
}

export function Sidebar({ viewer }: { viewer: Viewer }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="dark fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-border bg-card px-3 py-5 lg:flex print:hidden">
        <Brand />
        <NavList />
        <AccountFooter viewer={viewer} />
      </aside>

      {/* Mobile top bar */}
      <header className="dark fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden print:hidden">
        <Brand />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Меню"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="dark fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 border-r border-border bg-card px-3 py-5 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Закрити меню"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <AccountFooter viewer={viewer} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
