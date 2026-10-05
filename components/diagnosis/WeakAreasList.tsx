import Link from "next/link";
import type { WeakAreaRow } from "@/types/practice";
import { formatPercent } from "@/lib/format";

export function WeakAreasList({ areas }: { areas: WeakAreaRow[] }) {
  if (areas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-navy-200 px-6 py-10 text-center text-sm text-navy-600">
        Not enough attempts yet to highlight weak areas. Complete practice sets so we can use real
        accuracy data.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {areas.map((a) => (
        <li key={a.topicId} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-navy-900">
                {a.subject} — {a.topicName}
              </p>
              <p className="mt-1 text-sm text-navy-600">
                {formatPercent(a.accuracyPercent)} accuracy · {a.attempts} attempts
              </p>
              <p className="mt-1 text-sm text-navy-500">{a.recommendedAction}</p>
            </div>
            <Link href={a.href} className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white">
              Practice
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
