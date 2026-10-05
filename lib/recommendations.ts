import type { Recommendation, WeakAreaRow, ReviewItem, StudyPlanTask, ProgressSnapshot } from "@/types/practice";

/**
 * Central recommendation layer — only uses data that exists.
 * New students get onboarding/diagnostic prompts, never invented weak topics.
 */
export function buildRecommendations(ctx: {
  onboardingComplete: boolean;
  hasExam: boolean;
  progress: ProgressSnapshot | null;
  weakAreas: WeakAreaRow[];
  reviewItems: ReviewItem[];
  planTasks: StudyPlanTask[];
}): Recommendation[] {
  const out: Recommendation[] = [];

  if (!ctx.onboardingComplete) {
    out.push({
      id: "onboarding",
      kind: "next_action",
      title: "Let's get to know your level",
      reason: "A short setup unlocks personalized practice.",
      href: "/onboarding",
    });
    return out;
  }

  if (!ctx.hasExam) {
    out.push({
      id: "set-exam",
      kind: "next_action",
      title: "Choose your exam",
      reason: "Practice works best when we know JAMB, WAEC, NECO or BECE.",
      href: "/onboarding",
    });
    return out;
  }

  const weak = ctx.weakAreas[0];
  if (weak && weak.attempts >= 3) {
    out.push({
      id: `weak-${weak.topicId}`,
      kind: "topic",
      title: `Review ${weak.topicName}`,
      reason: `${weak.subject} · ${Math.round(weak.accuracyPercent)}% accuracy on recent attempts.`,
      href: weak.href,
      meta: "10 questions recommended",
    });
  }

  const reviewCount = ctx.reviewItems.length;
  if (reviewCount > 0) {
    out.push({
      id: "review-bank",
      kind: "review",
      title: "Questions to review",
      reason: `${reviewCount} item${reviewCount === 1 ? "" : "s"} waiting for another look.`,
      href: "/review",
    });
  }

  const nextPlan = ctx.planTasks.find((t) => t.status === "planned");
  if (nextPlan) {
    out.push({
      id: `plan-${nextPlan.id}`,
      kind: "plan_task",
      title: nextPlan.title,
      reason: "On today's study plan.",
      href: nextPlan.href,
      meta: nextPlan.estimatedMinutes ? `${nextPlan.estimatedMinutes} min` : undefined,
    });
  }

  if (out.length === 0) {
    out.push({
      id: "practice-default",
      kind: "practice",
      title: "Start a practice set",
      reason: "Build a clearer picture of your strengths with a short session.",
      href: "/practice/setup",
      meta: "20 questions",
    });
  }

  return out;
}

export function deriveWeakAreas(rows: {
  subject: string;
  topicId: string;
  topicName: string;
  attempts: number;
  correct: number;
}[]): WeakAreaRow[] {
  return rows
    .filter((r) => r.attempts >= 3)
    .map((r) => {
      const accuracyPercent = (r.correct / r.attempts) * 100;
      return {
        subject: r.subject,
        topicId: r.topicId,
        topicName: r.topicName,
        attempts: r.attempts,
        correct: r.correct,
        accuracyPercent,
        recommendedAction:
          accuracyPercent < 50
            ? "Review this topic and try 10 questions."
            : "Reinforce with a short practice set.",
        href: `/practice/setup?subject=${encodeURIComponent(r.subject)}&topic=${encodeURIComponent(r.topicId)}`,
      };
    })
    .filter((r) => r.accuracyPercent < 70)
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);
}
