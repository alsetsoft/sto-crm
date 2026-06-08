"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-items";
import { ROLE_LABEL, type Viewer } from "@/lib/auth/roles";

// Fixed-width leading zone shared by every row. Its center sits at 32px — the
// middle of the collapsed 64px rail — so icons never shift horizontally between
// the collapsed and expanded states; only the labels animate.
const ICON_ZONE = "flex w-12 shrink-0 items-center justify-center";

/** Label that smoothly collapses (width + opacity) when the rail is collapsed. */
function RowLabel({
  collapsed,
  className,
  children,
}: {
  collapsed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-all duration-300",
        collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Hover tooltip used to label icons while the rail is collapsed. */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
    >
      {children}
    </span>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center">
      <span className={ICON_ZONE}>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-sm">
          <Package className="h-5 w-5" aria-hidden />
        </span>
      </span>
      <span
        className={cn(
          "flex flex-col overflow-hidden leading-tight transition-all duration-300",
          collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
        )}
      >
        <span className="whitespace-nowrap text-sm font-bold text-foreground">
          СТО CRM
        </span>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          Автосервіс
        </span>
      </span>
    </div>
  );
}

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
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
              title={collapsed ? undefined : "Поки недоступно"}
              className="group relative flex cursor-not-allowed items-center rounded-md py-2 text-sm font-medium text-muted-foreground/45"
            >
              <span className={ICON_ZONE}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <RowLabel collapsed={collapsed}>{item.label}</RowLabel>
              {!collapsed ? (
                <span className="ml-auto mr-3 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">
                  Скоро
                </span>
              ) : (
                <Tip>{item.label} · скоро</Tip>
              )}
            </div>
          );
        }

        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center rounded-md py-2 text-sm font-medium transition-smooth",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className={ICON_ZONE}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <RowLabel collapsed={collapsed}>{item.label}</RowLabel>
            {collapsed ? <Tip>{item.label}</Tip> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountFooter({
  viewer,
  collapsed,
}: {
  viewer: Viewer;
  collapsed?: boolean;
}) {
  const roleLabel = viewer.role ? ROLE_LABEL[viewer.role] : "—";
  const initial = (viewer.email ?? "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center py-1">
        <span className={ICON_ZONE}>
          <span className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-foreground">
            {initial}
            {collapsed ? (
              <Tip>
                {roleLabel}
                {viewer.email ? ` · ${viewer.email}` : ""}
              </Tip>
            ) : null}
          </span>
        </span>
        <span
          className={cn(
            "flex min-w-0 flex-col overflow-hidden leading-tight transition-all duration-300",
            collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"
          )}
        >
          <span className="whitespace-nowrap text-sm font-medium text-foreground">
            {roleLabel}
          </span>
          {viewer.email ? (
            <span className="truncate whitespace-nowrap text-xs text-muted-foreground">
              {viewer.email}
            </span>
          ) : null}
        </span>
      </div>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="group relative flex w-full items-center rounded-md py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
        >
          <span className={ICON_ZONE}>
            <LogOut className="h-4 w-4" aria-hidden />
          </span>
          <RowLabel collapsed={collapsed}>Вийти</RowLabel>
          {collapsed ? <Tip>Вийти</Tip> : null}
        </button>
      </form>
    </div>
  );
}

export function Sidebar({
  viewer,
  collapsed = false,
  onToggleCollapse,
}: {
  viewer: Viewer;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "dark fixed inset-y-0 left-0 z-30 hidden flex-col gap-4 border-r border-border bg-card px-2 py-5 transition-[width] duration-300 lg:flex print:hidden",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col gap-1">
          <Brand collapsed={collapsed} />
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
            title={collapsed ? "Розгорнути меню" : "Згорнути меню"}
            className="group relative flex w-full items-center rounded-md py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
          >
            <span className={ICON_ZONE}>
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden />
              )}
            </span>
            <RowLabel collapsed={collapsed}>Згорнути</RowLabel>
            {collapsed ? <Tip>Розгорнути меню</Tip> : null}
          </button>
        </div>
        <NavList collapsed={collapsed} />
        <AccountFooter viewer={viewer} collapsed={collapsed} />
      </aside>

      {/* Mobile top bar */}
      <header className="dark fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-2 lg:hidden print:hidden">
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
          <aside className="dark fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-4 border-r border-border bg-card px-2 py-5 animate-fade-in-up">
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
