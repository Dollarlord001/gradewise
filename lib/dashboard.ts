import type {
  DashboardSnapshot,
  NextBestAction,
  StudentProfile,
  StudentProgressRow,
  TopicMasteryRow,
  MistakeRow,
  StudyPlanItem,
} from "@/types/student";

/**
 * Derives Next Best Action from real student data only.
 * Never fabricates weak topics or scores when data is missing.
 */
export function deriveNextBestAction(input: {
  student: StudentProfile | null;
  mastery: TopicMasteryRow[];
  mistakes: MistakeRow[];
  planItems: StudyPlanItem[];
}): NextBestAction {
  const { student, mastery, mistakes, planItems } = input;

  if (!student?.onboardingCompletedAt) {
    return {
      kind: "onboarding",
      title: "Let's get to know your level",
      reason: "A short setup helps us recommend the right practice.",
      href: "/signup?onboarding=1",
      durationMinutes: 5,
    };
  }

  if (!student.exam || student.subjects.length === 0) {
    return {
      kind: "onboarding",
      title: "Finish setting up your exam",
      reason: "Choose your exam and subjects to unlock practice.",
      href: "/signup?onboarding=1",
    };
  }

  const weak = mastery
    .filter((m) => m.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery)[0];

  if (weak) {
    return {
      kind: "review_topic",
      title: `Review ${weak.topicName}`,
      reason: "You've struggled with this topic recently.",
      durationMinutes: 12,
      questionCount: 10,
      href: `/practice?topic=${encodeURIComponent(weak.topicId)}`,
    };
  }

  const toReview = mistakes.find((m) => m.reviewStatus === "to_review");
  if (toReview) {
    return {
      kind: "review_topic",
      title: "Questions to review",
      reason: "Revisit questions you missed to lock in learning.",
      questionCount: Math.min(10, mistakes.filter((m) => m.reviewStatus === "to_review").length),
      durationMinutes: 15,
      href: "/practice/review",
    };
  }

  const planned = planItems.find((p) => p.status === "planned");
  if (planned) {
    return {
      kind: "practice",
      title: planned.title,
      reason: "On today's study plan.",
      href: `/planner/${planned.id}`,
    };
  }

  return {
    kind: "practice",
    title: "Your next step",
    reason: "Complete a focused practice set for your exam subjects.",
    questionCount: 20,
    durationMinutes: 25,
    href: "/practice",
  };
}

export function computeAccuracy(progress: StudentProgressRow[]): number | null {
  const attempts = progress.reduce((s, p) => s + p.attempts, 0);
  const correct = progress.reduce((s, p) => s + p.correct, 0);
  if (attempts === 0) return null;
  return (correct / attempts) * 100;
}

/** Empty snapshot for signed-out or loading states — no fabricated stats */
export function emptyDashboardSnapshot(): DashboardSnapshot {
  return {
    student: null,
    progress: [],
    mastery: [],
    mistakesToReview: [],
    planItems: [],
    nextAction: deriveNextBestAction({
      student: null,
      mastery: [],
      mistakes: [],
      planItems: [],
    }),
    streakDays: null,
    recentActivity: [],
    accuracyPercent: null,
    questionsAttempted: 0,
    studyMinutes: null,
  };
}

export function buildDashboardSnapshot(data: {
  student: StudentProfile | null;
  progress: StudentProgressRow[];
  mastery: TopicMasteryRow[];
  mistakes: MistakeRow[];
  planItems: StudyPlanItem[];
  streakDays?: number | null;
  recentActivity?: DashboardSnapshot["recentActivity"];
  studyMinutes?: number | null;
}): DashboardSnapshot {
  const accuracyPercent = computeAccuracy(data.progress);
  const questionsAttempted = data.progress.reduce((s, p) => s + p.attempts, 0);
  return {
    student: data.student,
    progress: data.progress,
    mastery: data.mastery,
    mistakesToReview: data.mistakes.filter((m) => m.reviewStatus === "to_review"),
    planItems: data.planItems,
    nextAction: deriveNextBestAction({
      student: data.student,
      mastery: data.mastery,
      mistakes: data.mistakes,
      planItems: data.planItems,
    }),
    streakDays: data.streakDays ?? null,
    recentActivity: data.recentActivity ?? [],
    accuracyPercent,
    questionsAttempted,
    studyMinutes: data.studyMinutes ?? null,
  };
}
