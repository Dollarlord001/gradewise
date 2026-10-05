"use client";

import Link from "next/link";

import { useState } from "react";
import type { SnapSolveResult } from "@/types/ai";

export function SnapQuestionFlow({
  onSubmitImage,
}: {
  onSubmitImage?: (file: File, note: string) => Promise<SnapSolveResult>;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnapSolveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(f: File | null) {
    setResult(null);
    setError(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      if (!onSubmitImage) {
        setError("Wire onSubmitImage to the server Snap pipeline.");
        return;
      }
      const res = await onSubmitImage(file, note);
      setResult(res);
    } catch {
      setError("Something went wrong. Try again with a clearer photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold text-navy-900">Snap a mathematics question</h1>
      <p className="text-sm text-navy-600">
        Capture a clear photo. We only solve what we can read confidently — we will not invent missing numbers.
      </p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-navy-300 bg-navy-50/40 px-4 py-10 text-sm text-navy-600">
        <span className="font-medium text-navy-800">Camera or file</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Selected question preview" className="max-h-64 w-full rounded-xl object-contain border" />
      ) : null}
      <label className="block text-sm">
        <span className="font-medium text-navy-700">Optional note</span>
        <textarea className="mt-1 w-full rounded-xl border border-navy-200 px-3 py-2 text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I need step 2 explained" />
      </label>
      <button type="button" disabled={!file || loading} className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={submit}>
        {loading ? "Analyzing…" : "Submit"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result?.extraction.refusalReason ? (
        <p className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-navy-800">{result.extraction.refusalReason}</p>
      ) : null}
      {result?.extraction.readable && result.extraction.questionText ? (
        <div className="space-y-3 rounded-xl border border-navy-100 p-4 text-sm">
          <p className="font-semibold text-navy-900">Extracted question</p>
          <p className="whitespace-pre-wrap text-navy-700">{result.extraction.questionText}</p>
          {result.steps?.map((s, i) => (
            <p key={i} className="text-navy-700">
              <span className="font-medium">Step {i + 1}:</span> {s}
            </p>
          ))}
          {result.finalAnswer ? (
            <p className="font-semibold text-seagreen-800">Answer: {result.finalAnswer}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/practice/setup" className="rounded-full border px-3 py-1.5 text-xs font-medium">Practice this topic</Link>
            <Link href="/ai-tutor" className="rounded-full border px-3 py-1.5 text-xs font-medium">Explain more simply</Link>
            <Link href="/learn" className="rounded-full border px-3 py-1.5 text-xs font-medium">Teach this topic</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
