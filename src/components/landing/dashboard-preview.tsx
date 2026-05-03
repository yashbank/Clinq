export function DashboardPreview() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="glass-card relative overflow-hidden rounded-2xl border border-clinq-glass-border p-1 shadow-2xl shadow-primary/5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative rounded-xl bg-sidebar/80 p-8 backdrop-blur-xl">
            <div className="mb-6 flex gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive/60" />
              <div className="h-2 w-2 rounded-full bg-clinq-warning/80" />
              <div className="h-2 w-2 rounded-full bg-clinq-success" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg border border-clinq-glass-border bg-clinq-glass/40"
                />
              ))}
            </div>
            <div className="mt-4 h-40 rounded-lg border border-clinq-glass-border bg-gradient-to-r from-primary/5 to-accent/5" />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Live UI in <span className="text-foreground">/dashboard</span>—this is a static preview card.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
