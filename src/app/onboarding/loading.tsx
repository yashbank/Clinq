import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="gradient-mesh flex min-h-[100dvh] flex-col items-center justify-center px-4 py-14 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border/60 bg-card/40 p-8 shadow-sm">
        <Skeleton className="mx-auto h-11 w-11 rounded-xl" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
