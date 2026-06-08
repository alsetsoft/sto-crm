import {
  CalendarRange,
  Car,
  ListChecks,
  Package,
  TriangleAlert,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only available modules are clickable; others are shown as "поки недоступно". */
  available?: boolean;
}

/** Sidebar navigation. Add modules here as they are built. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/plan", label: "План", icon: CalendarRange, available: true },
  { href: "/problems", label: "Проблеми", icon: TriangleAlert, available: true },
  { href: "/clients", label: "Клієнти", icon: Users, available: true },
  { href: "/cars", label: "Авто", icon: Car, available: true },
  { href: "/services", label: "Послуги", icon: ListChecks, available: true },
  { href: "/employees", label: "Працівники", icon: UserCog, available: true },
  { href: "/sklad", label: "Склад", icon: Package, available: true },
];
