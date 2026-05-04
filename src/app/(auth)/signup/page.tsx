"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background gradient-mesh px-4">
      <div className="glass-card w-full max-w-md rounded-2xl border border-clinq-glass-border p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
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
              const origin = typeof window !== "undefined" ? window.location.origin : "";
              const { error: signErr } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name: displayName || email.split("@")[0] },
                  emailRedirectTo: `${origin}/auth/callback`,
                },
              });
              if (signErr) {
                setError(signErr.message);
                return;
              }
              router.push("/dashboard");
              router.refresh();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              type="text"
              autoComplete="name"
              className="bg-background/50"
              placeholder="Alex Morgan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="bg-background/50"
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
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
