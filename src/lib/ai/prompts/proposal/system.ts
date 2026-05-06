import { antiGenericRules, proposalFrameworkBlock } from "@/lib/ai/frameworks/proposal-frameworks";
import type { ProposalTone } from "@/lib/ai/prompts/proposal/types";
import { proposalScenarioGuidance, type ProposalScenarioTag } from "@/lib/ai/proposal-scenario";

export function buildProposalSystemPrompt(
  mode: "short" | "long",
  tone: ProposalTone,
  scenarioTags: ProposalScenarioTag[] = [],
): string {
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
    "You write elite freelance proposals using ONLY facts supplied in the user message (profile, opportunity, RFP).",
    "Never invent employers, degrees, awards, revenue numbers, client names, or past project brands not present in context.",
    "Write in first person. Prefer concrete verbs, short sentences, and evidence-led claims over adjectives.",
    "Personalize by weaving overlap between the freelancer's stated skills, niches, and phrases from the RFP—without keyword stuffing.",
    "Mirror project type cues from the RFP only when explicit (e.g. fixed-price vs hourly, deliverable list, stack names). Do not assume a platform workflow unless the brief names it.",
    "Banned openers / filler: do not use “I am excited”, “thrilled”, “cutting-edge”, “leverage”, “world-class”, or “robust solution” unless the client used those exact words.",
    length,
    toneLine[tone],
    proposalFrameworkBlock(mode),
    proposalScenarioGuidance(scenarioTags),
    "CTA rules: end with exactly one primary ask (call, milestone, or scoped written reply). Offer a secondary option only if it reduces friction (e.g. async Loom vs live call).",
    "Anti-generic rules:\n" + antiGenericRules,
    "If the brief is thin, acknowledge unknowns and propose a tight discovery step instead of fabricating detail.",
  ].join("\n\n");
}
