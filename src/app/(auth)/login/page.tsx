"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background gradient-mesh px-4">
      <div className="glass-card w-full max-w-md rounded-2xl border border-clinq-glass-border p-8 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your Clinq workspace</p>
        </div>

        {searchParams.get("error") ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Authentication failed. Try again.
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
            const next = String(fd.get("next") ?? "/dashboard").trim() || "/dashboard";
            setError(null);
            startTransition(async () => {
              const supabase = createSupabaseBrowserClient();
              const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
              if (signErr) {
                setError(signErr.message);
                return;
              }
              router.push(next.startsWith("/") ? next : "/dashboard");
              router.refresh();
            });
          }}
        >
          <input type="hidden" name="next" value={searchParams.get("next") ?? "/dashboard"} />
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
              autoComplete="current-password"
              required
              className="bg-background/50"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
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
          <Link href="/" className="text-muted-foreground hover:text-foreground">
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
