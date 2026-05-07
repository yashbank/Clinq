import { normalizeFreelancerProject } from "@/lib/leads/ingest/freelancer-normalize";

describe("normalizeFreelancerProject currency", () => {
  it("maps budget.currency_id 11 to INR when top-level currency is missing", () => {
    const project = {
      id: 999001,
      title: "INR range listing",
      type: "fixed",
      budget: { minimum: 500_000, maximum: 1_000_000, currency_id: 11 },
      owner: { username: "buyer1" },
    };
    const n = normalizeFreelancerProject(project, "2026-05-06T12:00:00.000Z");
    expect(n).not.toBeNull();
    expect(n!.metadataExtra.import).toMatchObject({
      currency_code: "INR",
      budget_min: 500_000,
      budget_max: 1_000_000,
    });
    expect((n!.metadataExtra.import as Record<string, unknown>).raw_snapshot).toMatchObject({
      currency_id: 11,
      currency_code: "INR",
    });
    expect(n!.input.budget).toBeCloseTo(750_000, 1);
  });

  it("reads nested budget.currency.code when currency_id absent", () => {
    const project = {
      id: 999002,
      title: "Nested code",
      type: "fixed",
      budget: { minimum: 100, maximum: 200, currency: { code: "EUR", id: 8 } },
      owner: { username: "buyer2" },
    };
    const n = normalizeFreelancerProject(project, "2026-05-06T12:00:00.000Z");
    expect(n!.metadataExtra.import).toMatchObject({ currency_code: "EUR" });
  });

  it("maps budget.currency_id 3 to AUD", () => {
    const project = {
      id: 999003,
      title: "AUD job",
      type: "fixed",
      budget: { minimum: 1_000, maximum: 5_000, currency_id: 3 },
      owner: { username: "buyer3" },
    };
    const n = normalizeFreelancerProject(project, "2026-05-06T12:00:00.000Z");
    expect(n!.metadataExtra.import).toMatchObject({ currency_code: "AUD" });
  });
});
