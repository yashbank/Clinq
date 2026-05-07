"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { loadProposalLeadRfpAction } from "@/actions/proposal-lead-brief";
import { useProposalStudio } from "@/context/proposal-studio";
import { formatWorkspaceLoadError } from "@/lib/errors/format-user-error";

/** Loads lead brief into proposal RFP when opening `/proposals?leadId=…`. */
export function ProposalLeadHydrate() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const { setRfpText } = useProposalStudio();
  const warnedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    void loadProposalLeadRfpAction(leadId).then((res) => {
      if (cancelled) return;
      if (!res.ok) {
        if (warnedRef.current !== leadId) {
          warnedRef.current = leadId;
          toast.message("Could not load this lead into the job panel", {
            description: formatWorkspaceLoadError("lead context for proposals", res.error),
            duration: 8000,
          });
        }
        return;
      }
      if (!res.text.trim()) return;
      setRfpText(res.text);
    });
    return () => {
      cancelled = true;
    };
  }, [leadId, setRfpText]);

  return null;
}
