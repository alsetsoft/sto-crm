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

/**
 * Sidebar navigation. Only "Склад" is open for now; the rest are gated off and
 * shown with a "Скоро" badge. Flip `available` back to `true` (and remove the
 * route from LOCKED_PREFIXES in middleware) as each module is opened up.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/plan", label: "План", icon: CalendarRange, available: false },
  { href: "/problems", label: "Проблеми", icon: TriangleAlert, available: false },
  { href: "/clients", label: "Клієнти", icon: Users, available: false },
  { href: "/cars", label: "Авто", icon: Car, available: false },
  { href: "/services", label: "Послуги", icon: ListChecks, available: false },
  { href: "/employees", label: "Працівники", icon: UserCog, available: false },
  { href: "/sklad", label: "Склад", icon: Package, available: true },
];
