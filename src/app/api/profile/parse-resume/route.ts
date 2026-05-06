import { NextResponse } from "next/server";

import { mergeResumeExtractionIntoProfileUpdate } from "@/lib/profile/merge-resume-into-profile";
import { runProfileIntelligencePipeline } from "@/lib/profile/intelligence/engine";
import { loadFreelancerProfileForAi } from "@/lib/profile/load-for-ai";
import { parseResumeAdvanced } from "@/lib/profile/parse-resume-advanced";
import { extractTextFromPdfBuffer } from "@/lib/parsing/pdf-resume";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ct = req.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
    }
    const isPdf = /\.pdf$/i.test(file.name);
    const isDocx = /\.docx$/i.test(file.name);
    if (!isPdf && !isDocx) {
      return NextResponse.json({ error: "Only PDF or .docx files are accepted" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let text: string;
    let pages: number | null = null;
    if (isPdf) {
      try {
        const extracted = await extractTextFromPdfBuffer(buf);
        text = extracted.text;
        pages = extracted.pages ?? null;
      } catch (e) {
        const message = e instanceof Error ? e.message : "PDF parse failed";
        return NextResponse.json({ error: message }, { status: 422 });
      }
    } else {
      try {
        const mammoth = await import("mammoth");
        const doc = await mammoth.extractRawText({ buffer: buf });
        text = doc.value;
        if (Array.isArray(doc.messages) && doc.messages.some((m) => m.type === "error") && !String(text).trim()) {
          return NextResponse.json({ error: "DOCX parse produced no readable text" }, { status: 422 });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "DOCX parse failed";
        return NextResponse.json({ error: message }, { status: 422 });
      }
    }

    const clipped = text.slice(0, 48_000);
    const extraction = parseResumeAdvanced(clipped);

    const { error: logErr } = await supabase.from("profile_extractions").insert({
      user_id: user.id,
      source_type: "resume_pdf",
      source_summary: file.name.slice(0, 500),
      extracted: {
        pages: pages ?? null,
        charCount: clipped.length,
        skills_found: extraction.skills.length,
        tech_found: extraction.tech_stack.length,
      },
    });
    if (logErr) {
      console.warn("profile_extractions insert:", logErr.message);
    }

    const profile = await loadFreelancerProfileForAi(supabase, user.id);
    const mergedPatch = profile ? mergeResumeExtractionIntoProfileUpdate(profile, extraction) : null;
    const baseUpdate: Record<string, unknown> = {
      resume_text: clipped,
      resume_filename: file.name.slice(0, 255),
    };
    const updatePayload = { ...baseUpdate, ...(mergedPatch ?? {}) };
    const mergeKeys = mergedPatch ? Object.keys(mergedPatch) : [];

    const { error: upErr } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
    if (upErr) {
      console.warn("profile resume merge update:", upErr.message);
    } else {
      try {
        await runProfileIntelligencePipeline(supabase, user.id, { useOpenAi: false });
      } catch (e) {
        console.warn("profile intelligence after resume:", e instanceof Error ? e.message : e);
      }
    }

    return NextResponse.json({
      text: clipped,
      pages: pages ?? null,
      extraction,
      profile_merge_applied: !upErr && mergeKeys.length > 0,
      profile_merge_fields: mergeKeys,
      resume_saved: !upErr,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
