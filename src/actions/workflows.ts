"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkflowTypeId } from "@/types/workflows";

const typeSchema = z.enum(["follow_up_reminder", "proposal_reminder", "lead_priority"]);

function normalizeConfig(type: WorkflowTypeId, raw: unknown): Record<string, unknown> {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  if (type === "follow_up_reminder") {
    const days = Math.min(60, Math.max(1, Math.round(Number(o.days_after) || 3)));
    const note = typeof o.note === "string" ? o.note.slice(0, 500) : "";
    return { days_after: days, ...(note.trim() ? { note: note.trim() } : {}) };
  }
  if (type === "proposal_reminder") {
    const days = Math.min(60, Math.max(1, Math.round(Number(o.days_after) || 2)));
    return { days_after: days };
  }
  const min = Math.min(100, Math.max(0, Math.round(Number(o.min_score) ?? 70)));
  return { min_score: min };
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  workflow_type: typeSchema,
  config: z.record(z.unknown()),
});

export async function createWorkflowAction(
  raw: z.infer<typeof createSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const config = normalizeConfig(parsed.data.workflow_type, parsed.data.config);
  const { data, error } = await supabase
    .from("automation_workflows")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      workflow_type: parsed.data.workflow_type,
      enabled: true,
      config,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }
  revalidatePath("/automations");
  return { ok: true, id: data.id };
}

export async function updateWorkflowAction(
  id: string,
  patch: { name?: string; enabled?: boolean; config?: Record<string, unknown> },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { data: row, error: fetchErr } = await supabase
    .from("automation_workflows")
    .select("workflow_type, config")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (fetchErr || !row) {
    return { ok: false, error: fetchErr?.message ?? "Not found" };
  }

  const next: Record<string, unknown> = {};
  if (patch.name !== undefined) next.name = patch.name.trim().slice(0, 120);
  if (patch.enabled !== undefined) next.enabled = patch.enabled;
  if (patch.config !== undefined) {
    next.config = normalizeConfig(row.workflow_type as WorkflowTypeId, patch.config);
  }

  const { error } = await supabase.from("automation_workflows").update(next).eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/automations");
  return { ok: true };
}

export async function deleteWorkflowAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { error } = await supabase.from("automation_workflows").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/automations");
  return { ok: true };
}
