import "server-only";

import { fetchGitHubPublicProfile } from "@/lib/parsing/github-public";
import { fetchPublicUrlMetadata } from "@/lib/parsing/url-metadata";
import { linkedInPublicPlaceholder } from "@/lib/parsing/linkedin-placeholder";

export type PortfolioParseResult =
  | { kind: "url"; data: Awaited<ReturnType<typeof fetchPublicUrlMetadata>> }
  | { kind: "github"; data: Awaited<ReturnType<typeof fetchGitHubPublicProfile>> }
  | { kind: "linkedin"; data: ReturnType<typeof linkedInPublicPlaceholder> };

function isGitHubProfileUrl(url: URL): string | null {
  if (url.hostname.replace(/^www\./, "") !== "github.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  return parts[0] ?? null;
}

function isLinkedInUrl(url: URL): boolean {
  return url.hostname.replace(/^www\./, "").endsWith("linkedin.com");
}

export async function parsePortfolioUrl(raw: string): Promise<PortfolioParseResult> {
  const u = new URL(raw.trim());
  const gh = isGitHubProfileUrl(u);
  if (gh) {
    const data = await fetchGitHubPublicProfile(gh);
    return { kind: "github", data };
  }
  if (isLinkedInUrl(u)) {
    return { kind: "linkedin", data: linkedInPublicPlaceholder() };
  }
  const data = await fetchPublicUrlMetadata(u.toString());
  return { kind: "url", data };
}
