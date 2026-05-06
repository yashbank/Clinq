import "server-only";

const EXPECTED_JWT_ROLE = "service_role";

/** Decode JWT payload role claim without verifying signature (shape check only). */
export function decodeSupabaseJwtRole(jwt: string): string | null {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  const segment = parts[1];
  if (!segment) return null;
  try {
    const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = Buffer.from(b64 + pad, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Ensures the configured service key is not the anon key and decodes to `service_role`.
 * Prevents the common production mistake that surfaces as RLS errors on privileged tables.
 */
export function assertServiceRoleSupabaseKey(serviceKey: string, anonKey: string): void {
  if (serviceKey.trim() === anonKey.trim()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY matches NEXT_PUBLIC_SUPABASE_ANON_KEY. Use the service_role JWT from Supabase Project Settings → API.",
    );
  }
  const role = decodeSupabaseJwtRole(serviceKey);
  if (role !== EXPECTED_JWT_ROLE) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY must be a service_role JWT (decoded role: ${role ?? "unreadable"}). ` +
        "If the role is 'anon', the anon key was pasted into the service role environment variable.",
    );
  }
}

export { EXPECTED_JWT_ROLE };
