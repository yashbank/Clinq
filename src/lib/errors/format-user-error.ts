/**
 * Calm, user-facing copy for common load/API failures. Prefer over raw Postgres or stack text in UI.
 */
export function formatWorkspaceLoadError(context: string, rawMessage?: string | null): string {
  const m = (rawMessage ?? "").trim();
  if (!m) {
    return `We could not load ${context}. Try again shortly.`;
  }
  if (/relation\s+"[^"]+"\s+does not exist|42P01|42703|column .* does not exist/i.test(m)) {
    return `${context} needs a newer database migration. If you self-host Supabase, apply pending migrations and refresh.`;
  }
  if (/JWT|jwt|session|auth|401|403/i.test(m)) {
    return `Your session may have expired. Sign in again, then retry ${context}.`;
  }
  if (/timeout|ETIMEDOUT|ECONNRESET|network/i.test(m)) {
    return `Network timed out while loading ${context}. Check your connection and retry.`;
  }
  if (/OpenAI|OPENAI|429|rate limit/i.test(m)) {
    return `The AI service is busy or rate-limited. Wait a moment and try again.`;
  }
  return `We could not load ${context}. If this persists, contact support with the approximate time.`;
}

export function formatActionFailure(context: string, rawMessage?: string | null): string {
  const m = (rawMessage ?? "").trim();
  if (!m) return `${context} could not be completed. Try again.`;
  if (/network|fetch failed|Failed to fetch/i.test(m)) return `Connection issue during ${context}. Check your network and retry.`;
  if (/JWT|jwt|session|auth|401|403|not authenticated/i.test(m)) {
    return `Your session may have expired. Sign in again, then retry ${context}.`;
  }
  if (/PGRST301|connection.*(refused|reset)|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timeout/i.test(m)) {
    return `We could not reach the database for ${context}. Wait a moment and try again.`;
  }
  if (/duplicate|unique constraint|23505/i.test(m)) {
    return `${context} hit a duplicate record. Refresh the page — it may already be saved.`;
  }
  if (/relation\s+"[^"]+"\s+does not exist|42P01|42703|column .* does not exist/i.test(m)) {
    return `${context} needs a newer database migration. Apply pending migrations and refresh.`;
  }
  if (/violates foreign key|23503/i.test(m)) {
    return `${context} referenced data that is no longer available. Refresh and try again.`;
  }
  const short = m.replace(/\s+/g, " ").slice(0, 160);
  return `${context} did not complete. ${short}${m.length > 160 ? "…" : ""}`;
}

function isAuthServiceUnreachableMessage(m: string): boolean {
  return /ENOTFOUND|getaddrinfo|EAI_AGAIN|ENETUNREACH|ECONNREFUSED|ERR_NAME_NOT_RESOLVED|name not resolved|Could not resolve host/i.test(
    m,
  );
}

const AUTH_SERVICE_UNREACHABLE =
  "Could not reach the authentication service. Confirm NEXT_PUBLIC_SUPABASE_URL in .env.local matches your active Supabase project (Dashboard → API), run npm run verify:env, then restart the dev server.";

/** Missing/invalid NEXT_PUBLIC_SUPABASE_* before a client is created. */
export function formatSupabaseConfigError(rawMessage?: string | null): string {
  const m = (rawMessage ?? "").trim();
  if (/NEXT_PUBLIC_SUPABASE|supabase\.co|invalid url|anon key/i.test(m)) {
    return "Authentication is not configured. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project API settings.";
  }
  return "Authentication is not configured. Check .env.local against .env.example, then restart the dev server.";
}

/** Calm copy for sign-in / sign-up style errors; avoids dumping raw provider strings when possible. */
export function formatCredentialError(context: string, rawMessage?: string | null): string {
  const m = (rawMessage ?? "").trim();
  if (!m) return `${context} did not succeed. Try again.`;
  if (isAuthServiceUnreachableMessage(m)) {
    return AUTH_SERVICE_UNREACHABLE;
  }
  if (/invalid login credentials|invalid email or password|wrong password/i.test(m)) {
    return "Email or password is incorrect.";
  }
  if (/email not confirmed|confirm your email|Email not confirmed/i.test(m)) {
    return "Please confirm your email before signing in.";
  }
  if (/network|fetch failed|Failed to fetch|AuthRetryableFetchError/i.test(m)) {
    return AUTH_SERVICE_UNREACHABLE;
  }
  if (/Missing or invalid Supabase public environment/i.test(m)) {
    return formatSupabaseConfigError(m);
  }
  return formatActionFailure(context, m);
}
