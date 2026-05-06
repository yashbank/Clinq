import { Brain, LineChart, PenLine, Radar, Workflow } from "lucide-react";

const items = [
  {
    icon: Radar,
    title: "Lead intelligence",
    body: "Conversion scores, scam risk, and timing hints before you spend a connect.",
  },
  {
    icon: PenLine,
    title: "Proposal studio",
    body: "Human-sounding drafts tuned to psychology, urgency, and technical depth.",
  },
  {
    icon: Workflow,
    title: "Pipeline OS",
    body: "Kanban through repeat clients with notes, reminders, and AI suggestions.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    body: "Reply rate, win rate, platform mix—know what styles actually convert.",
  },
  {
    icon: Brain,
    title: "Client memory",
    body: "Win/loss, preferences, and budgets—ready for your next engagement.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border/50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          Built for focus, not noise
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Calm surfaces, sharp typography, and motion only where it carries meaning—built to feel fast and trustworthy.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card/95 p-6 shadow-sm ring-1 ring-black/[0.04] transition-all duration-200 hover:border-primary/20 hover:shadow-md dark:ring-0"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
