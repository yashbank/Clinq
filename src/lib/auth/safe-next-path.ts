/** Prevent open redirects: only same-origin relative paths allowed. */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  const n = (next ?? fallback).trim();
  if (!n.startsWith("/") || n.startsWith("//") || n.includes("\\")) {
    return fallback;
  }
  return n;
}
