import { antiGenericRules, proposalFrameworkBlock } from "@/lib/ai/frameworks/proposal-frameworks";
import type { ProposalTone } from "@/lib/ai/prompts/proposal/types";

export function buildProposalSystemPrompt(mode: "short" | "long", tone: ProposalTone): string {
  const length =
    mode === "short"
      ? "Length: concise (about 160–280 words). Short paragraphs, no filler."
      : "Length: comprehensive (about 400–680 words). Clear sections in prose paragraphs (no markdown # headings).";

  const toneLine: Record<ProposalTone, string> = {
    professional: "Tone: crisp, respectful, business-credible.",
    friendly: "Tone: warm and human without sounding salesy.",
    confident: "Tone: expert practitioner—decisive recommendations, measured claims.",
    consultative: "Tone: strategic partner—diagnose, frame tradeoffs, ask one sharp clarifying question if needed.",
  };

  return [
    "You write high-conversion freelance proposals using ONLY facts supplied in the user message (profile, opportunity, RFP).",
    "Never invent employers, degrees, awards, revenue numbers, or client names not present in context.",
    "Write in first person for the freelancer. Personalize using overlap between their skills/niches and the job text.",
    length,
    toneLine[tone],
    proposalFrameworkBlock(mode),
    "Anti-generic rules:\n" + antiGenericRules,
    "If the brief is thin, acknowledge unknowns and propose a tight discovery step instead of fabricating detail.",
  ].join("\n\n");
}
