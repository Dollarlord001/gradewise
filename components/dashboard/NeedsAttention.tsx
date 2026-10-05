import Link from "next/link";
import type { TopicMasteryRow } from "@/types/student";
import { MasteryBadge } from "@/components/ui/MasteryBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export function NeedsAttention({
  weakTopics,
  reviewCount,
}: {
  weakTopics: TopicMasteryRow[];
  reviewCount: number;
}) {
  const hasItems = weakTopics.length > 0 || reviewCount > 0;

  return (
    <section className="card-base p-5" aria-labelledby="attention-heading">
      <h2 id="attention-heading" className="text-base font-semibold text-navy-900">
        Needs attention
      </h2>
      {!hasItems ? (
        <EmptyState
          title="You're on track"
          description="Weak topics and review items will appear here when available."
          className="mt-3 border-0 bg-transparent py-4"
        />
      ) : (
        <ul className="mt-3 space-y-3">
          {weakTopics.slice(0, 3).map((t) => (
            <li key={t.topicId} className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-navy-800">{t.topicName}</p>
                <p className="text-xs text-navy-500">{t.subject}</p>
              </div>
              <MasteryBadge mastery={t.mastery} />
            </li>
          ))}
          {reviewCount > 0 ? (
            <li>
              <Link href="/practice/review" className="text-sm font-medium text-orange-600 hover:underline">
                {reviewCount} question{reviewCount === 1 ? "" : "s"} to review →
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
