import { formatActionFailure, formatWorkspaceLoadError } from "@/lib/errors/format-user-error";

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
});
