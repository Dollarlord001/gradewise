import Link from "next/link";

export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Study planner</h1>
      <p className="mt-2 text-navy-600">Learn → Practice → Review → Test. Plans adapt when weak topics exist.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/planner/today" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">Today</Link>
        <Link href="/planner/week" className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800">This week</Link>
      </div>
    </div>
  );
}
