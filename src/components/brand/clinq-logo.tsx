import { cn } from "@/lib/utils";

const cyanSoft = "#67e8f9";
const surface = "#080c14";
const strokeSubtle = "oklch(0.32 0.04 200 / 0.35)";

function MarkSvg({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="8" fill={surface} stroke={strokeSubtle} strokeWidth="1" />
      <path
        d="M21.2 10.2c-3.9-2.2-9.1-.3-9.1 5.1 0 5.4 5.2 7.3 9.1 5.1"
        stroke="oklch(0.92 0.01 280)"
        strokeWidth="1.65"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="21.5" cy="10.2" r="1.35" fill={cyanSoft} opacity="0.95" />
      <circle cx="21.5" cy="10.2" r="2.8" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="0.75" fill="none" />
    </svg>
  );
}

export function ClinqLogo({
  className,
  width = 40,
  height = 40,
  priority: _priority,
  variant = "mark",
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "mark" | "wordmark";
}) {
  void _priority;

  if (variant === "wordmark") {
    const markPx = Math.min(28, height);
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Clinq">
        <MarkSvg size={markPx} />
        <span className="relative inline-flex flex-col leading-none">
          <span className="font-sans text-[1.0625rem] font-semibold tracking-[-0.045em] text-foreground">Clinq</span>
          <span className="mt-[3px] h-px w-full max-w-[2.75rem] rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/70 to-cyan-500/0" aria-hidden />
        </span>
      </span>
    );
  }

  return <MarkSvg size={width} className={cn(className)} />;
}
