"use client";

import { MessageCircle, Send } from "lucide-react";

/**
 * Honest workflow placeholders — not lead sources. No DB “connected” state.
 */
export function WorkflowMessagingCards() {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/25 p-5">
      <h2 className="text-base font-semibold text-foreground">Messaging workflows</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        WhatsApp and Telegram are staged for reminders, follow-up alerts, and approved outbound later. They are not broad scraping
        sources.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-emerald-500/12 bg-background/50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <MessageCircle className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">WhatsApp</h3>
                <span className="shrink-0 rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Planned
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Future setup will support reminders, follow-up alerts, and carefully scoped outbound when Meta / BSP policies
                allow. No inbox scraping and no simulated connection today.
              </p>
              <p className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-2 text-[11px] text-muted-foreground">
                Configuration placeholder: WhatsApp Business API credentials will live server-side only, similar to other secrets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-sky-500/12 bg-background/50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
              <Send className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Telegram</h3>
                <span className="shrink-0 rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Planned
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Bot or channel wiring will power alerts and reminders first; optional approved channel ingestion can follow when
                product policy is explicit. No Telegram scraping today.
              </p>
              <p className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-2 text-[11px] text-muted-foreground">
                Configuration placeholder: bot token / channel IDs will be stored with the same server-only pattern as GitHub PATs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
