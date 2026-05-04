"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

type Props = {
  videoSrc: string;
  poster: string;
  fallbackImageSrc: string;
  videoClassName?: string;
};

/**
 * Autoplaying background video with PNG fallback when decode/network fails.
 */
export function VideoWithFallback({ videoSrc, poster, fallbackImageSrc, videoClassName }: Props) {
  const [useImage, setUseImage] = useState(false);
  const onError = useCallback(() => setUseImage(true), []);

  if (useImage) {
    return (
      <div className="absolute inset-0">
        <Image
          src={fallbackImageSrc}
          alt=""
          fill
          className={cn("object-cover", videoClassName)}
          sizes="100vw"
          priority={false}
        />
      </div>
    );
  }

  return (
    <video
      className={cn("absolute inset-0 h-full w-full object-cover", videoClassName)}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      onError={onError}
      aria-hidden
    >
      <source src={videoSrc} type="video/mp4" />
    </video>
  );
}
