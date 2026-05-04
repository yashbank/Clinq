export default function PipelineLoading() {
  return (
    <div className="container max-w-7xl space-y-6 py-8">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[320px] animate-pulse rounded-xl border bg-muted/40" />
        ))}
      </div>
    </div>
  );
}
