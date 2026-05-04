import type { ProposalTone } from "@/lib/ai/prompts/proposal/types";

export function buildFollowUpSystemPrompt(tone: ProposalTone): string {
  const toneLine: Record<ProposalTone, string> = {
    professional: "Tone: concise, respectful follow-up.",
    friendly: "Tone: warm check-in without pressure.",
    confident: "Tone: brief, value-forward nudge.",
    consultative: "Tone: helpful, question-led follow-up.",
  };
  return [
    "Write a short follow-up message (80–160 words) after submitting a proposal.",
    "Reference the prior proposal without repeating it verbatim.",
    "Do not invent outcomes or client replies.",
    toneLine[tone],
  ].join("\n");
}
