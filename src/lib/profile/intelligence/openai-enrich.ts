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
});

/**
 * Optional OpenAI pass to sharpen language on top of deterministic heuristics.
 * Fails closed: returns null if AI is unavailable or response is invalid.
 */
export async function enrichProfileIntelligenceWithOpenAi(
  base: ProfileIntelligenceV1,
  profile: FreelancerProfileFields,
): Promise<Partial<Pick<ProfileIntelligenceV1, "strengths" | "inferredNiches" | "proposalToneHint" | "idealProjectSummary" | "positioningLine">> | null> {
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
            "You refine freelancer positioning text for a proposal-writing product. Output strict JSON only. Do not invent employers, degrees, or client names. Keep claims grounded in the user text. If data is thin, say so conservatively.",
        },
        {
          role: "user",
          content: `Improve these fields as JSON with keys: strengths (array of short strings), inferredNiches (array), proposalToneHint (one string), idealProjectSummary (one string), positioningLine (one string).\n\n${userBlock}`,
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
