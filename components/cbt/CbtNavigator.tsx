"use client";

import { cn } from "@/lib/cn";

export function CbtNavigator({
  total,
  currentIndex,
  answered,
  marked,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answered: Set<number>;
  marked: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Question navigator" className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === currentIndex;
        const isAnswered = answered.has(i);
        const isMarked = marked.has(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            className={cn(
              "flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg text-xs font-semibold",
              isCurrent && "ring-2 ring-orange-500",
              isAnswered ? "bg-navy-800 text-white" : "bg-navy-100 text-navy-700",
              isMarked && "outline outline-2 outline-offset-1 outline-gold-500"
            )}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}${isMarked ? ", marked for review" : ""}`}
          >
            {i + 1}
          </button>
        );
      })}
    </nav>
  );
}
