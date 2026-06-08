"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { Viewer } from "@/lib/auth/roles";
import { Sidebar } from "./sidebar";

const STORAGE_KEY = "sidebar:collapsed";
// Below this viewport width the sidebar auto-collapses (tablets / 13" laptops).
const AUTO_COLLAPSE_BELOW = 1280;

/**
 * Owns the sidebar collapsed state and keeps the content area's left offset in
 * sync, so collapsing the menu hands the freed width to the page (e.g. the
 * warehouse table). Defaults to collapsed under 1280px; a manual toggle is
 * persisted and from then on wins over the responsive default.
 */
export function AppShell({
  viewer,
  children,
}: {
  viewer: Viewer;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Initial state: stored preference if the user ever set one, else responsive.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "1");
    else setCollapsed(window.innerWidth < AUTO_COLLAPSE_BELOW);
  }, []);

  // Follow the viewport only while the user hasn't expressed a preference.
  useEffect(() => {
    function onResize() {
      if (window.localStorage.getItem(STORAGE_KEY) !== null) return;
      setCollapsed(window.innerWidth < AUTO_COLLAPSE_BELOW);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      <Sidebar viewer={viewer} collapsed={collapsed} onToggleCollapse={toggle} />
      <div
        className={cn(
          "pt-14 transition-[padding] duration-300 lg:pt-0 print:!p-0",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {children}
      </div>
    </div>
  );
}
