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
  return `${context} did not complete: ${m.slice(0, 160)}${m.length > 160 ? "…" : ""}`;
}

/** Calm copy for sign-in / sign-up style errors; avoids dumping raw provider strings when possible. */
export function formatCredentialError(context: string, rawMessage?: string | null): string {
  const m = (rawMessage ?? "").trim();
  if (!m) return `${context} did not succeed. Try again.`;
  if (/invalid login credentials|invalid email or password|wrong password/i.test(m)) {
    return `${context}: check the email and password, or confirm your inbox if the account is new.`;
  }
  if (/email not confirmed|confirm your email/i.test(m)) {
    return `${context}: confirm your email from the inbox link, then try again.`;
  }
  if (/network|fetch failed|Failed to fetch/i.test(m)) {
    return `Connection issue during ${context}. Check your network and retry.`;
  }
  return formatActionFailure(context, m);
}
