"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";

import { AuthFormAlert, AuthSubmitButton } from "@/components/auth/auth-form-feedback";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCredentialError, formatSupabaseConfigError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "otp_expired") {
    return "This sign-in link expired or was already used. Use your password, or request a fresh link from your email provider.";
  }
  if (code === "auth") {
    return "Sign-in could not be completed. Try email and password again.";
  }
  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const urlError = useMemo(() => authErrorMessage(searchParams.get("error")), [searchParams]);
  const displayError = urlError ?? error;

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center bg-background gradient-mesh px-4 py-10 sm:py-12">
      <div className="auth-card w-full">
        <div className="relative mb-8 text-center">
          <ClinqLogo width={52} height={52} priority className="mx-auto mb-4 h-[52px] w-[52px]" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
        </div>

        {searchParams.get("confirmed") ? (
          <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            Confirm your email from the inbox link, then sign in here.
          </p>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") ?? "")
              .trim()
              .toLowerCase();
            const password = String(fd.get("password") ?? "");
            const next = safeNextPath(String(fd.get("next") ?? "/dashboard"));
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
              const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
              if (signErr) {
                setError(formatCredentialError("Sign in", signErr.message));
                return;
              }
              router.push(next);
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="next" value={safeNextPath(searchParams.get("next"))} />
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
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-foreground/90">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className={cn(
                  "text-xs font-medium text-primary/90 transition-colors hover:text-primary hover:underline",
                  pending && "pointer-events-none opacity-50",
                )}
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>

          <AuthFormAlert message={displayError} />

          {pending ? (
            <p className="text-center text-xs text-muted-foreground" aria-live="polite">
              Verifying your credentials…
            </p>
          ) : null}

          <AuthSubmitButton pending={pending} pendingLabel="Signing in…" idleLabel="Continue" />
        </form>

        <p className={cn("mt-6 text-center text-sm text-muted-foreground", pending && "opacity-70")}>
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            ← Clinq home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background gradient-mesh px-4">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-muted/50" />
          <p className="text-sm text-muted-foreground">Loading sign in…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
