import { formatActionFailure, formatCredentialError, formatWorkspaceLoadError } from "@/lib/errors/format-user-error";

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
  it("softens invalid login copy", () => {
    expect(formatCredentialError("Sign in", "Invalid login credentials")).toMatch(/check the email/i);
  });
});
