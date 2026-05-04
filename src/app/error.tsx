"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="gradient-mesh flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Try again. If the problem continues, return to the overview or refresh the page.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard">Overview</Link>
        </Button>
      </div>
    </div>
  );
}
