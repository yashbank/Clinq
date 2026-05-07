import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * When `lead_import_ext_ids_existing` RPC is unavailable, resolve which external ids
 * already exist on `leads` via indexed equality filters (bounded N queries per import).
 */
export async function loadLeadImportExternalIdsExistingFallback(
  supabase: SupabaseClient,
  userId: string,
  extIds: string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  const unique = [...new Set(extIds.map((x) => x.trim()).filter(Boolean))].slice(0, 120);
  for (const id of unique) {
    const { data, error } = await supabase
      .from("leads")
      .select("id")
      .eq("user_id", userId)
      .eq("metadata->>import_external_id", id)
      .is("deleted_at", null)
      .is("archived_at", null)
      .maybeSingle();
    if (error) {
      console.warn(
        JSON.stringify({
          scope: "lead_import_ext_ids.fallback_row",
          hadError: true,
          message: error.message.slice(0, 200),
        }),
      );
      continue;
    }
    if (data?.id) out.add(id);
  }
  return out;
}
