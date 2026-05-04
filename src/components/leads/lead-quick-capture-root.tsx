"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const LeadCaptureContext = createContext<{ openCapture: () => void } | null>(null);

export function useLeadCapture() {
  const ctx = useContext(LeadCaptureContext);
  if (!ctx) {
    throw new Error("useLeadCapture must be used within LeadCaptureProvider");
  }
  return ctx;
}

export function LeadCaptureProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);

  const openCapture = useCallback(() => setOpen(true), []);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    void sb.auth.getSession().then(({ data }) => setAuthed(Boolean(data.session)));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      if (e.key.toLowerCase() !== "l") return;
      e.preventDefault();
      if (authed) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed]);

  const hideFab =
    pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/");
  const showFab = authed && !hideFab;

  return (
    <LeadCaptureContext.Provider value={{ openCapture }}>
      {children}
      {showFab ? (
        <button
          type="button"
          aria-label="Quick add lead"
          title="Quick add lead (⌘⇧L)"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-24 right-6 z-[45] flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] md:bottom-24",
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
        </button>
      ) : null}
      <AddLeadDialog open={open} onOpenChange={setOpen} onCreated={() => router.refresh()} />
    </LeadCaptureContext.Provider>
  );
}
