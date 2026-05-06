"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { dismissScrapedLeadAction } from "@/actions/scraped-leads";
import { Button } from "@/components/ui/button";

export function ScrapedDismissButton({ scrapedId, disabled }: { scrapedId: string; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending || disabled}
      className="h-8 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => {
        start(() => {
          void (async () => {
            const res = await dismissScrapedLeadAction(scrapedId);
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            toast.message("Dismissed");
            router.refresh();
          })();
        });
      }}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Dismiss
    </Button>
  );
}
