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
};

const ProposalStudioContext = createContext<Ctx | null>(null);

export function ProposalStudioProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ProposalModeId>("premium");
  const [tone, setTone] = useState<ProposalToneId>("professional");

  const mapModeToApi = useCallback(() => {
    return mode === "concise" ? "short" : "long";
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode, tone, setTone, mapModeToApi }),
    [mode, tone, mapModeToApi],
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
