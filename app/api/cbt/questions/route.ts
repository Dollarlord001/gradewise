import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const subject = params.get("subject");
  const topicId = params.get("topicId");
  const requestedSeed = params.get("poolSeed");
  const count = Math.min(180, Math.max(1, Number(params.get("count") || 40)));
  if (!subject || subject.length > 80) return NextResponse.json({ error: "A valid subject is required." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to access the verified question bank." }, { status: 401 });
    const { data: contentVersion, error: versionError } = await supabase.from("offline_content_versions").select("version").eq("exam", "JAMB").single();
    if (versionError) throw versionError;
    if (params.get("topics") === "1") {
      const { data, error } = await supabase.from("topics").select("id,name,parent_id,syllabus_objective,sort_order").eq("exam", "JAMB").eq("subject", subject).eq("is_official", true).order("sort_order").order("name").limit(300);
      if (error) throw error;
      return NextResponse.json({ topics: (data ?? []).map((row) => ({ id: row.id, name: row.name, parentId: row.parent_id, objective: row.syllabus_objective })), contentVersion: contentVersion.version }, { headers: { "Cache-Control": "private, no-store" } });
    }
    if (topicId && !/^[0-9a-f-]{36}$/i.test(topicId)) return NextResponse.json({ error: "Invalid syllabus topic." }, { status: 400 });
    if (requestedSeed && !/^[0-9a-f-]{36}$/i.test(requestedSeed)) return NextResponse.json({ error: "Invalid question pool seed." }, { status: 400 });
    let allowedTopicIds: string[] | null = null;
    if (topicId) {
      const { data: syllabusTopics, error } = await supabase.from("topics").select("id,parent_id").eq("exam", "JAMB").eq("subject", subject).eq("is_official", true).like("official_reference_url", "https://ibass.jamb.gov.ng/%").limit(300);
      if (error) throw error;
      const rows = syllabusTopics ?? []; const selected = new Set([topicId]); let changed = true;
      while (changed) { changed = false; for (const row of rows) if (row.parent_id && selected.has(row.parent_id) && !selected.has(row.id)) { selected.add(row.id); changed = true; } }
      if (!rows.some((row) => row.id === topicId)) return NextResponse.json({ error: "This topic is not in the current JAMB IBASS syllabus for the selected subject." }, { status: 400 });
      allowedTopicIds = [...selected];
    }
    const startId = (requestedSeed ?? randomUUID()).toLowerCase();
    const selection = topicId ? "id,exam,year,subject,topic_id,prompt,options,correct_answer,explanation,images,passage,difficulty,source_name,source_url,topics!inner(name,is_official,official_reference_url)" : "id,exam,year,subject,topic_id,prompt,options,correct_answer,explanation,images,passage,difficulty,source_name,source_url,topics(name,is_official,official_reference_url)";
    const makePoolQuery = () => { let query = supabase.from("questions").select(selection).eq("exam", "JAMB").eq("subject", subject).eq("verification_status", "verified").in("rights_status", ["owned", "licensed", "public_domain", "permission_granted"]); if (allowedTopicIds) query = query.in("topic_id", allowedTopicIds).eq("topics.is_official", true).like("topics.official_reference_url", "https://ibass.jamb.gov.ng/%"); return query; };
    const first = await makePoolQuery().gte("id", startId).order("id").limit(count);
    if (first.error) throw first.error;
    let data = first.data ?? [];
    if (data.length < count) { const wrapped = await makePoolQuery().lt("id", startId).order("id").limit(count - data.length); if (wrapped.error) throw wrapped.error; data = [...data, ...(wrapped.data ?? [])]; }
    const questions = (data ?? []).map((row) => {
      const officialTopic = (row.topics as unknown as { name: string; is_official: boolean } | null)?.is_official === true;
      return {
      id: row.id, exam: row.exam, year: row.year, subject: row.subject, topic: officialTopic ? (row.topics as unknown as { name: string }).name : null, topicId: officialTopic ? row.topic_id : null, topicOfficial: officialTopic, difficulty: row.difficulty,
      prompt: row.prompt, options: row.options, correctAnswer: row.correct_answer, explanation: row.explanation, images: row.images, passage: row.passage,
    }; });
    return NextResponse.json({ questions, contentVersion: contentVersion.version, poolSeed: startId }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Question content is currently unavailable. Try again when connected." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to sync examination results." }, { status: 401 });
    const body = await request.json();
    if (!body?.attemptId || !Array.isArray(body?.responses) || !["full", "practice"].includes(body.mode) || body.responses.length < 1 || body.responses.length > 180 || new Set(body.responses.map((r: { questionId: string }) => r.questionId)).size !== body.responses.length) return NextResponse.json({ error: "Invalid examination payload." }, { status: 400 });
    const { data, error } = await supabase.rpc("sync_cbt_attempt", {
      p_session_id: body.attemptId, p_idempotency_key: body.idempotencyKey,
      p_started_at: body.startedAt, p_duration_seconds: body.durationSeconds, p_submitted_at: body.submittedAt,
      p_mode: body.mode, p_subjects: body.subjects, p_random_seed: body.randomSeed,
      p_question_order: body.questionOrder, p_option_order: body.optionOrder,
      p_form_fingerprint: body.formFingerprint, p_answers: body.answers, p_marks: body.marks, p_responses: body.responses,
    });
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Results are saved on this device and will sync when available." }, { status: 503 });
  }
}
