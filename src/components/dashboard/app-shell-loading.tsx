import { Skeleton } from "@/components/ui/skeleton";

export function AppShellLoading({
  variant = "table",
}: {
  variant?: "dashboard" | "table" | "form";
}) {
  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <aside className="hidden h-screen w-14 shrink-0 border-r border-border bg-sidebar md:block" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
          <Skeleton className="h-5 w-44 rounded-md" />
          <div className="hidden items-center gap-2 lg:flex">
            <Skeleton className="h-9 max-w-lg flex-1 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </header>
        <main className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {variant === "dashboard" ? (
            <>
              <Skeleton className="h-16 w-full max-w-2xl rounded-xl" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-52 rounded-2xl" />
                <Skeleton className="h-52 rounded-2xl" />
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </>
          ) : variant === "form" ? (
            <div className="mx-auto max-w-2xl space-y-6">
              <Skeleton className="h-8 w-56 rounded-lg" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-border/70 bg-card/30 p-5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border bg-card/40 p-4">
              <div className="flex gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-full max-w-md rounded-md" />
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 border-b border-border/60 py-3 last:border-0">
                    <Skeleton className="h-4 min-w-[40%] flex-1 rounded-md motion-safe:animate-pulse" />
                    <Skeleton className="h-6 w-20 rounded-full motion-safe:animate-pulse" />
                    <Skeleton className="h-4 w-24 rounded-md motion-safe:animate-pulse" />
                    <Skeleton className="h-9 w-28 rounded-md motion-safe:animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
