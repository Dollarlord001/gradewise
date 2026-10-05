import Link from "next/link";
import { SUBJECT_CATALOGUE } from "@/lib/subjects";

/**
 * /learn — subject index. Data-driven; host may enrich with progress counts from DB.
 * Metadata: set in host layout or export generateMetadata with site SEO helper.
 */
export default function LearnIndexPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-navy-900 sm:text-3xl">Learn</h1>
      <p className="mt-2 max-w-2xl text-navy-600">
        Choose a subject. Topics, lessons, videos, notes and practice follow the same path for every
        subject.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Learn sections">
        <Link href="/learn/videos" className="rounded-full bg-navy-50 px-3 py-1.5 font-medium text-navy-800 hover:bg-navy-100">
          Videos
        </Link>
        <Link href="/learn/notes" className="rounded-full bg-navy-50 px-3 py-1.5 font-medium text-navy-800 hover:bg-navy-100">
          Notes
        </Link>
        <Link href="/learn/flashcards" className="rounded-full bg-navy-50 px-3 py-1.5 font-medium text-navy-800 hover:bg-navy-100">
          Flashcards
        </Link>
        <Link href="/learn/resources" className="rounded-full bg-navy-50 px-3 py-1.5 font-medium text-navy-800 hover:bg-navy-100">
          Digital library
        </Link>
      </nav>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {SUBJECT_CATALOGUE.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/learn/${s.slug}`}
              className="block rounded-2xl border border-navy-100 bg-white p-4 font-medium text-navy-900 shadow-sm transition hover:border-orange-200 hover:shadow-md"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
