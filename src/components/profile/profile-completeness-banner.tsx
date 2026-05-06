import Link from "next/link";

import type { ProfileCompletenessAssessment } from "@/lib/profile/profile-completeness";

export function ProfileCompletenessBanner({ assessment }: { assessment: ProfileCompletenessAssessment }) {
  if (assessment.passesCuratedLeadWorkflow) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-foreground dark:border-amber-400/15 dark:bg-amber-400/[0.05]"
    >
      <p className="font-medium text-foreground">Profile context is still thin for curated imports.</p>
      <p className="mt-1 text-muted-foreground">
        Strengthen your profile so lead matching and staging stay accurate. Browsing stays open — this only affects import and promote flows that rely on your skills graph.
      </p>
      {assessment.missing.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          {assessment.missing.slice(0, 5).map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
      <Link
        href="/profile"
        className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Complete profile
      </Link>
    </div>
  );
}
