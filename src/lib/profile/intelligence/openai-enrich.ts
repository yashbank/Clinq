import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { getOpenAIClient } from "@/services/ai/openai.server";
import type { FreelancerProfileFields } from "@/types/profile";

import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

const stringList = (maxItems: number, itemMax: number) =>
  z.preprocess(
    (v) => {
      if (!Array.isArray(v)) return [];
      return v
        .map((x) => (x === null || x === undefined ? "" : String(x)))
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.slice(0, itemMax));
    },
    z.array(z.string()).max(maxItems),
  );

const nonEmptyString = (max: number, fallback: string) =>
  z.preprocess(
    (v) => {
      if (v === null || v === undefined) return fallback;
      const s = String(v).trim().slice(0, max);
      return s.length ? s : fallback;
    },
    z.string().max(max),
  );

const schema = z.object({
  strengths: stringList(8, 400),
  inferredNiches: stringList(12, 80),
  proposalToneHint: nonEmptyString(600, "professional: structured, specific, one strong CTA."),
  idealProjectSummary: nonEmptyString(600, "Projects where scope, budget, and stakeholders are documented early."),
  positioningLine: nonEmptyString(400, "Freelancer positioning."),
  missingSkillHints: stringList(6, 400).optional(),
  proposalPositioningNotes: stringList(5, 400).optional(),
  idealClientNotes: stringList(4, 400).optional(),
});

/**
 * Optional OpenAI pass to sharpen language on top of deterministic heuristics.
 * Fails closed: returns null if AI is unavailable or response is invalid.
 */
export async function enrichProfileIntelligenceWithOpenAi(
  base: ProfileIntelligenceV1,
  profile: FreelancerProfileFields,
): Promise<
  | Partial<
      Pick<
        ProfileIntelligenceV1,
        | "strengths"
        | "inferredNiches"
        | "proposalToneHint"
        | "idealProjectSummary"
        | "positioningLine"
        | "missingSkillHints"
        | "proposalPositioningNotes"
        | "idealClientNotes"
      >
    >
  | null
> {
  let client: ReturnType<typeof getOpenAIClient>;
  try {
    client = getOpenAIClient();
  } catch {
    return null;
  }

  const resumeSnippet = (profile.resume_text ?? "").slice(0, 8_000);
  const userBlock = [
    `Display name: ${profile.display_name ?? ""}`,
    `Bio: ${profile.bio ?? ""}`,
    `Skills: ${(profile.skills ?? []).join(", ")}`,
    `Tech: ${(profile.tech_stack ?? []).join(", ")}`,
    `Niches: ${(profile.niches ?? []).join(", ")}`,
    `Heuristic strengths: ${base.strengths.join(" | ")}`,
    `Heuristic niches: ${base.inferredNiches.join(", ")}`,
    `Resume excerpt:\n${resumeSnippet}`,
  ].join("\n");

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You refine freelancer positioning for a proposal-writing product. Output strict JSON only. Do not invent employers, degrees, or client names. Avoid generic advice like 'learn React'. Prefer concrete, user-grounded notes. If data is thin, say so conservatively.",
        },
        {
          role: "user",
          content: `Improve JSON fields: strengths (array), inferredNiches (array), proposalToneHint (string), idealProjectSummary (string), positioningLine (string). Optionally add missingSkillHints, proposalPositioningNotes, idealClientNotes (arrays of short strings) only when grounded in the user text.\n\n${userBlock}`,
        },
      ],
    });
  } catch {
    return null;
  }

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const out = schema.safeParse(parsed);
  if (!out.success) return null;
  const d = out.data;
  if (!d.strengths.length) {
    return { ...d, strengths: base.strengths.slice(0, 8) };
  }
  if (!d.inferredNiches.length) {
    return { ...d, inferredNiches: base.inferredNiches.slice(0, 12) };
  }
  return d;
}
