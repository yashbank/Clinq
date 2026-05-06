import { z } from "zod";

import { isSupportedDisplayCurrency } from "@/types/currency";

/** Coerce null / undefined / non-arrays to []. */
function stringArray(maxItems: number, itemMax: number) {
  return z
    .union([z.array(z.unknown()), z.null(), z.undefined()])
    .transform((v) => {
      if (!Array.isArray(v)) return [];
      return v
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter(Boolean)
        .map((s) => s.slice(0, itemMax))
        .slice(0, maxItems);
    });
}

/** Nullable profile text: null, undefined, and "" → null. */
function nullableTrimmedString(max: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null) return null;
      const t = String(v).trim().slice(0, max);
      return t.length ? t : null;
    });
}

/** Optional URL-ish field: accepts null; trims; empty → null. */
function optionalUrlField(max: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v == null) return null;
      const t = String(v).trim().slice(0, max);
      return t.length ? t : null;
    });
}

export const freelancerProfileUpdateSchema = z.object({
  display_name: nullableTrimmedString(120),
  bio: nullableTrimmedString(4_000),
  website_url: optionalUrlField(2000),
  resume_text: nullableTrimmedString(48_000),
  resume_filename: nullableTrimmedString(255),
  skills: stringArray(80, 80),
  tech_stack: stringArray(80, 80),
  portfolio_links: stringArray(20, 2000),
  linkedin_url: optionalUrlField(2000),
  github_url: optionalUrlField(2000),
  experience_level: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => {
      if (s == null) return null;
      const v = String(s).trim().toLowerCase();
      if (!v) return null;
      if (v === "junior" || v === "mid" || v === "senior" || v === "lead") return v;
      return null;
    }),
  niches: stringArray(40, 80),
  preferred_currency: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((c) => {
      const raw = c == null ? "USD" : String(c).trim();
      return isSupportedDisplayCurrency(raw) ? raw : "USD";
    }),
  markComplete: z.boolean().optional(),
});

export type FreelancerProfileUpdateParsed = z.infer<typeof freelancerProfileUpdateSchema>;
