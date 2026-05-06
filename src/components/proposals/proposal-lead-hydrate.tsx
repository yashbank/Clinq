"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useProposalStudio } from "@/context/proposal-studio";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Loads lead brief into proposal RFP when opening `/proposals?leadId=…`. */
export function ProposalLeadHydrate() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const { setRfpText } = useProposalStudio();

  useEffect(() => {
    if (!leadId) return;
    const sb = createSupabaseBrowserClient();
    let cancelled = false;
    void sb
      .from("leads")
      .select("project_description, budget, metadata")
      .eq("id", leadId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const meta = (data.metadata && typeof data.metadata === "object" ? data.metadata : {}) as Record<string, unknown>;
        const title = typeof meta.project_title === "string" ? meta.project_title.trim() : "";
        const url = typeof meta.project_url === "string" ? meta.project_url.trim() : "";
        const budget = data.budget != null && Number(data.budget) > 0 ? String(data.budget) : "";
        const parts = [
          title ? `Title: ${title}` : "",
          data.project_description ? `Description:\n${String(data.project_description).trim()}` : "",
          budget ? `Budget: ${budget}` : "",
          url ? `Listing URL: ${url}` : "",
        ].filter(Boolean);
        if (parts.length) setRfpText(parts.join("\n\n"));
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, setRfpText]);

  return null;
}
