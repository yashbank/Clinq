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
  improvements: z.array(z.string()).max(6).optional(),
  whyItWorks: z.array(z.string()).max(5).optional(),
  weakPoints: z.array(z.string()).max(5).optional(),
  trustSignalsIncluded: z.array(z.string()).max(6).optional(),
  strengthSummary: z.string().max(700).optional(),
  scoringConfidenceNote: z.string().max(400).optional(),
});

export type ProposalEvaluationRecord = z.infer<typeof evaluationSchema> & {
  model: string;
  evaluatedAt: string;
  tone: ProposalTone;
  mode: "short" | "long";
};

const SYS = `You evaluate freelance proposals for a serious freelancer OS. Return JSON ONLY with this shape:
{
  "personalization": 0-100 integer (uses profile + RFP overlap, not fluff),
  "clarity": 0-100 integer (structure, skimmability, plain language),
  "trust": 0-100 integer (credible claims, no invented facts, appropriate hedging),
  "ctaStrength": 0-100 integer (one decisive next step, realistic ask),
  "relevance": 0-100 integer (addresses stated problem and constraints),
  "overall": 0-100 integer (holistic, conservative if data thin),
  "notes": string[] max 8 short bullets (mixed feedback),
  "improvements": string[] max 6 optional actionable edits,
  "whyItWorks": string[] max 5 optional concise positives grounded in text,
  "weakPoints": string[] max 5 optional risks or gaps,
  "trustSignalsIncluded": string[] max 6 optional signals actually present (e.g. milestones, questions, proof),
  "strengthSummary": optional string max 700 chars — one paragraph synthesis,
  "scoringConfidenceNote": optional string max 400 chars — when scores are uncertain (thin RFP, missing profile), say so plainly.
}
Penalize generic hype, invented metrics, multiple CTAs, and template openers. Never claim you verified external facts.`;

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
      temperature: 0.15,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYS },
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
