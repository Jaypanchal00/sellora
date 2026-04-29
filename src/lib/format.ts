export function formatPrice(value: number, currency: string = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
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

export const CATEGORIES = [
  { value: "electronics", label: "Electronics", emoji: "📱" },
  { value: "vehicles", label: "Vehicles", emoji: "🚗" },
  { value: "property", label: "Property", emoji: "🏠" },
  { value: "fashion", label: "Fashion", emoji: "👗" },
  { value: "home", label: "Home & Garden", emoji: "🛋️" },
  { value: "jobs", label: "Jobs", emoji: "💼" },
  { value: "services", label: "Services", emoji: "🛠️" },
  { value: "hobbies", label: "Hobbies", emoji: "🎨" },
  { value: "other", label: "Other", emoji: "✨" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
