import { formatPercent } from "@/lib/utils";

export function PerformanceSnapshot({
  accuracyPercent,
  questionsAttempted,
  studyMinutes,
}: {
  accuracyPercent: number | null;
  questionsAttempted: number;
  studyMinutes: number | null;
}) {
  const stats = [
    { label: "Accuracy", value: formatPercent(accuracyPercent) },
    { label: "Questions", value: questionsAttempted > 0 ? String(questionsAttempted) : "—" },
    {
      label: "Study time",
      value: studyMinutes != null && studyMinutes > 0 ? `${studyMinutes} min` : "—",
    },
  ];

  return (
    <section className="card-base p-5" aria-labelledby="perf-heading">
      <h2 id="perf-heading" className="text-base font-semibold text-navy-900">
        Performance snapshot
      </h2>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-navy-50/80 px-3 py-3 text-center">
            <dt className="text-xs text-navy-500">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-navy-900">{s.value}</dd>
          </div>
        ))}
      </dl>
      {questionsAttempted === 0 ? (
        <p className="mt-3 text-xs text-navy-500">Complete practice to see your stats here.</p>
      ) : null}
    </section>
  );
}
