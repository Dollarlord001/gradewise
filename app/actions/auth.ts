"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAppIdentity } from "@/lib/firebase/session";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, requestIdentity } from "@/lib/security/rate-limit";

export type AuthState = { error?: string; message?: string } | undefined;

export async function saveStudentOnboardingAction(formData: FormData): Promise<AuthState> {
  const displayName = z.string().trim().min(2).max(80).safeParse(formData.get("displayName"));
  const exam = z.enum(["JAMB", "WAEC", "NECO", "BECE"]).safeParse(formData.get("exam"));
  const target = z.coerce.number().int().min(0).max(1000).safeParse(formData.get("target"));
  const minutes = z.coerce.number().int().min(0).max(1440).safeParse(formData.get("minutes"));
  const subjects = z.array(z.string().trim().min(1).max(80)).min(1).max(8).safeParse(formData.getAll("subject"));
  const classLevel = z.enum(["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3", "not_applicable"]).safeParse(formData.get("classLevel") ?? "not_applicable");
  const learningStyle = z.enum(["reading", "practice", "mixed"]).safeParse(formData.get("learningStyle") ?? "mixed");
  if (!displayName.success || !exam.success || !target.success || !minutes.success || !subjects.success || !classLevel.success || !learningStyle.success) return { error: "Check your name, exam, target and subject selections." };
  const identity = await getAppIdentity();
  if (!identity) return { error: "Your session has expired. Sign in to save your study plan." };
  const limit = await rateLimit(`onboarding:${identity.uid}:${requestIdentity(await headers())}`, 8, 60_000);
  if (!limit.success) return { error: "Too many attempts. Wait a little and try again." };
  try {
    const supabase = await createClient(identity.idToken);
    const { error } = await supabase.rpc("save_student_onboarding", {
      p_display_name: displayName.data, p_exam: exam.data, p_target_score: target.data,
      p_study_minutes: minutes.data, p_subjects: [...new Set(subjects.data)],
      p_preferences: { studyRhythmMinutes: minutes.data, classLevel: classLevel.data, learningStyle: learningStyle.data },
    });
    if (error) return { error: "We couldn't save your study plan. Apply the Firebase identity database migration and try again." };
  } catch { return { error: "We couldn't save your study plan. Please try again." }; }
  redirect("/dashboard");
}
