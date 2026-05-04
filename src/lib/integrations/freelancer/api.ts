import "server-only";

import { getFreelancerIntegrationEnv } from "@/lib/integrations/freelancer/env";

const REQUEST_TIMEOUT_MS = 25_000;

export type FreelancerSearchProjectsResult = {
  projects: unknown[];
  /** Raw result.projects slice for debugging (same as projects when present). */
  raw: unknown;
};

/**
 * GET /api/projects/0.1/projects/active/ — documented Freelancer REST surface.
 * @see https://github.com/freelancer/freelancer-sdk-python (search_projects / projects/active)
 */
export async function fetchFreelancerActiveProjects(args: {
  accessToken: string;
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<{ ok: true; data: FreelancerSearchProjectsResult } | { ok: false; error: string; status?: number }> {
  const cfg = getFreelancerIntegrationEnv();
  const base = cfg?.apiBaseUrl ?? "https://www.freelancer.com";
  const limit = Math.min(50, Math.max(1, args.limit ?? 15));
  const offset = Math.max(0, args.offset ?? 0);
  const q = (args.query ?? "").trim();

  const url = new URL("/api/projects/0.1/projects/active/", base);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  if (q) {
    url.searchParams.set("query", q);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Freelancer-OAuth-V1": args.accessToken,
        Accept: "application/json",
        "User-Agent": "Clinq/1.0 (https://github.com) Freelancer API",
      },
      signal: controller.signal,
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, error: `Freelancer API returned non-JSON (${res.status})`, status: res.status };
    }
    if (!res.ok) {
      const msg =
        json && typeof json === "object" && "message" in json && typeof (json as { message: unknown }).message === "string"
          ? (json as { message: string }).message
          : `Freelancer API error (${res.status})`;
      return { ok: false, error: msg, status: res.status };
    }
    const body = json as Record<string, unknown>;
    const result = body.result;
    const projectsUnknown: unknown[] = [];
    if (Array.isArray(result)) {
      projectsUnknown.push(...result);
    } else if (result && typeof result === "object" && "projects" in result) {
      const p = (result as { projects?: unknown }).projects;
      if (Array.isArray(p)) {
        projectsUnknown.push(...p);
      }
    }
    return { ok: true, data: { projects: projectsUnknown, raw: result } };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Freelancer API request timed out" : (e instanceof Error ? e.message : "Request failed");
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
