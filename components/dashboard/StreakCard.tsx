export function StreakCard({ days }: { days: number | null }) {
  return (
    <section className="card-base p-5" aria-labelledby="streak-heading">
      <h2 id="streak-heading" className="text-base font-semibold text-navy-900">
        Streak
      </h2>
      {days != null && days > 0 ? (
        <p className="mt-3">
          <span className="text-3xl font-semibold text-gold-600">{days}</span>
          <span className="ml-2 text-sm text-navy-600">day{days === 1 ? "" : "s"} in a row</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-navy-500">Start practicing to build a study streak.</p>
      )}
    </section>
  );
}
