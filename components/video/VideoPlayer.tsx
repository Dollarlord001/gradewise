"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HostingMode } from "@/types/learning";
import type { VideoRecord } from "@/types/video";
import { cn } from "@/lib/cn";

/**
 * Player shell:
 * - youtube_embed / external_embed: official iframe (no bypass of provider rules)
 * - tutor_me_cdn: HTML5 video from authorized stream URL
 */
export function VideoPlayer({
  video,
  initialPositionSeconds = 0,
  onProgress,
  onComplete,
  className,
}: {
  video: VideoRecord;
  initialPositionSeconds?: number;
  onProgress?: (positionSeconds: number, percent: number) => void;
  onComplete?: () => void;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  const mode: HostingMode = video.hostingMode;

  const handleTimeUpdate = useCallback(() => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    const pct = Math.min(100, (el.currentTime / el.duration) * 100);
    onProgress?.(Math.floor(el.currentTime), pct);
    if (pct >= 90) onComplete?.();
  }, [onProgress, onComplete]);

  useEffect(() => {
    const el = videoRef.current;
    if (el && initialPositionSeconds > 0) {
      el.currentTime = initialPositionSeconds;
    }
  }, [initialPositionSeconds, video.id]);

  if (mode === "unavailable") {
    return (
      <div className={cn("flex aspect-video items-center justify-center rounded-2xl bg-navy-100 text-sm text-navy-600", className)}>
        This video is not available for playback.
      </div>
    );
  }

  if (mode === "youtube_embed" && video.youtubeVideoId) {
    const src = `https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?rel=0&modestbranding=1`;
    return (
      <div className={cn("aspect-video overflow-hidden rounded-2xl bg-black", className)}>
        <iframe
          title={video.title}
          src={src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (mode === "external_embed" && video.embedUrl) {
    return (
      <div className={cn("aspect-video overflow-hidden rounded-2xl bg-black", className)}>
        <iframe title={video.title} src={video.embedUrl} className="h-full w-full" allowFullScreen loading="lazy" />
      </div>
    );
  }

  if ((mode === "tutor_me_cdn" || mode === "external_video") && (video.streamUrl || video.storageUrl)) {
    return (
      <div className={cn("aspect-video overflow-hidden rounded-2xl bg-black", className)}>
        <video
          ref={videoRef}
          className="h-full w-full"
          controls
          playsInline
          preload="metadata"
          poster={video.thumbnailUrl ?? undefined}
          src={video.streamUrl ?? video.storageUrl ?? undefined}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setError("Playback failed. Check the authorized stream URL.")}
        >
          {video.captionsAvailable ? (
            <track kind="captions" srcLang="en" label="English" />
          ) : null}
        </video>
        {error ? <p className="p-2 text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex aspect-video items-center justify-center rounded-2xl bg-navy-100 text-sm text-navy-600", className)}>
      Playback configuration incomplete for this video.
    </div>
  );
}
