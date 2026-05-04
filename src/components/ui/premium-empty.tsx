import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Action = { label: string; href: string } | { label: string; onClick: () => void };

export function PremiumEmpty({
  icon: Icon,
  title,
  description,
  primary,
  secondary,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  primary?: Action;
  secondary?: Action;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-clinq-glass-border/60 bg-background/[0.35] px-6 py-14 text-center transition-[border-color,background-color] duration-300",
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-clinq-glass-border/70 bg-clinq-glass/30">
          <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
      ) : null}
      <h3 className={cn("text-base font-semibold tracking-tight text-foreground", Icon ? "mt-5" : "")}>{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {primary ? (
          "href" in primary ? (
            <Link
              href={primary.href}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              {primary.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={primary.onClick}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-95"
            >
              {primary.label}
            </button>
          )
        ) : null}
        {secondary ? (
          "href" in secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-clinq-glass-border bg-background/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-clinq-glass/40"
            >
              {secondary.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={secondary.onClick}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-clinq-glass-border bg-background/60 px-4 text-sm font-medium text-foreground transition-colors hover:bg-clinq-glass/40"
            >
              {secondary.label}
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
