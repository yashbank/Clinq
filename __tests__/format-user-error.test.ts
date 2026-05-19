import {
  formatActionFailure,
  formatCredentialError,
  formatSupabaseConfigError,
  formatWorkspaceLoadError,
} from "@/lib/errors/format-user-error";

describe("formatWorkspaceLoadError", () => {
  it("returns calm default when message empty", () => {
    expect(formatWorkspaceLoadError("automations")).toMatch(/could not load automations/i);
  });

  it("detects migration-style failures", () => {
    expect(formatWorkspaceLoadError("data", 'relation "foo" does not exist')).toMatch(/migration/i);
  });
});

describe("formatActionFailure", () => {
  it("handles network-ish copy", () => {
    expect(formatActionFailure("save", "TypeError: Failed to fetch")).toMatch(/connection/i);
  });

  it("softens duplicate constraint errors", () => {
    expect(formatActionFailure("Import", "duplicate key value violates unique constraint")).toMatch(/duplicate/i);
  });

  it("maps PostgREST connectivity noise", () => {
    expect(formatActionFailure("sync", "PGRST301 connection error")).toMatch(/database/i);
  });
});

describe("formatCredentialError", () => {
  it("maps invalid login to calm copy", () => {
    expect(formatCredentialError("Sign in", "Invalid login credentials")).toBe("Email or password is incorrect.");
  });

  it("maps email not confirmed", () => {
    expect(formatCredentialError("Sign in", "Email not confirmed")).toBe("Please confirm your email before signing in.");
  });

  it("maps DNS / fetch failures to auth service message", () => {
    expect(formatCredentialError("Sign in", "getaddrinfo ENOTFOUND xyz.supabase.co")).toMatch(
      /Could not reach the authentication service/i,
    );
    expect(formatCredentialError("Sign in", "getaddrinfo ENOTFOUND xyz.supabase.co")).toMatch(/verify:env/i);
    expect(formatCredentialError("Sign in", "Failed to fetch")).toMatch(/Could not reach the authentication service/i);
  });
});

describe("formatSupabaseConfigError", () => {
  it("mentions env.local setup", () => {
    expect(formatSupabaseConfigError("NEXT_PUBLIC_SUPABASE_URL invalid")).toMatch(/\.env\.local/i);
  });
});
