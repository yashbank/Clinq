"use client";

import { X, Mail, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientDetailPanelProps {
  clientId: string;
  onClose: () => void;
}

export function ClientDetailPanel({ clientId, onClose }: ClientDetailPanelProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-clinq-glass-border bg-sidebar/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-clinq-glass-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Lead</p>
          <h2 className="text-lg font-semibold text-foreground">Client #{clientId}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm text-muted-foreground">
        <p>
          Full client memory (chats, proposals, outcomes) connects to Supabase in the MVP
          backend—this panel is the chrome for that data.
        </p>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">Estimated value</span>
          </div>
          <p className="text-xs">$12k–$18k · confidence medium</p>
        </div>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium">Next action</span>
          </div>
          <p className="text-xs">Send milestone proposal draft in 24h.</p>
        </div>
        <div className="grid gap-2 rounded-xl border border-clinq-glass-border bg-clinq-glass/30 p-3">
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-medium">Contact</span>
          </div>
          <p className="text-xs">You control what is stored—paste threads manually or import from allowed sources.</p>
        </div>
      </div>
      <div className="border-t border-clinq-glass-border p-4">
        <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
          Open proposal studio
        </Button>
      </div>
    </div>
  );
}
