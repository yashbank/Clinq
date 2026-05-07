import { fetchGitHubSearchIssues } from "@/lib/leads/sources/github-public";

describe("fetchGitHubSearchIssues", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("retries on HTTP 422 and succeeds with usedFallback meta", async () => {
    const okBody = JSON.stringify({
      items: [
        {
          id: 1,
          title: "T",
          html_url: "https://github.com/o/r/issues/1",
          body: "hello",
          user: { login: "u" },
        },
      ],
    });
    let n = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      const i = n++;
      if (i === 0) {
        return Promise.resolve({
          ok: false,
          status: 422,
          text: () => Promise.resolve('{"message":"validation failed"}'),
        });
      }
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(okBody) });
    });

    const r = await fetchGitHubSearchIssues({ query: "react dashboard", limit: 10, token: "fake-token" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.meta.usedFallback).toBe(true);
      expect(r.items).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }
  });

  it("on single-variant 422 returns a concise hint without claiming fallbacks ran", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve("{}"),
    });
    const r = await fetchGitHubSearchIssues({ query: "", limit: 5, token: null });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.userHint.toLowerCase()).not.toContain("still could not");
      expect(r.userHint).toMatch(/shorten|keywords|syntax/i);
    }
  });
});
