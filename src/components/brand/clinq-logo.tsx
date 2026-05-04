import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo/logo.jpg";

export function ClinqLogo({
  className,
  width = 40,
  height = 40,
  priority,
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Clinq"
      width={width}
      height={height}
      className={cn("rounded-lg object-cover ring-1 ring-white/10", className)}
      priority={priority}
    />
  );
}
