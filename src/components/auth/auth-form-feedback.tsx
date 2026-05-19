"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Reserved height so error text does not shift the form layout. */
export function AuthFormAlert({ message }: { message: string | null }) {
  return (
    <div
      className={cn(
        "min-h-[2.75rem] rounded-lg border px-3 py-2.5 text-sm leading-snug transition-colors duration-200",
        message
          ? "border-destructive/25 bg-destructive/8 text-foreground"
          : "border-transparent bg-transparent text-transparent",
      )}
      aria-live="polite"
      role={message ? "alert" : undefined}
    >
      {message ?? "\u00a0"}
    </div>
  );
}

type AuthSubmitButtonProps = {
  pending: boolean;
  pendingLabel: string;
  idleLabel: string;
  className?: string;
};

export function AuthSubmitButton({ pending, pendingLabel, idleLabel, className }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-cyan-500 text-sm font-medium text-primary-foreground shadow-md shadow-cyan-500/10 transition-[transform,opacity] duration-200 hover:opacity-[0.97] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
