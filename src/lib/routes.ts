/** App areas that require a Supabase session. */
export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/leads",
  "/proposals",
  "/pipeline",
  "/analytics",
  "/follow-ups",
  "/automations",
  "/settings",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}
