import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background gradient-mesh px-4 py-12">
      <Skeleton className="h-12 w-12 rounded-2xl clinq-skeleton-shimmer" />
      <Skeleton className="mt-6 h-7 w-48 rounded-md clinq-skeleton-shimmer" />
      <Skeleton className="mt-3 h-4 w-64 max-w-full rounded-md clinq-skeleton-shimmer" />
      <div className="mt-10 w-full max-w-sm space-y-3">
        <Skeleton className="h-11 w-full rounded-lg clinq-skeleton-shimmer" />
        <Skeleton className="h-11 w-full rounded-lg clinq-skeleton-shimmer" />
        <Skeleton className="h-10 w-full rounded-lg clinq-skeleton-shimmer" />
      </div>
    </div>
  );
}
