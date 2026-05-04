import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordLeadImportBatchMetrics(
  supabase: SupabaseClient,
  userId: string,
  dims: {
    provider: string;
    imported: number;
    duplicates: number;
    failed: number;
    api_error?: string | null;
  },
): Promise<void> {
  const base = {
    user_id: userId,
    recorded_at: new Date().toISOString(),
  };
  const rows: { user_id: string; recorded_at: string; metric: string; value: number; dimensions: Record<string, unknown> }[] = [
    { ...base, metric: "lead_import_imported", value: dims.imported, dimensions: { provider: dims.provider } },
    { ...base, metric: "lead_import_duplicates", value: dims.duplicates, dimensions: { provider: dims.provider } },
    { ...base, metric: "lead_import_failed", value: dims.failed, dimensions: { provider: dims.provider } },
  ];
  if (dims.api_error) {
    rows.push({
      ...base,
      metric: "lead_import_api_error",
      value: 1,
      dimensions: { provider: dims.provider, message: dims.api_error.slice(0, 500) },
    });
  }
  const { error } = await supabase.from("analytics").insert(rows);
  if (error) {
    console.warn("recordLeadImportBatchMetrics:", error.message);
  }
}
