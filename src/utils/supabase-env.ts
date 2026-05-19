import { z } from "zod";

const supabaseUrlSchema = z
  .string()
  .min(1, "NEXT_PUBLIC_SUPABASE_URL is empty")
  .transform((raw) => raw.trim().replace(/\/+$/, ""))
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && u.hostname.endsWith(".supabase.co");
    } catch {
      return false;
    }
  }, "must be https://<project-ref>.supabase.co");

const supabasePublicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY looks too short"),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicSchema>;

export type SupabaseEnvParseResult =
  | { ok: true; env: SupabasePublicEnv }
  | { ok: false; issues: string[] };

/** Parse public Supabase env without throwing (browser + server safe). */
export function parseSupabasePublicEnv(raw?: {
  url?: string | undefined;
  anonKey?: string | undefined;
}): SupabaseEnvParseResult {
  const parsed = supabasePublicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: raw?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: raw?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (parsed.success) {
    return { ok: true, env: parsed.data };
  }
  return {
    ok: false,
    issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/** Hostname only — safe for logs and UI hints (no secrets). */
export function supabaseProjectHostFromUrl(url: string): string | null {
  try {
    return new URL(url.trim().replace(/\/+$/, "")).hostname;
  } catch {
    return null;
  }
}

/** Structured server log fields when Supabase env or connectivity fails. Never includes keys. */
export function supabaseEnvDiagnosticForLog(): Record<string, unknown> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const host = url ? supabaseProjectHostFromUrl(url) : null;
  const parsed = parseSupabasePublicEnv();
  return {
    scope: "supabase_env",
    urlPresent: Boolean(url),
    host,
    anonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    serviceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    envValid: parsed.ok,
    issues: parsed.ok ? [] : parsed.issues,
  };
}
