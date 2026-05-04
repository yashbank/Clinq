import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { buildFollowUpSystemPrompt, type ProposalTone } from "@/lib/ai/proposal-prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/services/ai/openai.server";

const MAX_TEXT = 48_000;

const bodySchema = z.object({
  context: z.string().min(10).max(MAX_TEXT),
  tone: z.enum(["professional", "friendly", "confident", "consultative"]),
  leadId: z.string().uuid().optional(),
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

    const { context, tone, leadId } = parsed.data;

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
        temperature: 0.55,
        messages: [
          { role: "system", content: buildFollowUpSystemPrompt(tone as ProposalTone) },
          {
            role: "user",
            content: `Context:\n${context}${leadId ? `\n(Lead ID for reference: ${leadId})` : ""}`,
          },
        ],
      });
    } catch (e) {
      const status = statusFromAiError(e);
      const message = e instanceof Error ? e.message : "AI request failed";
      return NextResponse.json({ error: "Follow-up generation failed", detail: message }, { status });
    }

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Empty completion" }, { status: 502 });
    }

    void supabase.from("analytics").insert({
      user_id: user.id,
      metric: "follow_up_generated",
      value: 1,
      dimensions: { tone, leadId: leadId ?? null },
    });

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: "Unexpected error", detail: message }, { status: 500 });
  }
}
