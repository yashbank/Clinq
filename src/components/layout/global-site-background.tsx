import { VideoWithFallback } from "@/components/layout/video-with-fallback";

export function GlobalSiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <VideoWithFallback
        videoSrc="/background/bg-global.mp4"
        poster="/background/bg-image.png"
        fallbackImageSrc="/background/bg-image.png"
        videoClassName="opacity-[0.14]"
      />
      <div className="absolute inset-0 bg-background/94" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background/98" />
    </div>
  );
}
