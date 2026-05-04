import "server-only";

export type GitHubPublicProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  blog: string | null;
  publicRepos: number;
  followers: number;
  fetchedAt: string;
};

/**
 * Uses GitHub public REST API (no token). Rate limits apply; no private data.
 */
export async function fetchGitHubPublicProfile(username: string): Promise<GitHubPublicProfile> {
  const clean = username.trim().replace(/^@/, "").replace(/\/+$/, "");
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(clean)) {
    throw new Error("Invalid GitHub username");
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/users/${encodeURIComponent(clean)}`, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ClinqApp/1.0",
      },
    });
  } finally {
    clearTimeout(t);
  }

  if (res.status === 404) {
    throw new Error("GitHub user not found");
  }
  if (!res.ok) {
    throw new Error(`GitHub API HTTP ${res.status}`);
  }

  const j = (await res.json()) as Record<string, unknown>;
  return {
    login: String(j.login ?? clean),
    name: typeof j.name === "string" ? j.name : null,
    bio: typeof j.bio === "string" ? j.bio : null,
    company: typeof j.company === "string" ? j.company : null,
    blog: typeof j.blog === "string" ? j.blog : null,
    publicRepos: typeof j.public_repos === "number" ? j.public_repos : 0,
    followers: typeof j.followers === "number" ? j.followers : 0,
    fetchedAt: new Date().toISOString(),
  };
}
