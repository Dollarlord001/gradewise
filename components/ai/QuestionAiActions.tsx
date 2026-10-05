"use client";

const ACTIONS = [
  { id: "why-correct", label: "Why is this correct?" },
  { id: "explain-simple", label: "Explain simply" },
  { id: "another-method", label: "Show another method" },
  { id: "similar", label: "Similar question" },
  { id: "harder", label: "Harder question" },
  { id: "teach-topic", label: "Teach this topic" },
  { id: "explain-step", label: "Explain this step" },
] as const;

export function QuestionAiActions({
  questionId,
  onAction,
}: {
  questionId: string;
  onAction?: (actionId: string, questionId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="AI help for this question">
      {ACTIONS.map((a) => (
        <button
          key={a.id}
          type="button"
          className="rounded-full border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:border-orange-300 hover:bg-orange-50"
          onClick={() => onAction?.(a.id, questionId)}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
