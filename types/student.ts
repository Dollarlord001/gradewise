/** Student domain types aligned with Supabase TUTOR-ME schema. */

export type ExamId = "JAMB" | "WAEC" | "NECO" | "BECE";

export interface StudentProfile {
  id: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  exam?: ExamId | null;
  targetScore?: number | null;
  studyMinutesPerDay?: number | null;
  examDate?: string | null;
  subjects: string[];
  onboardingCompletedAt?: string | null;
  preferences?: Record<string, unknown>;
}

export interface StudentProgressRow {
  exam: string;
  subject: string;
  attempts: number;
  correct: number;
}

export interface TopicMasteryRow {
  topicId: string;
  topicName: string;
  subject: string;
  mastery: number;
}

export interface MistakeRow {
  id: string;
  questionId: string;
  subject?: string;
  topicName?: string;
  reviewStatus: "to_review" | "reviewed" | "recovered";
  timesMissed: number;
  lastSeen?: string;
}

export interface StudyPlanItem {
  id: string;
  title: string;
  scheduledFor: string;
  subject?: string | null;
  status: "planned" | "done" | "skipped";
}

export interface NextBestAction {
  kind: "review_topic" | "continue_lesson" | "practice" | "diagnostic" | "onboarding";
  title: string;
  reason: string;
  durationMinutes?: number;
  questionCount?: number;
  href: string;
}

export interface DashboardSnapshot {
  student: StudentProfile | null;
  progress: StudentProgressRow[];
  mastery: TopicMasteryRow[];
  mistakesToReview: MistakeRow[];
  planItems: StudyPlanItem[];
  nextAction: NextBestAction | null;
  streakDays: number | null;
  recentActivity: { id: string; label: string; at: string; href?: string }[];
  accuracyPercent: number | null;
  questionsAttempted: number;
  studyMinutes: number | null;
}
