import { DashboardView } from "@/components/dashboard/DashboardView";
import { buildDashboardSnapshot, emptyDashboardSnapshot } from "@/lib/dashboard";
import { buildMetadata } from "@/lib/seo";
import { getAppIdentity } from "@/lib/firebase/session";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/types/student";
import { StudySeasonClock } from "@/components/timers/StudySeasonClock";

export const metadata = buildMetadata({
  title: "Dashboard",
  path: "/dashboard",
  noIndex: true,
});

async function loadDashboardData() {
  const identity = await getAppIdentity();
  if (!identity) return emptyDashboardSnapshot();

  const supabase = await createClient(identity.idToken);
  const today = new Date().toISOString().slice(0, 10);
  const [profile, studentProfile, subjects, progress, mastery, mistakes, plan, activity] = await Promise.all([
    supabase.from("profiles").select("id,display_name").eq("id", identity.studentId).maybeSingle(),
    supabase.from("student_profiles").select("exam,target_score,study_minutes_per_day,onboarding_completed_at,preferences").eq("user_id", identity.studentId).maybeSingle(),
    supabase.from("student_subjects").select("subject").eq("student_id", identity.studentId).order("subject"),
    supabase.from("student_progress").select("exam,subject,attempts,correct").eq("student_id", identity.studentId).order("subject").limit(100),
    supabase.from("topic_mastery").select("topic_id,mastery,topics!inner(name,subject,is_official)").eq("student_id", identity.studentId).eq("topics.is_official", true).order("mastery").limit(100),
    supabase.from("mistakes").select("id,question_id,review_status,updated_at,questions!inner(subject,topics(name))").eq("student_id", identity.studentId).eq("review_status", "to_review").order("updated_at", { ascending: false }).limit(100),
    supabase.from("study_plan_items").select("id,title,scheduled_for,subject,status").eq("student_id", identity.studentId).eq("scheduled_for", today).order("created_at").limit(20),
    supabase.from("question_attempts").select("id,created_at,questions!inner(subject)").eq("student_id", identity.studentId).order("created_at", { ascending: false }).limit(8),
  ]);
  const error = profile.error ?? studentProfile.error ?? subjects.error ?? progress.error ?? mastery.error ?? mistakes.error ?? plan.error ?? activity.error;
  if (error) throw new Error(`Dashboard data unavailable: ${error.message}`);

  const studentRow = studentProfile.data;
  const student: StudentProfile = {
    id: identity.studentId,
    displayName: profile.data?.display_name ?? identity.name ?? "Student",
    email: identity.email,
    exam: studentRow?.exam ?? null,
    targetScore: studentRow?.target_score ?? null,
    studyMinutesPerDay: studentRow?.study_minutes_per_day ?? null,
    subjects: (subjects.data ?? []).map((row) => row.subject),
    onboardingCompletedAt: studentRow?.onboarding_completed_at ?? null,
    preferences: studentRow?.preferences ?? {},
  };

  return buildDashboardSnapshot({
    student,
    progress: progress.data ?? [],
    mastery: (mastery.data ?? []).map((row) => {
      const topic = row.topics as unknown as { name: string; subject: string };
      return { topicId: row.topic_id, topicName: topic.name, subject: topic.subject, mastery: row.mastery };
    }),
    mistakes: (mistakes.data ?? []).map((row) => {
      const question = row.questions as unknown as { subject: string; topics: { name: string } | null };
      return { id: row.id, questionId: row.question_id, subject: question.subject, topicName: question.topics?.name, reviewStatus: row.review_status, timesMissed: 1, lastSeen: row.updated_at };
    }),
    planItems: (plan.data ?? []).map((row) => ({ id: row.id, title: row.title, scheduledFor: row.scheduled_for, subject: row.subject, status: row.status })),
    recentActivity: (activity.data ?? []).map((row) => {
      const question = row.questions as unknown as { subject: string };
      return { id: row.id, label: `Practised ${question.subject}`, at: row.created_at, href: "/progress/history" };
    }),
  });
}

export default async function DashboardPage() {
  const data = await loadDashboardData();
  return <main className="dashboard-page"><StudySeasonClock /><DashboardView data={data} /></main>;
}
