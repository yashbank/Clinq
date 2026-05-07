import type { PublicIngestResult } from "@/actions/public-source-ingest";
import { publicIngestResultLines, publicIngestToastDescription } from "@/lib/integrations/public-ingest-result-copy";

function sample(): PublicIngestResult {
  return {
    ok: true,
    source: "github",
    fetched_count: 10,
    scraped_staged_count: 2,
    duplicate_count: 7,
    skipped_invalid_count: 0,
    promoted_count: 1,
    skipped_irrelevant_count: 0,
    skipped_persist_failed_count: 0,
    errors: [],
  };
}

describe("publicIngestResultLines", () => {
  it("includes all counter dimensions", () => {
    const lines = publicIngestResultLines(sample());
    expect(lines.join(" ")).toMatch(/Fetched 10/);
    expect(lines.join(" ")).toMatch(/Promoted to Leads: 1/);
    expect(lines.join(" ")).toMatch(/duplicate.: 7/i);
  });
});

describe("publicIngestToastDescription", () => {
  it("truncates error tails without inventing counts", () => {
    const res = {
      ...sample(),
      errors: ["first error message is quite long ".repeat(8), "second"],
    };
    const d = publicIngestToastDescription(res);
    expect(d).toContain("Notes:");
    expect(d.length).toBeLessThan(1200);
  });
});
