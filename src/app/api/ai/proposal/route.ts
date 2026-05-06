import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildProposalSystemPrompt, type ProposalTone } from "@/lib/ai/proposal-prompts";
import { inferProposalScenarios } from "@/lib/ai/proposal-scenario";
import { evaluateProposalWithOpenAi } from "@/lib/ai/evaluators/proposal-quality";
import { buildFreelancerProfileContext } from "@/lib/profile/build-proposal-context";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { assessProfileCompleteness } from "@/lib/profile/profile-completeness";
import { getUsdToForeignRates } from "@/lib/currency/exchange-rates";
import { computeLeadBudgetUiLine } from "@/lib/leads/lead-budget-ui";
import { canonicalProposalLeadLinesForApi } from "@/lib/leads/canonical-proposal-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/services/ai/openai.server";
import type { LeadRow } from "@/types/database";

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
    const completeness = assessProfileCompleteness(profileRow);
    if (!completeness.passesProposalAi) {
      return NextResponse.json(
        {
          error: completeness.missing[0] ?? "Add bio, skills, and tech stack before generating proposals with AI.",
          code: "PROFILE_INCOMPLETE",
          missing: completeness.missing,
        },
        { status: 403 },
      );
    }

    const profileBlock = buildFreelancerProfileContext(profileRow);

    let leadContext = "";
    let leadBudget: number | null = null;
    let leadRepeat = false;
    if (leadId) {
      const [{ data: lead }, { data: profRow }] = await Promise.all([
        supabase
          .from("leads")
          .select(
            "client_name, company, platform, short_description, project_description, budget, budget_usd, budget_avg, budget_min, budget_max, currency_original, score, repeat_hire, metadata, proposal_match_notes, client_history",
          )
          .eq("id", leadId)
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .is("archived_at", null)
          .single(),
        supabase.from("profiles").select("preferred_currency").eq("id", user.id).maybeSingle(),
      ]);
      if (lead) {
        const row = lead as LeadRow;
        leadBudget = lead.budget != null ? Number(lead.budget) : null;
        leadRepeat = Boolean(lead.repeat_hire);
        const preferredCurrency =
          typeof profRow?.preferred_currency === "string" && profRow.preferred_currency.trim()
            ? profRow.preferred_currency.trim()
            : "USD";
        let usdToForeignRates: Record<string, number> | null = null;
        try {
          usdToForeignRates = await getUsdToForeignRates();
        } catch {
          usdToForeignRates = null;
        }
        const budgetUi = computeLeadBudgetUiLine(row, preferredCurrency, usdToForeignRates);
        const lines = canonicalProposalLeadLinesForApi(row, budgetUi.show ? budgetUi.label : null, budgetUi.show);
        leadContext = [`Client: ${lead.client_name}${lead.company ? ` (${lead.company})` : ""}`, `Lead score: ${lead.score}`, ...lines].join(
          "\n",
        );
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

    const scenarioTags = inferProposalScenarios({
      jobDescription,
      leadBudget,
      leadRepeatHire: leadRepeat,
    });

    let openai: ReturnType<typeof getOpenAIClient>;
    try {
      openai = getOpenAIClient();
    } catch {
      return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
    }

    const temperature = mode === "long" ? 0.58 : 0.62;

    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature,
        messages: [
          { role: "system", content: buildProposalSystemPrompt(mode, tone as ProposalTone, scenarioTags) },
          {
            role: "user",
            content: `Write the proposal for this opportunity. Use profile + opportunity sections when present. Do not invent credentials, employers, or metrics. Prefer specificity over hype.\n\n${userContent}`,
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
      dimensions: { mode, tone },
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
