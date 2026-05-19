"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { AuthFormAlert, AuthSubmitButton } from "@/components/auth/auth-form-feedback";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCredentialError, formatSupabaseConfigError } from "@/lib/errors/format-user-error";
import { getPublicSiteOrigin } from "@/utils/site-url";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center bg-background gradient-mesh px-4 py-10 sm:py-12">
      <div className="auth-card w-full">
        <div className="mb-8 text-center">
          <ClinqLogo width={52} height={52} priority className="mx-auto mb-4 h-[52px] w-[52px]" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reset password</h1>
          <p className="mt-2 text-sm text-muted-foreground">We will email a secure link to set a new password.</p>
        </div>

        {sent ? (
          <div className="space-y-4 rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
            <p>If an account exists for that address, a reset link is on the way.</p>
            <p className="text-muted-foreground">Check spam, then return to sign in.</p>
            <Button variant="outline" className="w-full border-border" asChild>
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get("email") ?? "")
                .trim()
                .toLowerCase();
              if (!email) {
                setError("Enter your email.");
                return;
              }
              setError(null);
              startTransition(async () => {
                let supabase;
                try {
                  supabase = createSupabaseBrowserClient();
                } catch (err) {
                  const msg = err instanceof Error ? err.message : null;
                  setError(formatSupabaseConfigError(msg));
                  return;
                }
                const site = getPublicSiteOrigin(typeof window !== "undefined" ? window.location.origin : "");
                const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${site}/auth/callback?next=/dashboard`,
                });
                if (resetErr) {
                  setError(formatCredentialError("Password reset", resetErr.message));
                  return;
                }
                setSent(true);
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/90">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={pending}
                placeholder="you@company.com"
              />
            </div>
            <AuthFormAlert message={error} />

            {pending ? (
              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                Sending your reset link…
              </p>
            ) : null}

            <AuthSubmitButton pending={pending} pendingLabel="Sending…" idleLabel="Send reset link" />
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
