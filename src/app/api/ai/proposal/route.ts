import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildProposalSystemPrompt, type ProposalTone } from "@/lib/ai/proposal-prompts";
import { evaluateProposalWithOpenAi } from "@/lib/ai/evaluators/proposal-quality";
import { buildFreelancerProfileContext } from "@/lib/profile/build-proposal-context";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/services/ai/openai.server";

const MAX_TEXT = 48_000;

const bodySchema = z.object({
  jobDescription: z.string().min(10).max(MAX_TEXT),
  mode: z.enum(["short", "long"]),
  tone: z.enum(["professional", "friendly", "confident", "consultative"]),
  leadId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
});

function statusFromAiError(e: unknown): number {
  if (e instanceof OpenAI.APIError) {
    if (e.status === 429) return 429;
    if (e.status && e.status >= 500) return 503;
    if (e.status === 401 || e.status === 403) return 502;
  }
  if (e instanceof Error && /OPENAI_API_KEY|OpenAI environment/i.test(e.message)) {
    return 503;
  }
  return 500;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { jobDescription, mode, tone, leadId, title } = parsed.data;

    const profileRow = await loadFreelancerProfileForAi(supabase, user.id);
    const profileBlock = buildFreelancerProfileContext(profileRow);

    let leadContext = "";
    if (leadId) {
      const { data: lead } = await supabase
        .from("leads")
        .select("client_name, company, platform, project_description, budget, score, metadata, proposal_match_notes, client_history")
        .eq("id", leadId)
        .eq("user_id", user.id)
        .single();
      if (lead) {
        const meta = (lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {}) as Record<
          string,
          unknown
        >;
        const strat =
          typeof meta.proposal_strategy_hint === "string" ? meta.proposal_strategy_hint.trim() : "";
        const portfolio =
          typeof meta.portfolio_angle_suggestion === "string" ? meta.portfolio_angle_suggestion.trim() : "";
        const riskBits: string[] = [];
        if (typeof meta.scam_risk_label === "string") {
          if (typeof meta.scam_risk_score === "number") {
            riskBits.push(`Scam risk: ${meta.scam_risk_label} (${meta.scam_risk_score}/100)`);
          } else {
            riskBits.push(`Scam risk: ${meta.scam_risk_label}`);
          }
        }
        if (typeof meta.seriousness_score === "number") {
          riskBits.push(`Seriousness: ${meta.seriousness_score}/100`);
        }
        const scam = riskBits.length ? `${riskBits.join(". ")}.` : "";
        leadContext = [
          `Client: ${lead.client_name}${lead.company ? ` (${lead.company})` : ""}`,
          `Platform: ${lead.platform ?? "n/a"}`,
          `Budget: ${lead.budget ?? "unknown"}`,
          `Lead score: ${lead.score}`,
          scam || null,
          strat ? `Strategy hint: ${strat}` : null,
          portfolio ? `Portfolio angle: ${portfolio}` : null,
          lead.client_history ? `Stakeholder / history notes: ${lead.client_history}` : null,
          lead.proposal_match_notes ? `Your match notes: ${lead.proposal_match_notes}` : null,
          `Project brief:\n${lead.project_description ?? ""}`,
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    const toneBoost =
      profileRow?.profile_intelligence?.version === 1
        ? `\n\nVoice / positioning guidance (from stored profile intelligence):\n${profileRow.profile_intelligence.proposalToneHint}\n${profileRow.profile_intelligence.positioningLine}`
        : "";

    const userContent = [
      profileBlock ? `${profileBlock}\n` : "",
      leadContext ? `--- Opportunity ---\n${leadContext}\n` : "",
      `--- Job / RFP (primary) ---\n${jobDescription}`,
      toneBoost,
    ]
      .filter((s) => s.trim().length > 0)
      .join("\n");

    let openai: ReturnType<typeof getOpenAIClient>;
    try {
      openai = getOpenAIClient();
    } catch {
      return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
    }

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.65,
        messages: [
          { role: "system", content: buildProposalSystemPrompt(mode, tone as ProposalTone) },
          {
            role: "user",
            content: `Write the proposal for this opportunity. Personalize using the freelancer profile and opportunity sections when present; never invent employers, degrees, or metrics not implied there.\n\n${userContent}`,
          },
        ],
      });
    } catch (e) {
      const status = statusFromAiError(e);
      const message = e instanceof Error ? e.message : "AI request failed";
      return NextResponse.json({ error: "Proposal generation failed", detail: message }, { status });
    }

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Empty completion" }, { status: 502 });
    }

    const { data: saved, error: saveErr } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        lead_id: leadId ?? null,
        title: title?.trim() || `Proposal — ${new Date().toLocaleDateString()}`,
        body: text,
        mode,
        tone,
        model: "gpt-4o-mini",
      })
      .select("id")
      .single();

    if (saveErr) {
      return NextResponse.json({ text, warning: saveErr.message, saved: false });
    }

    let evaluationPayload: Awaited<ReturnType<typeof evaluateProposalWithOpenAi>> = null;
    if (saved?.id) {
      evaluationPayload = await evaluateProposalWithOpenAi(openai, {
        proposalBody: text,
        jobDescription,
        profileSummary: profileBlock || "(no profile block)",
        leadSummary: leadContext || "(no lead context)",
        mode,
        tone: tone as ProposalTone,
      });
      if (evaluationPayload) {
        const { error: evErr } = await supabase
          .from("proposals")
          .update({ evaluation: evaluationPayload as unknown as Record<string, unknown> })
          .eq("id", saved.id)
          .eq("user_id", user.id);
        if (evErr) {
          console.warn("proposal evaluation persist:", evErr.message);
        }
      }
    }

    void supabase.from("analytics").insert({
      user_id: user.id,
      metric: "proposal_generated",
      value: 1,
      dimensions: { mode, tone, leadId: leadId ?? null },
    });

    return NextResponse.json({
      text,
      proposalId: saved?.id,
      saved: true,
      evaluation: evaluationPayload ?? undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: "Unexpected error", detail: message }, { status: 500 });
  }
}
