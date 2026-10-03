import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function citationTag(sourceSection: string): string {
  const sectionMatch = sourceSection.match(/Section\s+[\d.]+/i);
  if (sectionMatch) {
    return sectionMatch[0];
  }

  const trimmed = sourceSection.replace(/\s+/g, " ").trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}…` : trimmed;
}

export function formatCategory(category: string): string {
  return category.replace(/_/g, " ");
}
