import { parseSupabasePublicEnv, supabaseProjectHostFromUrl } from "@/utils/supabase-env";

describe("parseSupabasePublicEnv", () => {
  it("accepts valid https supabase host and trims trailing slash", () => {
    const r = parseSupabasePublicEnv({
      url: "https://abcdefgh.supabase.co/",
      anonKey: "x".repeat(24),
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefgh.supabase.co");
    }
  });

  it("rejects non-supabase hosts", () => {
    const r = parseSupabasePublicEnv({
      url: "https://example.com",
      anonKey: "x".repeat(24),
    });
    expect(r.ok).toBe(false);
  });
});

describe("supabaseProjectHostFromUrl", () => {
  it("returns hostname only", () => {
    expect(supabaseProjectHostFromUrl("https://myref.supabase.co/")).toBe("myref.supabase.co");
  });
});
