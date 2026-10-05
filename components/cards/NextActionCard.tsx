import Link from "next/link";
import type { NextBestAction } from "@/types/student";
import { cn } from "@/lib/utils";

export function NextActionCard({ action, className }: { action: NextBestAction; className?: string }) {
  const meta: string[] = [];
  if (action.durationMinutes) meta.push(`${action.durationMinutes} min`);
  if (action.questionCount) meta.push(`${action.questionCount} questions`);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50 p-5 shadow-card",
        className
      )}
      aria-labelledby="next-action-title"
    >
      <p className="section-label text-orange-600">Next best action</p>
      <h2 id="next-action-title" className="mt-2 text-xl font-semibold text-navy-900">
        {action.title}
      </h2>
      <p className="mt-1 text-sm text-navy-600">{action.reason}</p>
      {meta.length > 0 ? (
        <p className="mt-2 text-xs font-medium text-navy-500">{meta.join(" · ")}</p>
      ) : null}
      <Link
        href={action.href}
        className="btn-primary mt-4 inline-flex"
      >
        Start →
      </Link>
    </section>
  );
}
