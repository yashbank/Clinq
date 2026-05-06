"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updatePreferredCurrencyAction } from "@/actions/profile";
import { formatActionFailure } from "@/lib/errors/format-user-error";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isSupportedDisplayCurrency, SUPPORTED_DISPLAY_CURRENCIES } from "@/types/currency";

export function CurrencyPreferences({ initial }: { initial: string }) {
  const router = useRouter();
  const safe = isSupportedDisplayCurrency(initial) ? initial : "USD";
  const [value, setValue] = useState<string>(safe);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
        <Label htmlFor="preferred_currency" className="text-sm font-medium text-foreground">
          Preferred currency
        </Label>
        <Select
          disabled={pending}
          value={value}
          onValueChange={(next) => {
            if (!isSupportedDisplayCurrency(next)) return;
            setValue(next);
            start(() => {
              void (async () => {
                const res = await updatePreferredCurrencyAction(next);
                if (!res.ok) {
                  toast.error(formatActionFailure("Saving currency", res.error));
                  setValue(safe);
                  return;
                }
                toast.success("Currency preference saved");
                router.refresh();
              })();
            });
          }}
        >
          <SelectTrigger id="preferred_currency" className="h-11 w-full max-w-md border-border bg-background text-base font-medium">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_DISPLAY_CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
    </div>
  );
}
