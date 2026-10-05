import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export function RecentActivity({
  items,
}: {
  items: { id: string; label: string; at: string; href?: string }[];
}) {
  return (
    <section className="card-base p-5" aria-labelledby="activity-heading">
      <h2 id="activity-heading" className="text-base font-semibold text-navy-900">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Lessons, practice, and CBT sessions will show up here."
          className="mt-3 border-0 bg-transparent py-4"
        />
      ) : (
        <ul className="mt-3 divide-y divide-navy-50">
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
              {item.href ? (
                <Link href={item.href} className="font-medium text-navy-800 hover:text-orange-600">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-navy-800">{item.label}</span>
              )}
              <time className="shrink-0 text-xs text-navy-400" dateTime={item.at}>
                {new Date(item.at).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
