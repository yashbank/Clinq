import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildProposalSystemPrompt, type ProposalTone } from "@/lib/ai/proposal-prompts";
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

    let leadContext = "";
    if (leadId) {
      const { data: lead } = await supabase
        .from("leads")
        .select("client_name, company, platform, project_description, budget, score")
        .eq("id", leadId)
        .eq("user_id", user.id)
        .single();
      if (lead) {
        leadContext = `\nClient: ${lead.client_name}${lead.company ? ` (${lead.company})` : ""}\nPlatform: ${lead.platform ?? "n/a"}\nBudget: ${lead.budget ?? "unknown"}\nScore: ${lead.score}\nBrief: ${lead.project_description ?? ""}\n`;
      }
    }

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
            content: `Write the proposal for this opportunity.\n${leadContext}\nJob / RFP text:\n${jobDescription}`,
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

    void supabase.from("analytics").insert({
      user_id: user.id,
      metric: "proposal_generated",
      value: 1,
      dimensions: { mode, tone, leadId: leadId ?? null },
    });

    return NextResponse.json({ text, proposalId: saved?.id, saved: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: "Unexpected error", detail: message }, { status: 500 });
  }
}
