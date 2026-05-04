import { NextResponse } from "next/server";
import { z } from "zod";

import { buildFollowUpSystemPrompt, type ProposalTone } from "@/lib/ai/proposal-prompts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/services/ai/openai.server";

const bodySchema = z.object({
  context: z.string().min(10),
  tone: z.enum(["professional", "friendly", "confident", "consultative"]),
  leadId: z.string().uuid().optional(),
});

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

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
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

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Empty completion" }, { status: 502 });
    }

    await supabase.from("analytics").insert({
      user_id: user.id,
      metric: "follow_up_generated",
      value: 1,
      dimensions: { tone, leadId: leadId ?? null },
    });

    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
