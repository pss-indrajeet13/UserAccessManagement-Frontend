import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUserStatus(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "active", "activated", "enable", "enabled", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "inactive", "deactivated", "disabled", "pending", "no"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}
