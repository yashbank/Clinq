const quotes = [
  {
    quote: "I stopped spray-and-pray bidding. Clinq is my filter and my closer.",
    name: "Maya K.",
    role: "Product engineer · fractional",
  },
  {
    quote: "Pipeline + proposals in one glass UI—finally feels like 2026.",
    name: "Jordan Lee",
    role: "Design systems consultant",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        {quotes.map((q) => (
          <blockquote
            key={q.name}
            className="rounded-2xl border border-border bg-card/95 p-8 shadow-sm"
          >
            <p className="text-lg leading-relaxed text-foreground">&ldquo;{q.quote}&rdquo;</p>
            <footer className="mt-6 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{q.name}</span> — {q.role}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
