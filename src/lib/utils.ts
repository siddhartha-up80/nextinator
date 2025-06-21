import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates text to specified length without adding any suffix
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text or original text if within limit
 */
export function smartTruncate(
  text: string,
  maxLength: number,
  suffix: string = ""
): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}
