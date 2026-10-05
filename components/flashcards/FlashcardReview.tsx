"use client";

import { useState } from "react";
import type { Flashcard } from "@/types/learning";

export function FlashcardReview({
  cards,
  onReviewed,
}: {
  cards: Flashcard[];
  onReviewed?: (cardId: string, knew: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  if (!card) {
    return <p className="text-sm text-navy-600">No cards in this deck.</p>;
  }

  function next(knew: boolean) {
    onReviewed?.(card.id, knew);
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="text-center text-xs text-navy-500">
        Card {index + 1} of {cards.length}
      </p>
      <button
        type="button"
        className="flex min-h-[200px] w-full items-center justify-center rounded-2xl border border-navy-200 bg-white p-6 text-center text-lg font-medium text-navy-900 shadow-sm"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show front" : "Show answer"}
      >
        {flipped ? card.back : card.front}
      </button>
      <p className="text-center text-xs text-navy-400">Tap card to flip</p>
      {flipped ? (
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-navy-200 py-2.5 text-sm font-semibold text-navy-800"
            onClick={() => next(false)}
          >
            Still learning
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-seagreen-600 py-2.5 text-sm font-semibold text-white hover:bg-seagreen-700"
            onClick={() => next(true)}
          >
            Got it
          </button>
        </div>
      ) : null}
    </div>
  );
}
