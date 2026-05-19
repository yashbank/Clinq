"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AuthFormAlert, AuthSubmitButton } from "@/components/auth/auth-form-feedback";
import { ClinqLogo } from "@/components/brand/clinq-logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCredentialError, formatSupabaseConfigError } from "@/lib/errors/format-user-error";
import { cn } from "@/lib/utils";
import { getPublicSiteOrigin } from "@/utils/site-url";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center bg-background gradient-mesh px-4 py-10 sm:py-12">
      <div className="auth-card w-full">
        <div className="relative mb-8 text-center">
          <ClinqLogo width={52} height={52} priority className="mx-auto mb-4 h-[52px] w-[52px]" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your Clinq account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Leads, proposals, and pipeline in one workspace.</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") ?? "")
              .trim()
              .toLowerCase();
            const password = String(fd.get("password") ?? "");
            const displayName = String(fd.get("display_name") ?? "").trim();
            setError(null);
            startTransition(async () => {
              if (!email || password.length < 8) {
                setError("Use a valid email and a password of at least 8 characters.");
                return;
              }
              let supabase;
              try {
                supabase = createSupabaseBrowserClient();
              } catch (err) {
                const msg = err instanceof Error ? err.message : null;
                setError(formatSupabaseConfigError(msg));
                return;
              }
              const site = getPublicSiteOrigin(typeof window !== "undefined" ? window.location.origin : "");
              const { data, error: signErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name: displayName || email.split("@")[0] },
                  emailRedirectTo: `${site}/auth/callback`,
                },
              });
              if (signErr) {
                setError(formatCredentialError("Sign up", signErr.message));
                return;
              }
              if (data.session) {
                router.push("/dashboard");
                router.refresh();
              } else {
                setError(null);
                router.push("/login?confirmed=1");
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="display_name" className="text-foreground/90">
              Display name
            </Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              disabled={pending}
              placeholder="Alex Morgan"
            />
          </div>
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
            <Label htmlFor="password" className="text-foreground/90">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <AuthFormAlert message={error} />

          {pending ? (
            <p className="text-center text-xs text-muted-foreground" aria-live="polite">
              Creating your account…
            </p>
          ) : null}

          <AuthSubmitButton pending={pending} pendingLabel="Creating…" idleLabel="Sign up" />
        </form>

        <p className={cn("mt-6 text-center text-sm text-muted-foreground", pending && "opacity-70")}>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          If your project requires email confirmation, check your inbox before signing in.
        </p>
      </div>
    </div>
  );
}
