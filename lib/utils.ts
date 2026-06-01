import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

/** Formats a number as Ukrainian hryvnia, e.g. 33420 -> "33 420 ₴". */
export function formatUAH(value: number): string {
  return `${currencyFormatter.format(Math.round(value))} ₴`;
}
