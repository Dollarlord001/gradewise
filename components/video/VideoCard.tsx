import Link from "next/link";
import type { VideoRecord } from "@/types/video";
import { formatDuration } from "@/lib/video-catalogue";
import { cn } from "@/lib/cn";

export function VideoCard({
  video,
  href,
  className,
}: {
  video: VideoRecord;
  href?: string;
  className?: string;
}) {
  const to = href ?? `/learn/videos/${video.id}`;
  return (
    <Link
      href={to}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-video bg-navy-100">
        {video.thumbnailUrl ? (
          // Host app should use next/image with remotePatterns configured
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            width={640}
            height={360}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-navy-400">No thumbnail</div>
        )}
        <span className="absolute bottom-2 right-2 rounded bg-navy-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-navy-900 group-hover:text-orange-600">
          {video.title}
        </h3>
        {video.creator || video.tutor ? (
          <p className="text-xs text-navy-500">{video.tutor ?? video.creator}</p>
        ) : null}
      </div>
    </Link>
  );
}
