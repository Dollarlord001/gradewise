import type { StudyPlanTask } from "@/types/practice";

/**
 * Simple adaptive plan: Learn → Practice → Review → Test
 * Weak topics get review + practice blocks when data exists.
 */
export function buildDailyPlan(input: {
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  weakTopics: { subject: string; topicName: string; topicId: string }[];
  exam?: string | null;
}): StudyPlanTask[] {
  const tasks: StudyPlanTask[] = [];
  const minutes = Math.max(15, input.studyMinutes || 45);
  const weak = input.weakTopics[0];

  if (weak) {
    tasks.push({
      id: `learn-${weak.topicId}`,
      title: `Learn: ${weak.topicName}`,
      kind: "learn",
      subject: weak.subject,
      topicName: weak.topicName,
      estimatedMinutes: Math.min(15, Math.floor(minutes * 0.3)),
      href: `/learn?topic=${encodeURIComponent(weak.topicId)}`,
      status: "planned",
      scheduledFor: input.date,
    });
    tasks.push({
      id: `practice-${weak.topicId}`,
      title: `Practice ${weak.topicName} (10 questions)`,
      kind: "practice",
      subject: weak.subject,
      topicName: weak.topicName,
      estimatedMinutes: Math.min(20, Math.floor(minutes * 0.4)),
      href: `/practice/setup?subject=${encodeURIComponent(weak.subject)}&topic=${encodeURIComponent(weak.topicId)}&count=10`,
      status: "planned",
      scheduledFor: input.date,
    });
    tasks.push({
      id: `review-${input.date}`,
      title: "Review questions needing attention",
      kind: "review",
      estimatedMinutes: Math.min(15, Math.floor(minutes * 0.3)),
      href: "/review",
      status: "planned",
      scheduledFor: input.date,
    });
  } else {
    tasks.push({
      id: `practice-general-${input.date}`,
      title: input.exam ? `${input.exam} practice set` : "General practice set",
      kind: "practice",
      estimatedMinutes: Math.min(25, minutes),
      href: "/practice/setup",
      status: "planned",
      scheduledFor: input.date,
    });
    tasks.push({
      id: `learn-general-${input.date}`,
      title: "Continue learning",
      kind: "learn",
      estimatedMinutes: Math.min(15, Math.floor(minutes * 0.3)),
      href: "/learn",
      status: "planned",
      scheduledFor: input.date,
    });
  }

  return tasks;
}
