import type { LeadIntelligence } from "@/lib/ai/lead-intelligence";

export type LeadWorkflowSignals = {
  scam_risk_score: number;
  scam_risk_label: "low" | "medium" | "high";
  seriousness_score: number;
  portfolio_angle_suggestion: string;
};

export type ProfileSnapshotForLead = {
  tech_stack: string[];
  niches: string[];
  skills: string[];
};

/**
 * Deterministic signals from lead text + intelligence flags + optional profile overlap.
 * Not a black-box model call — safe for production and explainable in UI.
 */
export function deriveLeadWorkflowSignals(
  intel: LeadIntelligence,
  input: {
    projectDescription: string | null;
    budget: number | null;
    company: string | null;
    repeatHire: boolean;
  },
  profile: ProfileSnapshotForLead | null,
): LeadWorkflowSignals {
  const desc = (input.projectDescription ?? "").toLowerCase();
  const riskFlags = intel.flags.filter((f) => f.startsWith("risk:"));
  let scam = Math.min(100, riskFlags.length * 28 + (intel.flags.some((f) => /off-platform|suspicious payment/i.test(f)) ? 35 : 0));
  if (/\b(telegram|whatsapp only|gift card|western union|crypto only)\b/i.test(desc)) {
    scam = Math.min(100, scam + 22);
  }
  if (scam < 12 && riskFlags.length === 0) scam = 10 + (intel.tier === "time-waster" ? 25 : 0);

  const scam_risk_label: LeadWorkflowSignals["scam_risk_label"] =
    scam >= 58 ? "high" : scam >= 32 ? "medium" : "low";

  let seriousness = 22;
  if ((input.budget ?? 0) > 0) seriousness += 18;
  if ((input.budget ?? 0) >= 2500) seriousness += 12;
  if ((input.company ?? "").trim().length > 2) seriousness += 14;
  if (input.repeatHire) seriousness += 10;
  if (desc.length > 200) seriousness += 16;
  else if (desc.length > 80) seriousness += 8;
  if (intel.tier === "high-value") seriousness += 14;
  if (intel.tier === "time-waster") seriousness = Math.max(0, seriousness - 28);
  seriousness = Math.min(100, Math.round(seriousness));

  const stack = profile?.tech_stack ?? [];
  const skills = profile?.skills ?? [];
  const descTokens = new Set(
    desc
      .split(/[^a-z0-9+#.]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length > 2),
  );
  const overlap = [...stack, ...skills].filter((t) => descTokens.has(t.toLowerCase()));
  const nicheHint = (profile?.niches ?? []).find((n) => desc.includes(n.toLowerCase()));

  let portfolio_angle_suggestion =
    overlap.length > 0
      ? `Lead with work that showcases ${overlap.slice(0, 4).join(", ")}—call out 1–2 concrete outcomes tied to those keywords in the brief.`
      : stack.length > 0
        ? `Anchor proof to your strongest stack (${stack.slice(0, 5).join(", ")}) and ask one sharp scoping question before over-committing.`
        : "Highlight 2–3 measurable outcomes from similar engagements; keep scope and milestones explicit.";

  if (nicheHint) {
    portfolio_angle_suggestion += ` Position explicitly for ${nicheHint} work.`;
  }
  if (scam_risk_label === "high") {
    portfolio_angle_suggestion =
      "Prioritize verification: confirm identity, payment channel, and scope in writing before deep custom work. Keep portfolio references generic until trust is established.";
  }

  return {
    scam_risk_score: Math.round(scam),
    scam_risk_label,
    seriousness_score: seriousness,
    portfolio_angle_suggestion,
  };
}
