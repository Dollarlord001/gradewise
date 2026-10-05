import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubjectBySlug } from "@/lib/subjects";

/**
 * Load topics for subject from DB in host app.
 * This package ships an empty topic list until data is imported.
 */
export default async function LearnSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: slug } = await params;
  const subject = getSubjectBySlug(slug);
  if (!subject) notFound();

  // TODO: const topics = await repo.listTopicsBySubjectSlug(slug)
  const topics: { slug: string; name: string; parentSlug?: string }[] = [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-navy-500">
        <Link href="/learn" className="hover:text-navy-800">
          Learn
        </Link>
        <span className="mx-2">/</span>
        <span className="text-navy-800">{subject.name}</span>
      </nav>
      <h1 className="mt-4 text-2xl font-semibold text-navy-900 sm:text-3xl">{subject.name}</h1>
      <p className="mt-2 text-navy-600">Topics and lessons for this subject.</p>
      {topics.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-navy-200 bg-navy-50/40 px-6 py-10 text-center text-sm text-navy-600">
          No topics published yet. Import official syllabus topics or curated content — do not invent
          curriculum.
        </p>
      ) : (
        <ul className="mt-8 space-y-2">
          {topics.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/learn/${slug}/${t.slug}`}
                className="block rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm font-medium text-navy-800 hover:border-orange-200"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
