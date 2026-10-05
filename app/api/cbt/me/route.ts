import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppIdentity } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const identity = await getAppIdentity();
    if (!identity) return NextResponse.json({ error: "Sign in to use CBT." }, { status: 401 });
    const supabase = await createClient(identity.idToken);
    const [studentProfile, subjects] = await Promise.all([
      supabase.from("student_profiles").select("exam,target_score,study_minutes_per_day,preferences,onboarding_completed_at").eq("user_id", identity.studentId).maybeSingle(),
      supabase.from("student_subjects").select("subject").eq("student_id", identity.studentId).order("subject"),
    ]);
    if (studentProfile.error || subjects.error) throw studentProfile.error ?? subjects.error;
    return NextResponse.json({
      studentId: identity.studentId,
      profile: { displayName: identity.name ?? "Student" },
      studentProfile: studentProfile.data,
      subjects: (subjects.data ?? []).map((row) => row.subject),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Account identity is unavailable." }, { status: 503 });
  }
}
