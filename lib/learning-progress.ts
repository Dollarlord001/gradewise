import type { LearningEventKind, LearningProgressEvent } from "@/types/learning";

/** Meaningful completion — page open alone is not mastery */
export function isMeaningfulCompletion(kind: LearningEventKind): boolean {
  return (
    kind === "lesson_completed" ||
    kind === "video_completed" ||
    kind === "flashcards_reviewed" ||
    kind === "practice_completed"
  );
}

export function buildProgressEvent(
  partial: Omit<LearningProgressEvent, "id" | "createdAt"> & { id?: string }
): LearningProgressEvent {
  return {
    id: partial.id ?? crypto.randomUUID(),
    studentId: partial.studentId,
    kind: partial.kind,
    subjectId: partial.subjectId,
    topicId: partial.topicId,
    lessonId: partial.lessonId,
    videoId: partial.videoId,
    resourceId: partial.resourceId,
    payload: partial.payload,
    createdAt: new Date().toISOString(),
  };
}

export function deriveTopicNextAction(input: {
  hasUnfinishedLesson: boolean;
  hasUnwatchedVideo: boolean;
  lessonHref?: string;
  videoHref?: string;
  practiceHref: string;
}): { label: string; href: string; reason: string } {
  if (input.hasUnfinishedLesson && input.lessonHref) {
    return {
      label: "Continue lesson",
      href: input.lessonHref,
      reason: "Pick up where you left off.",
    };
  }
  if (input.hasUnwatchedVideo && input.videoHref) {
    return {
      label: "Watch video",
      href: input.videoHref,
      reason: "A short video can clarify this topic.",
    };
  }
  return {
    label: "Practice this topic",
    href: input.practiceHref,
    reason: "You've seen the material — try a focused question set.",
  };
}
