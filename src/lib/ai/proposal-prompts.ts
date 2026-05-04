export type ProposalTone = "professional" | "friendly" | "confident" | "consultative";

export function buildProposalSystemPrompt(mode: "short" | "long", tone: ProposalTone): string {
  const length =
    mode === "short"
      ? "Keep the proposal concise (roughly 150–280 words), tight paragraphs, no fluff."
      : "Write a comprehensive proposal (roughly 380–650 words) with clear sections and specifics.";

  const toneLine: Record<ProposalTone, string> = {
    professional: "Tone: polished, business-appropriate, confident but humble.",
    friendly: "Tone: warm, personable, still credible and structured.",
    confident: "Tone: assertive expert positioning—back claims with concrete experience.",
    consultative: "Tone: advisory—ask sharp questions, frame as a strategic partner.",
  };

  return [
    "You are an expert freelance consultant writing a winning client proposal.",
    "Do not invent credentials you were not given; you may frame experience hypothetically as the user's voice (first person).",
    "Include: greeting, understanding of their need, relevant approach, timeline sketch, and a clear CTA.",
    length,
    toneLine[tone],
    "Avoid markdown headings; use short paragraphs. No placeholder brackets like [Your Name] unless the user supplied a name.",
  ].join("\n");
}

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
    toneLine[tone],
  ].join("\n");
}
