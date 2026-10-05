import Link from "next/link";

export default function PracticeHubPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-navy-900">Practice</h1>
      <p className="mt-2 text-navy-600">Focused question sets with explanations. Results use server-side scoring.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/practice/setup" className="rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white">
          Start practice
        </Link>
        <Link href="/review" className="rounded-xl border border-navy-200 px-4 py-3 text-center text-sm font-semibold text-navy-800">
          Questions to review
        </Link>
        <Link href="/weak-areas" className="rounded-xl border border-navy-200 px-4 py-3 text-center text-sm font-semibold text-navy-800">
          Weak areas
        </Link>
      </div>
    </div>
  );
}
