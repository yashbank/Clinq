/**
 * Reusable structural guidance for proposals (not client text — shapes thinking).
 */
export function proposalFrameworkBlock(mode: "short" | "long"): string {
  if (mode === "short") {
    return [
      "Framework (short):",
      "1) One-line positioning tied to their stated problem.",
      "2) 2–3 bullets: approach, relevant stack/domain, delivery rhythm.",
      "3) Timeline + what you need from them to start.",
      "4) Single CTA: propose a concrete next step (call, milestone, or scoped reply).",
    ].join("\n");
  }
  return [
    "Framework (long):",
    "1) Opening: mirror their outcome + constraints in their vocabulary.",
    "2) Approach: phases/milestones with checkpoints; name risks you will de-risk early.",
    "3) Proof: tie to resume/portfolio facts provided—no invented logos or metrics.",
    "4) Collaboration: how you communicate, review cadence, and tooling.",
    "5) Commercials: keep ranges only if user supplied anchors; otherwise ask for budget guardrails.",
    "6) CTA: one decisive next step with a time-bound option.",
  ].join("\n");
}

export const antiGenericRules = [
  "Avoid empty hype: world-class, synergy, rockstar, ninja, passionate about everything.",
  "Avoid template openers: 'I hope this message finds you well', 'I came across your posting'.",
  "Avoid multiple exclamation marks and vague superlatives.",
  "Prefer concrete verbs and nouns from the RFP and the freelancer profile.",
].join("\n");
