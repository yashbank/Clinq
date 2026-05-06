import { z } from "zod";

/** Treat null like undefined for optional form fields from JSON/API. */
export function nullishToUndef<T>(val: T | null | undefined): T | undefined {
  return val === null ? undefined : val;
}

/** Coerce null / non-array to string[]; trim, cap length and count. */
export function zStringArray(maxItems: number, maxLen: number) {
  return z.preprocess((v: unknown) => {
    if (!Array.isArray(v)) return [];
    return v
      .map((x) => (typeof x === "string" ? x : x == null ? "" : String(x)).trim())
      .filter((s) => s.length > 0)
      .map((s) => s.slice(0, maxLen))
      .slice(0, maxItems);
  }, z.array(z.string().max(maxLen)).max(maxItems));
}

export function zNullableTrimmedString(max: number) {
  return z.preprocess(nullishToUndef, z.union([z.string(), z.undefined()]).optional()).transform((s) => {
    if (s == null || typeof s !== "string") return null;
    const t = s.trim();
    return t.length === 0 ? null : t.slice(0, max);
  });
}
