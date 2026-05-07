import {
  clampFreelancerImportLimit,
  FREELANCER_IMPORT_MAX,
  publicIngestCapForSource,
} from "@/lib/integrations/source-batch-caps";
import { buildGitHubOpportunitySearchQuery } from "@/lib/leads/sources/github-public";
import { isMissingRelevanceScoreColumnError } from "@/lib/scraped-leads/relevance-column";

describe("scraped_leads relevance migration hints", () => {
  it("detects missing relevance_score column errors", () => {
    expect(isMissingRelevanceScoreColumnError('column "relevance_score" does not exist')).toBe(true);
    expect(isMissingRelevanceScoreColumnError("Could not find the relevance_score column")).toBe(true);
    expect(isMissingRelevanceScoreColumnError("permission denied")).toBe(false);
  });
});

describe("Freelancer batch caps", () => {
  it("clamps import limits", () => {
    expect(clampFreelancerImportLimit(undefined)).toBeGreaterThanOrEqual(1);
    expect(clampFreelancerImportLimit(999)).toBe(FREELANCER_IMPORT_MAX);
    expect(clampFreelancerImportLimit(0)).toBe(1);
  });
});

describe("public ingest per-source caps", () => {
  it("disables Reddit without OAuth env", () => {
    const c = publicIngestCapForSource("reddit", { redditOAuthConfigured: false, githubHasElevatedToken: false });
    expect(c.disabled).toBe(true);
    expect(c.maxPerRun).toBe(0);
  });

  it("enables Reddit with OAuth env flag", () => {
    const c = publicIngestCapForSource("reddit", { redditOAuthConfigured: true, githubHasElevatedToken: false });
    expect(c.disabled).toBe(false);
    expect(c.maxPerRun).toBeGreaterThan(0);
  });

  it("raises GitHub cap when a token is present", () => {
    const low = publicIngestCapForSource("github", { redditOAuthConfigured: false, githubHasElevatedToken: false });
    const high = publicIngestCapForSource("github", { redditOAuthConfigured: false, githubHasElevatedToken: true });
    expect(high.maxPerRun).toBeGreaterThan(low.maxPerRun);
  });
});

describe("GitHub opportunity query shaping", () => {
  it("adds hiring signals and issue constraints", () => {
    const q = buildGitHubOpportunitySearchQuery("react dashboard");
    expect(q).toContain("react dashboard");
    expect(q).toContain("is:issue");
    expect(q).toContain("freelance");
  });
});
