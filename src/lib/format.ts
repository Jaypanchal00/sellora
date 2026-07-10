export function formatPrice(value: number, _currency?: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value}`;
  }
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Sofa,
  Briefcase,
  Wrench,
  Palette,
  Sparkles,
  LucideIcon
} from "lucide-react";

export type CategoryValue = "electronics" | "vehicles" | "property" | "fashion" | "home" | "jobs" | "services" | "hobbies" | "other";

export const CATEGORIES: { value: CategoryValue; label: string; icon: LucideIcon }[] = [
  { value: "electronics", label: "Electronics", icon: Smartphone },
  { value: "vehicles", label: "Vehicles", icon: Car },
  { value: "property", label: "Property", icon: Home },
  { value: "fashion", label: "Fashion", icon: Shirt },
  { value: "home", label: "Home & Garden", icon: Sofa },
  { value: "jobs", label: "Jobs", icon: Briefcase },
  { value: "services", label: "Services", icon: Wrench },
  { value: "hobbies", label: "Hobbies", icon: Palette },
  { value: "other", label: "Other", icon: Sparkles },
];
