import { notFound } from "next/navigation";
import { getSubjectBySlug } from "@/lib/subjects";
import { TopicLearningView } from "@/components/learn/TopicLearningView";
import type { TopicLearningPageModel } from "@/types/learning";
import { deriveTopicNextAction } from "@/lib/learning-progress";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject: subjectSlug, topic: topicSlug } = await params;
  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  // Host: load topic tree, lessons, videos, notes from DB.
  // Empty scaffold — no fabricated lessons/videos.
  const model: TopicLearningPageModel = {
    subject: { id: subject.slug, name: subject.name, slug: subject.slug, normalizedName: subject.name },
    topic: {
      id: topicSlug,
      subjectId: subject.slug,
      subjectSlug: subject.slug,
      name: topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: topicSlug,
      parentId: null,
      description: null,
      objectives: [],
    },
    children: [],
    lessons: [],
    notes: [],
    videos: [],
    flashcardDecks: [],
    resources: [],
    relatedPracticeHref: `/practice?subject=${subjectSlug}&topic=${topicSlug}`,
    nextAction: deriveTopicNextAction({
      hasUnfinishedLesson: false,
      hasUnwatchedVideo: false,
      practiceHref: `/practice?subject=${subjectSlug}&topic=${topicSlug}`,
    }),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <TopicLearningView model={model} />
    </div>
  );
}
