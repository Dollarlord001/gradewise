import Link from "next/link";
import type { TopicLearningPageModel } from "@/types/learning";
import { VideoCard } from "@/components/video/VideoCard";
import type { VideoRecord } from "@/types/video";

export function TopicLearningView({ model }: { model: TopicLearningPageModel }) {
  const { topic, subject, lessons, notes, videos, flashcardDecks, resources, relatedPracticeHref, nextAction } =
    model;

  return (
    <article className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">
          {subject.name}
          {model.parentTopic ? ` · ${model.parentTopic.name}` : null}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-navy-900 sm:text-3xl">{topic.name}</h1>
        {topic.description ? <p className="mt-2 max-w-2xl text-navy-600">{topic.description}</p> : null}
        {topic.objectives && topic.objectives.length > 0 ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-navy-800">What you should know after this</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-navy-600">
              {topic.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      {nextAction ? (
        <section className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">What to do next</p>
          <p className="mt-1 text-lg font-semibold text-navy-900">{nextAction.label}</p>
          <p className="text-sm text-navy-600">{nextAction.reason}</p>
          <Link href={nextAction.href} className="mt-3 inline-flex rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Continue →
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="lessons-heading">
        <h2 id="lessons-heading" className="text-lg font-semibold text-navy-900">
          Lessons
        </h2>
        {lessons.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No lessons published for this topic yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/learn/${subject.slug}/${topic.slug}/lessons/${l.slug}`}
                  className="block rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm font-medium text-navy-800 hover:border-orange-200"
                >
                  {l.title}
                  {l.estimatedMinutes ? (
                    <span className="ml-2 text-xs font-normal text-navy-400">{l.estimatedMinutes} min</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="videos-heading">
        <div className="flex items-center justify-between">
          <h2 id="videos-heading" className="text-lg font-semibold text-navy-900">
            Videos
          </h2>
          <Link href={`/learn/videos?subject=${subject.slug}&topic=${topic.slug}`} className="text-sm text-orange-600 hover:underline">
            View all
          </Link>
        </div>
        {videos.length === 0 ? (
          <p className="mt-2 text-sm text-navy-500">No approved videos linked yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.slice(0, 6).map((v) => {
              const stub: VideoRecord = {
                id: v.id,
                title: v.title,
                subjectId: subject.id,
                topicId: topic.id,
                thumbnailUrl: v.thumbnailUrl,
                durationSeconds: v.durationSeconds,
                licenseStatus: "licensed",
                hostingMode: "youtube_embed",
                published: true,
                status: "published",
                createdAt: "",
                updatedAt: "",
              };
              return (
                <li key={v.id}>
                  <VideoCard video={stub} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Notes</h2>
          {notes.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">No notes yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link href={`/learn/notes/${n.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Flashcards</h2>
          {flashcardDecks.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">No decks yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {flashcardDecks.map((d) => (
                <li key={d.id}>
                  <Link href={`/learn/flashcards/${d.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                    {d.title} ({d.cardCount})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex flex-wrap gap-3 border-t border-navy-100 pt-6">
        <Link href={relatedPracticeHref} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
          Practice this topic
        </Link>
        <Link
          href={`/ask-tutor?subject=${encodeURIComponent(subject.slug)}&topic=${encodeURIComponent(topic.slug)}`}
          className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50"
        >
          Ask Tutor
        </Link>
        <Link
          href={`/ask-tutor?mode=explain&topic=${encodeURIComponent(topic.slug)}`}
          className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-800 hover:bg-navy-50"
        >
          Explain this
        </Link>
      </section>

      {resources.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-navy-900">Resources</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {resources.map((r) => (
              <li key={r.id}>
                <Link href={`/learn/resources/${r.id}`} className="text-orange-600 hover:underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
