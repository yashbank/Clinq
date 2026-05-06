import "server-only";

import { getFreelancerApiBaseUrl } from "@/lib/integrations/freelancer/env";
import { logFreelancerImport, logFreelancerTokenValidation } from "@/lib/logging/app-log";

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
  const base = getFreelancerApiBaseUrl();
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
    logFreelancerImport("api_fetch_ok", {
      query: q || null,
      limit,
      offset,
      rowsFetched: projectsUnknown.length,
      requestPath: url.pathname + url.search,
    });
    return { ok: true, data: { projects: projectsUnknown, raw: result } };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError" ? "Freelancer API request timed out" : (e instanceof Error ? e.message : "Request failed");
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

const SELF_VALIDATE_TIMEOUT_MS = 15_000;

/**
 * Validates a Freelancer Personal Access Token (same `Freelancer-OAuth-V1` header as OAuth access tokens).
 * GET https://www.freelancer.com/api/users/0.1/self/
 */
export async function validateFreelancerPersonalAccessToken(
  accessToken: string,
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const trimmed = accessToken.trim();
  if (!trimmed) {
    logFreelancerTokenValidation("pat_empty", {}, "warn");
    return { ok: false, error: "Token is required" };
  }

  const base = getFreelancerApiBaseUrl();
  const url = `${base}/api/users/0.1/self/`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SELF_VALIDATE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Freelancer-OAuth-V1": trimmed,
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
      logFreelancerTokenValidation("pat_non_json", { status: res.status }, "error");
      return { ok: false, error: `Freelancer API returned non-JSON (${res.status})`, status: res.status };
    }

    const body = json as Record<string, unknown>;
    const apiStatus = body.status;
    if (typeof apiStatus === "string" && apiStatus.toLowerCase() === "error") {
      const msg =
        typeof body.message === "string" && body.message.trim()
          ? body.message
          : "Freelancer rejected this token";
      logFreelancerTokenValidation("pat_api_error_body", { status: res.status, message: msg }, "warn");
      return { ok: false, error: msg, status: res.status };
    }

    if (!res.ok) {
      const msg =
        typeof body.message === "string" && body.message.trim()
          ? body.message
          : `Freelancer API error (${res.status})`;
      logFreelancerTokenValidation("pat_http_error", { status: res.status, message: msg }, "warn");
      return { ok: false, error: msg, status: res.status };
    }

    logFreelancerTokenValidation("pat_ok", {});
    return { ok: true };
  } catch (e) {
    const msg =
      e instanceof Error && e.name === "AbortError" ? "Validation request timed out" : e instanceof Error ? e.message : "Request failed";
    logFreelancerTokenValidation("pat_exception", { message: msg }, "error");
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
