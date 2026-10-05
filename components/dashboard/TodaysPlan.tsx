import Link from "next/link";
import type { StudyPlanItem } from "@/types/student";
import { EmptyState } from "@/components/ui/EmptyState";

export function TodaysPlan({ items }: { items: StudyPlanItem[] }) {
  const planned = items.filter((i) => i.status === "planned");

  return (
    <section className="card-base p-5" aria-labelledby="todays-plan-heading">
      <h2 id="todays-plan-heading" className="text-base font-semibold text-navy-900">
        Today&apos;s plan
      </h2>
      {planned.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No plan items yet"
            description="After onboarding, we'll suggest a focused daily plan."
            action={
              <Link href="/onboarding" className="btn-secondary text-sm">
                Set up study plan
              </Link>
            }
            className="border-0 bg-transparent py-4"
          />
        </div>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {planned.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm text-navy-700">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden />
                {item.title}
                {item.subject ? <span className="text-navy-400">· {item.subject}</span> : null}
              </li>
            ))}
          </ul>
          <Link href="/practice" className="btn-primary mt-4 inline-flex">
            Start Today&apos;s Plan
          </Link>
        </>
      )}
    </section>
  );
}
