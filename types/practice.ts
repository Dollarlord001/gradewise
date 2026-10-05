/** Practice + CBT domain types aligned with Supabase question_attempts / cbt_* tables. */

export type ExamId = "JAMB" | "WAEC" | "NECO" | "BECE";
export type PracticeMode = "untimed" | "timed";
export type CbtMode = "practice" | "full";
export type QuestionSourceKind = "authentic_sourced" | "tutor_me_original" | "unknown";

export interface PracticeSetup {
  exam: ExamId;
  subject: string;
  topicId?: string | null;
  topicName?: string | null;
  questionCount: number;
  difficulty?: number | null;
  questionType?: string | null;
  timed: boolean;
  durationSeconds?: number | null;
}

export interface QuestionOption {
  key: string;
  text: string;
  sortOrder: number;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  options: QuestionOption[];
  /** Never expose to client before submit in scored CBT full mode if policy requires */
  correctKey?: string | null;
  explanation?: string | null;
  exam: string;
  year?: number | null;
  subject: string;
  topicId?: string | null;
  topicName?: string | null;
  images?: { url: string; alt?: string }[];
  passage?: string | null;
  sourceKind: QuestionSourceKind;
  sourceName?: string | null;
  difficulty?: number | null;
  questionType?: string | null;
}

export interface PracticeAnswerState {
  questionId: string;
  selectedKey: string | null;
  bookmarked: boolean;
  markedForReview: boolean;
  answeredAt?: string | null;
}

export interface PracticeSessionClient {
  sessionId: string;
  setup: PracticeSetup;
  questions: PracticeQuestion[];
  answers: Record<string, PracticeAnswerState>;
  startedAt: string;
  endsAt?: string | null;
}

export interface PracticeResultBreakdown {
  questionId: string;
  selectedKey: string | null;
  correctKey: string | null;
  isCorrect: boolean;
  skipped: boolean;
  topicName?: string | null;
  subject: string;
}

export interface PracticeResult {
  sessionId: string;
  score: number;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracyPercent: number | null;
  durationSeconds: number | null;
  breakdown: PracticeResultBreakdown[];
  strongTopics: { name: string; accuracy: number }[];
  weakTopics: { name: string; accuracy: number }[];
  reviewQuestionIds: string[];
}

export interface CbtSessionForm {
  sessionId: string;
  mode: CbtMode;
  subjects: string[];
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
  formFingerprint: string;
  durationSeconds: number;
  startedAt: string;
  idempotencyKey: string;
}

export interface WeakAreaRow {
  subject: string;
  topicId: string;
  topicName: string;
  attempts: number;
  correct: number;
  accuracyPercent: number;
  recommendedAction: string;
  href: string;
}

export interface ReviewItem {
  id: string;
  questionId: string;
  subject?: string;
  topicName?: string;
  reason: "incorrect" | "bookmarked" | "marked_for_review" | "difficult";
  timesMissed?: number;
  lastSeen?: string;
}

export interface StudyPlanTask {
  id: string;
  title: string;
  kind: "learn" | "practice" | "review" | "test";
  subject?: string;
  topicName?: string;
  estimatedMinutes?: number;
  href: string;
  status: "planned" | "done" | "skipped";
  scheduledFor: string;
}

export interface Recommendation {
  id: string;
  kind: "next_action" | "topic" | "video" | "practice" | "review" | "plan_task";
  title: string;
  reason: string;
  href: string;
  meta?: string;
}

export interface ProgressSnapshot {
  questionsAttempted: number;
  accuracyPercent: number | null;
  studyMinutes: number | null;
  streakDays: number | null;
  subjectRows: { subject: string; attempts: number; correct: number; accuracy: number | null }[];
  topicRows: WeakAreaRow[];
  cbtAttempts: number;
  lessonsCompleted?: number;
  videosCompleted?: number;
}
