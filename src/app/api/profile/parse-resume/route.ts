import { NextResponse } from "next/server";

import { mergeResumeExtractionIntoProfile } from "@/lib/profile/merge-resume-into-profile";
import { runProfileIntelligencePipeline } from "@/lib/profile/intelligence/engine";
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

    let profileEnriched: string[] = [];
    const { data: profRow } = await supabase
      .from("profiles")
      .select("bio, skills, tech_stack, niches, portfolio_links, linkedin_url, github_url, website_url, resume_text, resume_filename")
      .eq("id", user.id)
      .maybeSingle();

    if (profRow && typeof profRow === "object") {
      const current = {
        bio: typeof profRow.bio === "string" ? profRow.bio : null,
        skills: Array.isArray(profRow.skills) ? (profRow.skills as string[]) : [],
        tech_stack: Array.isArray(profRow.tech_stack) ? (profRow.tech_stack as string[]) : [],
        niches: Array.isArray(profRow.niches) ? (profRow.niches as string[]) : [],
        portfolio_links: Array.isArray(profRow.portfolio_links) ? (profRow.portfolio_links as string[]) : [],
        linkedin_url: typeof profRow.linkedin_url === "string" ? profRow.linkedin_url : null,
        github_url: typeof profRow.github_url === "string" ? profRow.github_url : null,
        website_url: typeof profRow.website_url === "string" ? profRow.website_url : null,
      };
      const { patch: mergePatch, enrichedLabels } = mergeResumeExtractionIntoProfile(current, extraction);
      const patch: Record<string, unknown> = { ...mergePatch };
      profileEnriched = [...enrichedLabels];
      const existingResume = typeof profRow.resume_text === "string" ? profRow.resume_text.trim() : "";
      if (existingResume.length < 120 && clipped.trim().length >= 120) {
        patch.resume_text = clipped;
        patch.resume_filename = file.name.slice(0, 255);
        profileEnriched.push("resume text");
      }
      if (Object.keys(patch).length > 0) {
        const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", user.id);
        if (upErr) {
          console.warn("profile resume merge:", upErr.message);
        } else {
          try {
            await runProfileIntelligencePipeline(supabase, user.id, { useOpenAi: false });
          } catch (e) {
            console.warn("profile intelligence after resume merge:", e instanceof Error ? e.message : e);
          }
        }
      }
    }

    const { error: logErr } = await supabase.from("profile_extractions").insert({
      user_id: user.id,
      source_type: "resume_pdf",
      source_summary: file.name.slice(0, 500),
      extracted: {
        pages: pages ?? null,
        charCount: clipped.length,
        skills_found: extraction.skills.length,
        tech_found: extraction.tech_stack.length,
        profile_fields_enriched: profileEnriched,
      },
    });
    if (logErr) {
      console.warn("profile_extractions insert:", logErr.message);
    }

    return NextResponse.json({
      text: clipped,
      pages: pages ?? null,
      extraction,
      profileEnriched,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
