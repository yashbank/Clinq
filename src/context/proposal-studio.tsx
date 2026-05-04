"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ProposalModeId = "premium" | "concise" | "technical";
export type ProposalToneId = "professional" | "friendly" | "confident" | "consultative";

type Ctx = {
  mode: ProposalModeId;
  setMode: (m: ProposalModeId) => void;
  tone: ProposalToneId;
  setTone: (t: ProposalToneId) => void;
  mapModeToApi: () => "short" | "long";
  /** Shared RFP / job text for AI proposal generation across the studio. */
  rfpText: string;
  setRfpText: (s: string) => void;
};

const ProposalStudioContext = createContext<Ctx | null>(null);

export function ProposalStudioProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ProposalModeId>("premium");
  const [tone, setTone] = useState<ProposalToneId>("professional");
  const [rfpText, setRfpText] = useState("");

  const mapModeToApi = useCallback(() => {
    return mode === "concise" ? "short" : "long";
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode, tone, setTone, mapModeToApi, rfpText, setRfpText }),
    [mode, tone, mapModeToApi, rfpText],
  );

  return <ProposalStudioContext.Provider value={value}>{children}</ProposalStudioContext.Provider>;
}

export function useProposalStudio(): Ctx {
  const ctx = useContext(ProposalStudioContext);
  if (!ctx) {
    throw new Error("useProposalStudio must be used within ProposalStudioProvider");
  }
  return ctx;
}
