import Image from "next/image";

import { cn } from "@/lib/utils";

const MARK = "/logo/clinq-mark.svg";
const WORDMARK = "/logo/clinq-wordmark.svg";

export function ClinqLogo({
  className,
  width = 40,
  height = 40,
  priority,
  variant = "mark",
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  variant?: "mark" | "wordmark";
}) {
  if (variant === "wordmark") {
    return (
      <Image
        src={WORDMARK}
        alt="Clinq"
        width={140}
        height={36}
        className={cn("h-8 w-auto max-w-[min(140px,100%)] object-contain object-left", className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={MARK}
      alt="Clinq"
      width={width}
      height={height}
      className={cn("object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.12)]", className)}
      priority={priority}
    />
  );
}
