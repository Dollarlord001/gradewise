"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoRecord } from "@/types/video";
import { VideoPlayer } from "@/components/video/VideoPlayer";

type Progress = { positionSeconds: number; percent: number; completed: boolean };
export function VideoWatchExperience({ video }: { video: VideoRecord & { attribution?: string; licenseType?: string; sourceUrl?: string | null; topicName?: string; subtopicName?: string } }) {
  const [position, setPosition] = useState(0); const [status, setStatus] = useState("");
  const lastSavedAt = useRef(0); const completed = useRef(false);
  useEffect(() => {
    const local = localStorage.getItem(`tutorme-video-progress:${video.id}`);
    if (local) { try { setPosition((JSON.parse(local) as Progress).positionSeconds); } catch { localStorage.removeItem(`tutorme-video-progress:${video.id}`); } }
    fetch(`/api/videos/progress?videoId=${encodeURIComponent(video.id)}`).then((response) => response.json()).then((body: { progress?: Progress | null }) => {
      if (body.progress && body.progress.positionSeconds > 0) { setPosition(body.progress.positionSeconds); completed.current = body.progress.completed; }
    }).catch(() => undefined);
  }, [video.id]);

  function save(positionSeconds: number, percent: number, isComplete = false) {
    setPosition(positionSeconds);
    const progress = { positionSeconds, percent, completed: isComplete || completed.current };
    try { localStorage.setItem(`tutorme-video-progress:${video.id}`, JSON.stringify(progress)); } catch { /* Local progress is optional. */ }
    if (!isComplete && Date.now() - lastSavedAt.current < 15_000) return;
    lastSavedAt.current = Date.now();
    void fetch("/api/videos/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoId: video.id, positionSeconds, percent, completed: progress.completed }) })
      .then((response) => { if (response.status === 401) setStatus("Progress is saved on this device. Sign in to sync it to your account."); else if (!response.ok) setStatus("Progress remains saved on this device; account sync is temporarily unavailable."); else setStatus("Progress synced"); })
      .catch(() => setStatus("Progress remains saved on this device; account sync is temporarily unavailable."));
  }

  return <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
    <div><p className="text-sm text-navy-500">{[video.examId, video.subjectId, video.topicName, video.subtopicName].filter(Boolean).join(" · ")}</p><h1 className="mt-2 text-2xl font-semibold text-navy-900">{video.title}</h1><p className="mt-2 text-sm text-navy-600">{video.description}</p></div>
    <VideoPlayer video={video} initialPositionSeconds={position} onProgress={(seconds, percent) => save(seconds, percent)} onComplete={() => { completed.current = true; save(position, 100, true); }} />
    <div className="grid gap-4 rounded-2xl border border-navy-100 bg-white p-4 text-sm sm:grid-cols-2">
      <div><p><b>Creator:</b> {video.creator ?? "Not supplied"}</p><p><b>Source:</b> {video.source ?? "Not supplied"}</p><p><b>Licence:</b> {video.licenseType ?? "Not supplied"}</p>{video.attribution && <p><b>Attribution:</b> {video.attribution}</p>}</div>
      <div className="space-y-2">{video.sourceUrl && <a className="block text-orange-700 underline" href={video.sourceUrl} target="_blank" rel="noreferrer">Open source record</a>}{video.licenseEvidenceRef && <a className="block text-orange-700 underline" href={video.licenseEvidenceRef} target="_blank" rel="noreferrer">View licence evidence</a>}{status && <p role="status" className="text-xs text-navy-500">{status}</p>}</div>
    </div>
  </div>;
}
