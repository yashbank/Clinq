import { NextResponse } from "next/server";

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
    if (!/\.pdf$/i.test(file.name)) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const { text, pages } = await extractTextFromPdfBuffer(buf);
    const clipped = text.slice(0, 48_000);

    const { error: logErr } = await supabase.from("profile_extractions").insert({
      user_id: user.id,
      source_type: "resume_pdf",
      source_summary: file.name.slice(0, 500),
      extracted: {
        pages: pages ?? null,
        charCount: clipped.length,
      },
    });
    if (logErr) {
      // Table may not exist until migration — still return text.
      console.warn("profile_extractions insert:", logErr.message);
    }

    return NextResponse.json({ text: clipped, pages: pages ?? null });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
