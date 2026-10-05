"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoListResult, VideoRecord } from "@/types/video";
import { VideoCard } from "./VideoCard";
import { SUBJECT_CATALOGUE } from "@/lib/subjects";
import { cn } from "@/lib/cn";

type Playlist = { id: string; title: string; description?: string | null; exam: string; subject: string; topic?: string | null; videoIds: string[] };

export function VideoLibraryBrowser({ initial }: { initial: VideoListResult }) {
  const [q, setQ] = useState(""); const [exam, setExam] = useState(""); const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState(""); const [playlistId, setPlaylistId] = useState(""); const [page, setPage] = useState(1);
  const [result, setResult] = useState(initial); const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const subjects = useMemo(() => SUBJECT_CATALOGUE, []);

  useEffect(() => { fetch("/api/videos/playlists").then((response) => response.json()).then((body: { playlists?: Playlist[] }) => setPlaylists(body.playlists ?? [])).catch(() => setPlaylists([])); }, []);
  useEffect(() => {
    const controller = new AbortController(); const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page) });
      if (q.trim()) params.set("q", q.trim()); if (exam) params.set("exam", exam); if (subject) params.set("subject", subject);
      if (topic.trim()) params.set("topic", topic.trim()); if (playlistId) params.set("playlistId", playlistId);
      setLoading(true); setError(null);
      fetch(`/api/videos?${params}`, { signal: controller.signal }).then(async (response) => {
        const body = await response.json() as VideoListResult & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "The video list could not be loaded.");
        setResult(body);
      }).catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(cause instanceof Error ? cause.message : "The video list could not be loaded."); })
        .finally(() => setLoading(false));
    }, q ? 250 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [exam, page, playlistId, q, subject, topic]);

  function resetPage(action: () => void) { action(); setPage(1); }
  const recommendations = result.items.slice(0, 3);
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="block text-sm lg:col-span-2"><span className="mb-1 block font-medium text-navy-700">Search videos</span><input type="search" value={q} onChange={(event) => resetPage(() => setQ(event.target.value))} placeholder="Title, creator, topic…" className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm" /></label>
      <label className="block text-sm"><span className="mb-1 block font-medium text-navy-700">Exam</span><select value={exam} onChange={(event) => resetPage(() => setExam(event.target.value))} className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm"><option value="">All exams</option><option>JAMB</option><option>WAEC</option><option>NECO</option></select></label>
      <label className="block text-sm"><span className="mb-1 block font-medium text-navy-700">Subject</span><select value={subject} onChange={(event) => resetPage(() => setSubject(event.target.value))} className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm"><option value="">All subjects</option>{subjects.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}</select></label>
      <label className="block text-sm"><span className="mb-1 block font-medium text-navy-700">Topic</span><input value={topic} onChange={(event) => resetPage(() => setTopic(event.target.value))} placeholder="Filter topic" className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm" /></label>
      {playlists.length > 0 && <label className="block text-sm sm:col-span-2 lg:col-span-5"><span className="mb-1 block font-medium text-navy-700">Playlist</span><select value={playlistId} onChange={(event) => resetPage(() => setPlaylistId(event.target.value))} className="w-full rounded-xl border border-navy-200 px-3 py-2.5 text-sm"><option value="">All approved videos</option>{playlists.map((item) => <option key={item.id} value={item.id}>{item.exam} · {item.subject} · {item.title}</option>)}</select></label>}
    </div>
    {error && <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{error}</p>}
    {result.items.length === 0 ? <p className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 px-6 py-12 text-center text-sm text-navy-600">{loading ? "Loading approved videos…" : "No approved videos match these filters yet."}</p> : <>
      {recommendations.length > 0 && <section><h2 className="mb-3 text-sm font-semibold text-navy-800">Suggested for these filters</h2><ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recommendations.map((video) => <li key={`recommended-${video.id}`}><VideoCard video={video} /></li>)}</ul></section>}
      {result.items.length > recommendations.length && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{result.items.slice(recommendations.length).map((video: VideoRecord) => <li key={video.id}><VideoCard video={video} /></li>)}</ul>}
    </>}
    <div className="flex items-center justify-between text-sm text-navy-600"><span>{loading ? "Updating…" : <>Page {result.page} · {result.total.toLocaleString()} videos</>}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} className={cn("rounded-lg border px-3 py-1.5 disabled:opacity-40")} onClick={() => setPage((value) => value - 1)}>Previous</button><button type="button" disabled={!result.hasMore || loading} className={cn("rounded-lg border px-3 py-1.5 disabled:opacity-40")} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
  </div>;
}
