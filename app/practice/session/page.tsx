"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/practice/QuestionCard";
import type { PracticeAnswerState, PracticeQuestion } from "@/types/practice";

/**
 * Session UI scaffold. Host must load questions from verified pool and
 * submit answers to server for scoring (never trust client isCorrect).
 */
export default function PracticeSessionPage() {
  const router = useRouter();
  const questions = useMemo<PracticeQuestion[]>(() => [], []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, PracticeAnswerState>>({});

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-navy-600">
        No questions loaded. Connect this route to the verified question pool for the selected exam/subject.
        <div className="mt-4">
          <button type="button" className="text-orange-600 underline" onClick={() => router.push("/practice/setup")}>
            Back to setup
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const state = answers[q.id] ?? { questionId: q.id, selectedKey: null, bookmarked: false, markedForReview: false };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <QuestionCard
        question={q}
        index={index}
        total={questions.length}
        selectedKey={state.selectedKey}
        bookmarked={state.bookmarked}
        markedForReview={state.markedForReview}
        onSelect={(key) =>
          setAnswers((prev) => ({
            ...prev,
            [q.id]: { ...state, selectedKey: key, answeredAt: new Date().toISOString() },
          }))
        }
        onToggleBookmark={() =>
          setAnswers((prev) => ({ ...prev, [q.id]: { ...state, bookmarked: !state.bookmarked } }))
        }
        onToggleReview={() =>
          setAnswers((prev) => ({ ...prev, [q.id]: { ...state, markedForReview: !state.markedForReview } }))
        }
      />
      <div className="fixed bottom-0 left-0 right-0 border-t border-navy-100 bg-white p-3 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl gap-2">
          <button type="button" className="flex-1 rounded-xl border border-navy-200 py-3 text-sm font-semibold disabled:opacity-40" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            Previous
          </button>
          {index < questions.length - 1 ? (
            <button type="button" className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white" onClick={() => setIndex((i) => i + 1)}>
              Next
            </button>
          ) : (
            <button type="button" className="flex-1 rounded-xl bg-navy-800 py-3 text-sm font-semibold text-white" onClick={() => router.push("/practice/result")}>
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
