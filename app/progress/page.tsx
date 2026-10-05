import Link from "next/link";

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Progress</h1>
      <p className="mt-2 text-navy-600">Metrics appear from real practice, CBT, lessons and video completion — never invented.</p>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["Questions", "Accuracy", "Study time", "Streak"].map((l) => (
          <div key={l} className="rounded-xl bg-navy-50 px-3 py-4 text-center">
            <dt className="text-xs text-navy-500">{l}</dt>
            <dd className="mt-1 text-lg font-semibold text-navy-900">—</dd>
          </div>
        ))}
      </dl>
      <nav className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/progress/subjects" className="text-orange-600 hover:underline">Subjects</Link>
        <Link href="/progress/topics" className="text-orange-600 hover:underline">Topics</Link>
        <Link href="/progress/history" className="text-orange-600 hover:underline">History</Link>
      </nav>
    </div>
  );
}
