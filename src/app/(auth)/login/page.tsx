"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  if (code === "otp_expired") {
    return "This link has expired or was already used. Sign in with your password, or request a new magic link from Supabase (Auth → email templates).";
  }
  if (code === "auth") {
    return "We could not complete sign-in. Try again, or use email and password.";
  }
  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const urlError = useMemo(() => authErrorMessage(searchParams.get("error")), [searchParams]);

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-background gradient-mesh px-4 py-12">
      <div className="auth-card">
        <div className="relative mb-8 text-center">
          <ClinqLogo width={52} height={52} priority className="mx-auto mb-4 h-[52px] w-[52px]" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Clinq workspace</p>
        </div>

        {urlError ? (
          <p className="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-sm leading-relaxed text-amber-100">
            {urlError}
          </p>
        ) : null}
        {searchParams.get("confirmed") ? (
          <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
            Check your email to confirm your account, then sign in.
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
              const supabase = createSupabaseBrowserClient();
              const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
              if (signErr) {
                setError(signErr.message);
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
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="password" className="text-foreground/90">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary/90 transition-colors hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-primary to-cyan-500 font-medium text-primary-foreground shadow-md shadow-cyan-500/10 transition-[transform,opacity] duration-200 hover:opacity-[0.97] active:scale-[0.99]"
          >
            {pending ? "Signing in…" : "Continue"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            ← Back to marketing site
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
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
