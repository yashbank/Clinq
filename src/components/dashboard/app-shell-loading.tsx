import { Skeleton } from "@/components/ui/skeleton";

export function AppShellLoading({
  variant = "table",
}: {
  variant?: "dashboard" | "table";
}) {
  return (
    <div className="gradient-mesh flex h-screen overflow-hidden bg-background">
      <aside
        className="hidden h-screen w-14 shrink-0 border-r border-clinq-glass-border bg-sidebar md:block"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-clinq-glass-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
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
          ) : (
            <Skeleton className="min-h-[min(420px,70vh)] w-full rounded-xl" />
          )}
        </main>
      </div>
    </div>
  );
}
