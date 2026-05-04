"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ClinqLogo } from "@/components/brand/clinq-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
          <p className="mt-2 text-sm text-muted-foreground">AI operating system for serious freelancers</p>
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
                setError("Valid email and password (8+ chars) are required.");
                return;
              }
              const supabase = createSupabaseBrowserClient();
              const site =
                (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "").trim() ||
                (typeof window !== "undefined" ? window.location.origin : "");
              const { data, error: signErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name: displayName || email.split("@")[0] },
                  emailRedirectTo: `${site}/auth/callback`,
                },
              });
              if (signErr) {
                setError(signErr.message);
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
            <Input id="display_name" name="display_name" type="text" autoComplete="name" placeholder="Alex Morgan" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/90">
              Email
            </Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/90">
              Password
            </Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-primary to-cyan-500 font-medium text-primary-foreground shadow-md shadow-cyan-500/10 transition-[transform,opacity] duration-200 hover:opacity-[0.97] active:scale-[0.99]"
          >
            {pending ? "Creating…" : "Sign up"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          If email confirmation is enabled in Supabase, check your inbox before signing in.
        </p>
      </div>
    </div>
  );
}
