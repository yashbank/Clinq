import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import { getOpenAIClient } from "@/services/ai/openai.server";
import type { FreelancerProfileFields } from "@/types/profile";

import type { ProfileIntelligenceV1 } from "@/types/profile-intelligence";

const schema = z.object({
  strengths: z.array(z.string()).max(8),
  inferredNiches: z.array(z.string()).max(12),
  proposalToneHint: z.string().max(600),
  idealProjectSummary: z.string().max(600),
  positioningLine: z.string().max(400),
  missingSkillHints: z.array(z.string()).max(6).optional(),
  proposalPositioningNotes: z.array(z.string()).max(5).optional(),
  idealClientNotes: z.array(z.string()).max(4).optional(),
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
  return out.data;
}
