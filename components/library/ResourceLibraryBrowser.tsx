"use client";

import { useEffect, useState } from "react";
import { SUBJECT_CATALOGUE } from "@/lib/subjects";

type Resource = { id: string; title: string; author?: string | null; publisher?: string | null; examRelevance?: string | null; resourceType: string; publicationYear?: number | null; source: string; sourceUrl?: string; readerUrl?: string; rightsStatus: string; license?: string | null; accessType: string; description?: string | null; language?: string | null };
type Result = { items: Resource[]; total: number; page: number; pageSize: number; hasMore: boolean; error?: string };

export function ResourceLibraryBrowser() {
  const [search, setSearch] = useState(""); const [exam, setExam] = useState(""); const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState(""); const [type, setType] = useState(""); const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result>({ items: [], total: 0, page: 1, pageSize: 24, hasMore: false });
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController(); const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ page: String(page) });
      if (search.trim()) params.set("q", search.trim()); if (exam) params.set("exam", exam); if (subject) params.set("subject", subject);
      if (topic.trim()) params.set("topic", topic.trim()); if (type) params.set("type", type);
      setLoading(true); setError("");
      fetch(`/api/resources?${params}`, { signal: controller.signal }).then(async (response) => {
        const body = await response.json() as Result;
        if (!response.ok) throw new Error(body.error ?? "The library could not be loaded.");
        setResult(body);
      }).catch((cause) => { if (cause instanceof DOMException && cause.name === "AbortError") return; setError(cause instanceof Error ? cause.message : "The library could not be loaded."); })
        .finally(() => setLoading(false));
    }, search ? 250 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [exam, page, search, subject, topic, type]);

  const resetPage = (update: () => void) => { update(); setPage(1); };
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-sm lg:col-span-2"><span className="mb-1 block font-medium">Search resources</span><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Title, author or publisher" className="w-full rounded-xl border border-navy-200 p-2.5" /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Exam</span><select value={exam} onChange={(event) => resetPage(() => setExam(event.target.value))} className="w-full rounded-xl border border-navy-200 p-2.5"><option value="">All exams</option><option>JAMB</option><option>WAEC</option><option>NECO</option></select></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Subject</span><select value={subject} onChange={(event) => resetPage(() => setSubject(event.target.value))} className="w-full rounded-xl border border-navy-200 p-2.5"><option value="">All subjects</option>{SUBJECT_CATALOGUE.map((item) => <option key={item.slug} value={item.name}>{item.name}</option>)}</select></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Resource type</span><select value={type} onChange={(event) => resetPage(() => setType(event.target.value))} className="w-full rounded-xl border border-navy-200 p-2.5"><option value="">All types</option>{["textbook", "open_textbook", "study_guide", "reference", "syllabus", "notes", "oer"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
      <label className="text-sm sm:col-span-2 lg:col-span-5"><span className="mb-1 block font-medium">Topic or subtopic</span><input value={topic} onChange={(event) => resetPage(() => setTopic(event.target.value))} placeholder="Filter by syllabus topic" className="w-full rounded-xl border border-navy-200 p-2.5" /></label>
    </div>
    {error && <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">{error}</p>}
    {!result.items.length ? <p className="rounded-2xl border border-dashed border-navy-200 px-6 py-12 text-center text-sm text-navy-600">{loading ? "Loading rights-cleared resources…" : "No resources match these filters yet."}</p> : <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{result.items.map((item) => <li key={item.id} className="flex flex-col rounded-2xl border border-navy-100 bg-white p-4 shadow-sm"><p className="text-xs uppercase tracking-wide text-navy-500">{item.examRelevance || item.resourceType.replaceAll("_", " ")}</p><h2 className="mt-2 text-base font-semibold text-navy-900">{item.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-navy-600">{item.description || [item.author, item.publisher, item.language].filter(Boolean).join(" · ")}</p><p className="mt-3 text-xs text-navy-500">{item.source} · {item.rightsStatus.replaceAll("_", " ")}{item.license ? ` · ${item.license}` : ""}</p><div className="mt-3 flex gap-4 text-sm">{item.readerUrl && <a className="text-orange-700 underline" href={item.readerUrl} target="_blank" rel="noreferrer">Read resource</a>}{item.sourceUrl && <a className="text-navy-700 underline" href={item.sourceUrl} target="_blank" rel="noreferrer">Rights/source</a>}</div></li>)}</ul>}
    <div className="flex items-center justify-between text-sm text-navy-600"><span>{loading ? "Updating…" : <>Page {page} · {result.total.toLocaleString()} resources</>}</span><div className="flex gap-2"><button className="rounded-lg border px-3 py-1.5 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><button className="rounded-lg border px-3 py-1.5 disabled:opacity-40" disabled={!result.hasMore || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
  </div>;
}
