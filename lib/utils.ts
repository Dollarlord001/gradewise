import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

export function formatCountdown(value: number | string | Date | null | undefined) {
  if (value == null || value === "") return "—";

  let total: number;

  if (typeof value === "number") {
    total = Math.floor(value);
  } else {
    const target = value instanceof Date ? value.getTime() : Date.parse(value);
    if (!Number.isFinite(target)) return "—";
    total = Math.floor((target - Date.now()) / 1000);
  }

  total = Math.max(0, total);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
