/**
 * Classifies opportunity text for proposal framing — deterministic, no LLM.
 */

export type ProposalScenarioTag =
  | "urgent_timeline"
  | "long_term_engagement"
  | "technical_depth"
  | "design_creative"
  | "high_budget"
  | "repeat_relationship";

export function inferProposalScenarios(args: {
  jobDescription: string;
  leadBudget: number | null;
  leadRepeatHire: boolean;
}): ProposalScenarioTag[] {
  const j = args.jobDescription.toLowerCase();
  const tags = new Set<ProposalScenarioTag>();

  if (/\b(asap|urgent|needed\s*today|eod|end of day|within\s*24|same\s*day)\b/i.test(j)) {
    tags.add("urgent_timeline");
  }
  if (/\b(retainer|ongoing|long[-\s]?term|monthly|quarterly|staff aug|embedded)\b/i.test(j)) {
    tags.add("long_term_engagement");
  }
  if (
    /\b(api|backend|frontend|database|kubernetes|docker|aws|gcp|azure|typescript|python|java|graphql|microservices|ci\/cd|security|infra)\b/i.test(
      j,
    )
  ) {
    tags.add("technical_depth");
  }
  if (/\b(ui|ux|figma|brand|visual design|creative|motion|illustration|design system)\b/i.test(j)) {
    tags.add("design_creative");
  }
  const b = Math.max(0, Number(args.leadBudget) || 0);
  if (b >= 7500 || /\b(\$|usd)\s*[1-9]\d{3,}\b/.test(j)) {
    tags.add("high_budget");
  }
  if (args.leadRepeatHire || /\b(returning|previous|again|phase\s*2|follow[-\s]?on)\b/i.test(j)) {
    tags.add("repeat_relationship");
  }

  return [...tags];
}

export function proposalScenarioGuidance(tags: ProposalScenarioTag[]): string {
  if (!tags.length) {
    return [
      "Scenario: general opportunity.",
      "Prioritize clarity over breadth: mirror their outcomes, propose a phased path, and end with one decisive CTA.",
    ].join("\n");
  }

  const blocks: string[] = [];
  for (const t of tags.slice(0, 4)) {
    switch (t) {
      case "urgent_timeline":
        blocks.push(
          "Urgent timeline: open with how you de-risk speed (parallel workstreams, explicit checkpoints). Offer a tight first milestone; avoid over-promising dates you cannot control.",
        );
        break;
      case "long_term_engagement":
        blocks.push(
          "Long-term / retainer tone: emphasize reliability, communication cadence, and how you onboard into their tools and rituals. Frame value as sustained throughput, not a one-off hero moment.",
        );
        break;
      case "technical_depth":
        blocks.push(
          "Technical depth: use precise stack terms from the RFP. Separate discovery, build, and hardening. Call out integration, testing, and observability where relevant.",
        );
        break;
      case "design_creative":
        blocks.push(
          "Design / creative: reference process (research, iteration, critique) and how feedback is incorporated. Tie visuals and UX decisions to measurable outcomes they care about.",
        );
        break;
      case "high_budget":
        blocks.push(
          "High-budget signal: justify investment with governance—milestones, risk controls, and stakeholder alignment. Keep commercials grounded in what they stated; ask for guardrails if unclear.",
        );
        break;
      case "repeat_relationship":
        blocks.push(
          "Repeat / continuation: acknowledge continuity, reference prior context only if supplied, and propose a low-friction next step that respects existing rapport.",
        );
        break;
      default:
        break;
    }
  }
  return ["Opportunity-specific framing (use only what fits the brief):", ...blocks].join("\n\n");
}
