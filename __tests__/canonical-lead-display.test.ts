import { canonicalLeadProjectTitle, canonicalLeadListingUrl } from "@/lib/leads/canonical-lead-display";
import type { LeadRow } from "@/types/database";

function row(p: Partial<LeadRow>): LeadRow {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-8000-000000000099",
    user_id: "u",
    client_name: "Client",
    platform: "Upwork",
    project_description: "Desc",
    budget: 100,
    score: 50,
    stage: "saved",
    email: null,
    phone: null,
    company: null,
    repeat_hire: false,
    competition_level: 2,
    project_quality: 3,
    client_history: null,
    proposal_match_notes: null,
    metadata: {},
    created_at: now,
    updated_at: now,
    ...p,
  };
}

describe("canonical-lead-display", () => {
  it("prefers metadata project_title for headline", () => {
    expect(
      canonicalLeadProjectTitle(
        row({ metadata: { project_title: "  Mobile app redesign  " }, client_name: "Hiring manager" }),
      ),
    ).toBe("Mobile app redesign");
  });

  it("canonicalLeadListingUrl accepts https only", () => {
    expect(
      canonicalLeadListingUrl(
        row({ metadata: { project_url: "https://example.com/job/1" } }),
      ),
    ).toMatch(/^https:\/\/example\.com/);
    expect(canonicalLeadListingUrl(row({ metadata: { project_url: "javascript:alert(1)" } }))).toBeNull();
  });
});
