"use client";

import type { PracticeQuestion } from "@/types/practice";
import { cn } from "@/lib/cn";

export function QuestionCard({
  question,
  index,
  total,
  selectedKey,
  showResult,
  onSelect,
  bookmarked,
  markedForReview,
  onToggleBookmark,
  onToggleReview,
}: {
  question: PracticeQuestion;
  index: number;
  total: number;
  selectedKey: string | null;
  showResult?: boolean;
  onSelect?: (key: string) => void;
  bookmarked?: boolean;
  markedForReview?: boolean;
  onToggleBookmark?: () => void;
  onToggleReview?: () => void;
}) {
  const correctKey = question.correctKey;

  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-navy-500">
        <span>
          Question {index + 1} of {total}
        </span>
        <div className="flex gap-2">
          {onToggleBookmark ? (
            <button type="button" className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium" onClick={onToggleBookmark}>
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>
          ) : null}
          {onToggleReview ? (
            <button type="button" className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium" onClick={onToggleReview}>
              {markedForReview ? "Marked" : "Mark for review"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      {question.passage ? (
        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4 text-sm text-navy-700 whitespace-pre-wrap">{question.passage}</div>
      ) : null}

      <div className="text-base font-medium text-navy-900 sm:text-lg">{question.prompt}</div>

      {question.images?.map((img, i) => (
        // Host should use next/image
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img.url} alt={img.alt ?? "Question diagram"} className="max-h-64 rounded-xl border border-navy-100" loading="lazy" />
      ))}

      <ul className="space-y-2" role="listbox" aria-label="Answer choices">
        {question.options.map((opt) => {
          const selected = selectedKey === opt.key;
          let tone = "border-navy-200 hover:border-navy-300";
          if (showResult && correctKey) {
            if (opt.key === correctKey) tone = "border-seagreen-500 bg-seagreen-50";
            else if (selected) tone = "border-red-400 bg-red-50";
          } else if (selected) {
            tone = "border-orange-500 bg-orange-50";
          }
          return (
            <li key={opt.key}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={showResult || !onSelect}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm sm:text-base min-h-[48px]",
                  tone
                )}
                onClick={() => onSelect?.(opt.key)}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                  {opt.key.toUpperCase()}
                </span>
                <span className="pt-0.5 text-navy-900">{opt.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {showResult && question.explanation ? (
        <div className="rounded-xl border border-navy-100 bg-white p-4 text-sm text-navy-700">
          <p className="font-semibold text-navy-900">Explanation</p>
          <p className="mt-1 whitespace-pre-wrap">{question.explanation}</p>
        </div>
      ) : null}

      <p className="text-xs text-navy-400">
        {question.sourceKind === "authentic_sourced"
          ? `Sourced practice · ${question.sourceName ?? question.exam}${question.year ? ` ${question.year}` : ""}`
          : question.sourceKind === "tutor_me_original"
            ? "TUTOR-ME original practice question (not an official past paper item)"
            : "Source status pending verification"}
        {question.subject ? ` · ${question.subject}` : null}
        {question.topicName ? ` · ${question.topicName}` : null}
      </p>
    </article>
  );
}
