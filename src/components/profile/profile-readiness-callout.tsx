import Link from "next/link";

/** Inline callout when profile context is too thin for curated imports / proposal AI. */
export function ProfileReadinessCallout({ gaps }: { gaps: string[] }) {
  if (!gaps.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm">
      <p className="font-medium text-foreground">Strengthen your profile to unlock imports &amp; proposal AI</p>
      <p className="mt-1.5 text-muted-foreground">
        Add: {gaps.join(" · ")}. You can still browse the app; this only affects curated promotion and AI drafts until your
        context is richer.
      </p>
      <Link
        href="/profile"
        className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/90 hover:underline"
      >
        Open profile
      </Link>
    </div>
  );
}
