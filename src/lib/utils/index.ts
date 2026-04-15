import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function formatSalary(
  salary: { min: number; max: number; currency: string; period: string } | undefined | null
): string | null {
  if (!salary) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(salary.min)} – ${fmt(salary.max)} / ${salary.period}`;
}

/** Split a free-text location ("City, Country" or "City") into parts. */
export function parseLocation(raw: string): { city: string; country: string } {
  if (!raw?.trim()) return { city: "", country: "" };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts.slice(0, -1).join(", "), country: parts[parts.length - 1] };
  }
  return { city: parts[0], country: "" };
}

export function calculateProfileCompleteness(profile: Record<string, unknown>): number {
  const weights: Record<string, number> = {
    headline: 10,
    summary: 15,
    skills: 15,
    experience: 25,
    education: 15,
    resumeURL: 20,
  };

  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    const value = profile[field];
    if (value && (typeof value !== "object" || (Array.isArray(value) && value.length > 0))) {
      score += weight;
    }
  }
  return score;
}
