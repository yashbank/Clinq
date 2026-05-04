"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const prioritySchema = z.enum(["low", "normal", "high"]);
const statusSchema = z.enum(["open", "snoozed", "done"]);

export type FollowUpReminderMeta = {
  status: z.infer<typeof statusSchema>;
  priority: z.infer<typeof prioritySchema>;
  remind_at: string | null;
  note?: string;
};

const ACTIVITY_TYPE = "follow_up_reminder";

export async function createFollowUpReminderAction(input: {
  title: string;
  note?: string;
  lead_id?: string | null;
  priority?: z.infer<typeof prioritySchema>;
  remind_at?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const title = input.title?.trim() ?? "";
  if (title.length < 2) {
    return { ok: false, error: "Title is too short" };
  }
  const priority = prioritySchema.safeParse(input.priority ?? "normal");
  if (!priority.success) {
    return { ok: false, error: "Invalid priority" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const meta: FollowUpReminderMeta = {
    status: "open",
    priority: priority.data,
    remind_at: input.remind_at?.trim() || null,
    note: input.note?.trim() || undefined,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      lead_id: input.lead_id?.trim() || null,
      type: ACTIVITY_TYPE,
      description: title.slice(0, 500),
      metadata: meta as unknown as Record<string, unknown>,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }

  revalidatePath("/follow-ups");
  return { ok: true, id: data.id as string };
}

export async function updateFollowUpReminderAction(
  id: string,
  patch: { status?: z.infer<typeof statusSchema>; remind_at?: string | null; priority?: z.infer<typeof prioritySchema> },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const { data: row, error: fetchErr } = await supabase
    .from("activities")
    .select("id, metadata, type")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !row || row.type !== ACTIVITY_TYPE) {
    return { ok: false, error: fetchErr?.message ?? "Not found" };
  }

  const prev =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  const nextMeta: Record<string, unknown> = { ...prev };
  if (patch.status !== undefined) {
    const s = statusSchema.safeParse(patch.status);
    if (!s.success) return { ok: false, error: "Invalid status" };
    nextMeta.status = s.data;
  }
  if (patch.remind_at !== undefined) {
    nextMeta.remind_at = patch.remind_at;
  }
  if (patch.priority !== undefined) {
    const p = prioritySchema.safeParse(patch.priority);
    if (!p.success) return { ok: false, error: "Invalid priority" };
    nextMeta.priority = p.data;
  }

  const { error } = await supabase
    .from("activities")
    .update({ metadata: nextMeta })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath("/follow-ups");
  return { ok: true };
}
