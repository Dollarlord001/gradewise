import { buildDailyPlan } from "@/lib/planner";

export default function PlannerTodayPage() {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = buildDailyPlan({ date: today, studyMinutes: 45, weakTopics: [] });
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Today&apos;s plan</h1>
      <ul className="mt-6 space-y-3">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-xl border border-navy-100 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{t.kind}</p>
            <p className="font-medium text-navy-900">{t.title}</p>
            {t.estimatedMinutes ? <p className="text-xs text-navy-500">{t.estimatedMinutes} min</p> : null}
            <a href={t.href} className="mt-2 inline-block text-sm text-orange-600 hover:underline">Open →</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
