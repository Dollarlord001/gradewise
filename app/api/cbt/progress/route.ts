import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to view synced CBT progress." }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const offset = Math.max(0, Math.min(100000, Number(params.get("mistakeOffset") ?? 0) || 0));
    const includeMistakes = params.get("includeMistakes") === "1";
    const [progress, mistakes, mistakeCount, topics] = await Promise.all([
      supabase.from("student_progress").select("exam,subject,attempts,correct,updated_at").eq("student_id", user.id).order("subject").limit(100),
      includeMistakes ? supabase.from("mistakes").select("question_id,selected_answer,correct_answer,times_missed,first_seen,last_seen,review_status,questions!inner(prompt,options,explanation,exam,subject,topic_id,topics(name))").eq("student_id", user.id).order("last_seen", { ascending: false }).range(offset, offset + 99) : Promise.resolve({ data: [], error: null }),
      supabase.from("mistakes").select("id", { count: "exact", head: true }).eq("student_id", user.id),
      supabase.from("topic_mastery").select("mastery,updated_at,topics!inner(exam,subject,name,is_official)").eq("student_id", user.id).eq("topics.is_official", true).order("mastery").limit(100),
    ]);
    if (progress.error || mistakes.error || mistakeCount.error || topics.error) throw progress.error ?? mistakes.error ?? mistakeCount.error ?? topics.error;
    const totalMistakes = mistakeCount.count ?? 0;
    return NextResponse.json({ progress: progress.data ?? [], mistakes: mistakes.data ?? [], mistakeCount: totalMistakes, mistakesHasMore: includeMistakes && offset + (mistakes.data?.length ?? 0) < totalMistakes, topics: topics.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "CBT progress is temporarily unavailable." }, { status: 503 });
  }
}
