import { Package, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Sidebar navigation. Add modules here as they are built. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/sklad", label: "Склад", icon: Package },
];
