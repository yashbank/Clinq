"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { loadProposalLeadRfpAction } from "@/actions/proposal-lead-brief";
import { useProposalStudio } from "@/context/proposal-studio";

/** Loads lead brief into proposal RFP when opening `/proposals?leadId=…`. */
export function ProposalLeadHydrate() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const { setRfpText } = useProposalStudio();

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    void loadProposalLeadRfpAction(leadId).then((res) => {
      if (cancelled || !res.ok || !res.text.trim()) return;
      setRfpText(res.text);
    });
    return () => {
      cancelled = true;
    };
  }, [leadId, setRfpText]);

  return null;
}
