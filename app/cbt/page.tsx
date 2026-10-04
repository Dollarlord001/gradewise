import type { Metadata } from "next";
import { CbtExperience } from "@/components/cbt-experience";
import { createClient } from "@/lib/supabase/server";
import { getAppIdentity } from "@/lib/firebase/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "CBT", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CbtPage({ searchParams }: { searchParams: Promise<{ practice?: string; subject?: string; topic?: string; count?: string }> }) {
  const identity = await getAppIdentity();
  if (!identity) redirect("/signin?next=%2Fcbt");
  const supabase = await createClient(identity.idToken);
  const { data: profile } = await supabase.from("student_profiles").select("onboarding_completed_at").eq("user_id", identity.studentId).maybeSingle();
  if (!profile?.onboarding_completed_at) redirect("/signup?onboarding=1");
  const params = await searchParams;
  const count = Number(params.count);
  const initialPractice = params.practice === "1" ? { subject: params.subject, topic: params.topic, count: Number.isInteger(count) && count >= 1 && count <= 40 ? count : 10 } : undefined;
  return <CbtExperience initialPractice={initialPractice} />;
}
