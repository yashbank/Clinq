import { cn } from "@/lib/utils";
import type { IntegrationProviderId } from "@/types/integrations";

const STYLES: Record<IntegrationProviderId, string> = {
  freelancer: "bg-gradient-to-br from-sky-500 to-blue-700",
  upwork: "bg-gradient-to-br from-emerald-500 to-green-800",
  fiverr: "bg-gradient-to-br from-green-400 to-teal-700",
  contra: "bg-gradient-to-br from-violet-500 to-fuchsia-700",
};

export function IntegrationPlatformMark({
  id,
  initial,
  className,
}: {
  id: IntegrationProviderId;
  initial: string;
  className?: string;
}) {
  const display = initial.length <= 1 ? initial.toUpperCase() : initial.slice(0, 2);
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight text-primary-foreground shadow-sm",
        STYLES[id],
        className,
      )}
      aria-hidden
    >
      {display}
    </div>
  );
}
