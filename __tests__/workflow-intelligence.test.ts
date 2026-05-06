import { buildWorkflowSuggestions } from "@/lib/automation/workflow-intelligence";
import type { LeadRow } from "@/types/database";

function lead(p: Partial<LeadRow>): LeadRow {
  const t = "2026-06-01T12:00:00.000Z";
  return {
    id: p.id ?? "00000000-0000-4000-8000-000000000001",
    user_id: "u",
    client_name: "Client",
    platform: "upwork",
    project_description: "Build things",
    budget: 500,
    score: p.score ?? 76,
    stage: p.stage ?? "saved",
    email: null,
    phone: null,
    company: null,
    repeat_hire: false,
    competition_level: 2,
    project_quality: 3,
    client_history: null,
    proposal_match_notes: null,
    metadata: p.metadata ?? { project_title: "API integration" },
    created_at: t,
    updated_at: p.updated_at ?? t,
    ...p,
  };
}

describe("buildWorkflowSuggestions", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it("adds scraped queue suggestion when skipped high-relevance imports exist", () => {
    const out = buildWorkflowSuggestions({
      leads: [],
      proposals: [],
      activities: [],
      leadIdsWithProposal: new Set(),
      scrapedHighRelevanceSkipped: 3,
    });
    expect(out.some((s) => s.kind === "review_skipped_scrapes")).toBe(true);
  });

  it("suggests draft proposal for strong saved lead without proposal", () => {
    const lid = "00000000-0000-4000-8000-000000000099";
    const out = buildWorkflowSuggestions({
      leads: [
        lead({
          id: lid,
          stage: "saved",
          score: 88,
          interest_status: "interested",
          updated_at: "2026-06-15T11:00:00.000Z",
        }),
      ],
      proposals: [],
      activities: [],
      leadIdsWithProposal: new Set(),
    });
    const d = out.find((s) => s.kind === "draft_proposal" && s.leadId === lid);
    expect(d).toBeDefined();
    expect(d?.href).toContain("proposals");
  });
});
