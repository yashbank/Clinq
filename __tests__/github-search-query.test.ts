import {
  buildGithubSearchQueryVariants,
  GITHUB_SEARCH_QUERY_MAX_LENGTH,
  sanitizeGitHubUserQueryFragment,
} from "@/lib/leads/sources/github-search-query";

describe("buildGithubSearchQueryVariants", () => {
  it("never uses invalid comma-qualified in:title,in:body syntax", () => {
    for (const { q } of buildGithubSearchQueryVariants("react typescript")) {
      expect(q).not.toMatch(/in:title,\s*in:body/i);
    }
  });

  it("orders primary then simplified then minimal", () => {
    const v = buildGithubSearchQueryVariants("nextjs");
    expect(v.map((x) => x.label)).toEqual(["primary", "simplified", "minimal"]);
    expect(v[0]!.q).toContain("hire OR hiring");
    expect(v[1]!.q).toContain("nextjs");
    expect(v[1]!.q).not.toContain("hire OR");
    expect(v[2]!.q).toContain("nextjs");
  });

  it("keeps every variant within GitHub max length", () => {
    const long = "a".repeat(200);
    for (const { q } of buildGithubSearchQueryVariants(long)) {
      expect(q.length).toBeLessThanOrEqual(GITHUB_SEARCH_QUERY_MAX_LENGTH);
    }
  });

  it("returns minimal open issues when user fragment is empty", () => {
    const v = buildGithubSearchQueryVariants("   ");
    expect(v).toHaveLength(1);
    expect(v[0]!.q).toBe("is:issue is:open");
  });
});

describe("sanitizeGitHubUserQueryFragment", () => {
  it("strips quotes and collapses whitespace", () => {
    expect(sanitizeGitHubUserQueryFragment('  foo  "bar"  `baz` ')).toContain("foo");
    expect(sanitizeGitHubUserQueryFragment('  foo  "bar"  `baz` ')).not.toContain('"');
  });
});
