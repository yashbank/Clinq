export default function LeadsLoading() {
  return (
    <div className="container max-w-6xl space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border bg-muted/40" />
    </div>
  );
}
