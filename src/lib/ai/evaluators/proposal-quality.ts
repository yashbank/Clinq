import "server-only";

import OpenAI from "openai";
import { z } from "zod";

import type { ProposalTone } from "@/lib/ai/prompts/proposal/types";

const evaluationSchema = z.object({
  personalization: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  trust: z.number().min(0).max(100),
  ctaStrength: z.number().min(0).max(100),
  relevance: z.number().min(0).max(100),
  overall: z.number().min(0).max(100),
  notes: z.array(z.string()).max(8),
});

export type ProposalEvaluationRecord = z.infer<typeof evaluationSchema> & {
  model: string;
  evaluatedAt: string;
  tone: ProposalTone;
  mode: "short" | "long";
};

export async function evaluateProposalWithOpenAi(
  client: OpenAI,
  args: {
    proposalBody: string;
    jobDescription: string;
    profileSummary: string;
    leadSummary: string;
    mode: "short" | "long";
    tone: ProposalTone;
  },
): Promise<ProposalEvaluationRecord | null> {
  const sys =
    "You score freelance proposals for quality. Return JSON only with keys: personalization, clarity, trust, ctaStrength, relevance (0-100 integers), overall (0-100), notes (string array, max 8 short items). Judge against the job and profile text—penalize generic hype and invented facts.";

  const user = [
    `Tone: ${args.tone}. Mode: ${args.mode}.`,
    "--- Profile summary ---",
    args.profileSummary.slice(0, 6_000),
    "--- Lead / opportunity ---",
    args.leadSummary.slice(0, 6_000),
    "--- Job / RFP ---",
    args.jobDescription.slice(0, 12_000),
    "--- Proposal ---",
    args.proposalBody.slice(0, 24_000),
  ].join("\n");

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
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
  const out = evaluationSchema.safeParse(parsed);
  if (!out.success) return null;

  return {
    ...out.data,
    model: "gpt-4o-mini",
    evaluatedAt: new Date().toISOString(),
    tone: args.tone,
    mode: args.mode,
  };
}
