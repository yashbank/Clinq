/**
 * Reusable structural guidance for proposals (not client text — shapes thinking).
 */
export function proposalFrameworkBlock(mode: "short" | "long"): string {
  if (mode === "short") {
    return [
      "Framework (short):",
      "1) Opening line: outcome they want + your role in achieving it (no flattery preamble).",
      "2) 2–3 tight bullets: method, relevant experience from supplied profile only, delivery cadence.",
      "3) Scope boundary: what is in / out for a first milestone.",
      "4) Single CTA: one concrete next step with what you need from them to proceed.",
    ].join("\n");
  }
  return [
    "Framework (long):",
    "1) Opening: reflect their goal, constraints, and vocabulary from the RFP.",
    "2) Diagnosis: 2–3 sentences on what is unclear—then how you would reduce ambiguity in week one.",
    "3) Approach: phased plan with checkpoints; name technical/design risks you will surface early.",
    "4) Proof: only outcomes, stacks, and domains explicitly supported by the profile block—no invented logos.",
    "5) Collaboration: reviews, async vs sync, tooling; set expectations on availability.",
    "6) Commercials: if budget anchors exist in context, respect them; otherwise ask for budget and success-metric guardrails.",
    "7) CTA: one decisive next step; optionally a lighter alternative (e.g. 20-min scoping vs full proposal revision).",
  ].join("\n");
}

export const antiGenericRules = [
  "Avoid empty hype: world-class, synergy, rockstar, ninja, passionate about everything.",
  "Avoid template openers: 'I hope this message finds you well', 'I came across your posting'.",
  "Avoid multiple exclamation marks and vague superlatives.",
  "Prefer concrete verbs and nouns from the RFP and the freelancer profile.",
].join("\n");
