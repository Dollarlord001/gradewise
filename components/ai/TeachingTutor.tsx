"use client";

import { useEffect, useState } from "react";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { EXAMS } from "@/lib/exams";

type Topic = { id: string; name: string; parentId: string | null; official: boolean | null };
const supportedExams = EXAMS.filter((exam) => ["jamb", "waec", "neco"].includes(exam.slug));
const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  jamb: ["Use of English", "Mathematics", "Biology", "Chemistry", "Physics", "Agricultural Science", "Economics", "Government", "Geography", "Literature in English", "Commerce", "CRK", "Accounting", "Further Mathematics", "Computer Science", "Civic Education", "Animal Husbandry", "IRK", "Arabic", "History", "Home Economics", "Insurance", "Fine Art", "Music", "Hausa", "Igbo", "Yoruba"],
  waec: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Agricultural Science", "Economics", "Government", "Geography", "Literature in English", "Commerce", "Accounting", "Further Mathematics", "Computer Science", "Civic Education", "Animal Husbandry", "CRK", "IRK", "Arabic", "History", "Home Economics", "Insurance", "Fine Art", "Music", "Hausa", "Igbo", "Yoruba"],
  neco: ["English Language", "Mathematics", "Biology", "Chemistry", "Physics", "Agricultural Science", "Economics", "Government", "Geography", "Literature in English", "Commerce", "Accounting", "Further Mathematics", "Computer Science", "Civic Education", "Animal Husbandry", "CRK", "IRK", "Arabic", "History", "Home Economics", "Insurance", "Fine Art", "Music", "Hausa", "Igbo", "Yoruba"],
};

export function TeachingTutor({ voice = false }: { voice?: boolean }) {
  const [examSlug, setExamSlug] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [topicResponse, setTopicResponse] = useState<{ key: string; topics: Topic[] } | null>(null);
  const [lesson, setLesson] = useState<{ exam: string; subject: string; topic: string } | null>(null);
  const selectedExam = supportedExams.find((item) => item.slug === examSlug);
  const selectedExamName = selectedExam?.name ?? "";
  const topicKey = `${selectedExamName}:${subject}`;
  const topics = topicResponse?.key === topicKey ? topicResponse.topics : [];
  const loadingTopics = Boolean(selectedExamName && subject && topicResponse?.key !== topicKey);
  const parentTopics = topics.filter((item) => !item.parentId);

  useEffect(() => {
    if (!selectedExamName || !subject) return;
    const controller = new AbortController();
    fetch(`/api/ai/topics?exam=${encodeURIComponent(selectedExamName)}&subject=${encodeURIComponent(subject)}`, { signal: controller.signal })
      .then((response) => response.json()).then((body: { topics?: Topic[] }) => setTopicResponse({ key: `${selectedExamName}:${subject}`, topics: body.topics ?? [] }))
      .catch(() => { if (!controller.signal.aborted) setTopicResponse({ key: `${selectedExamName}:${subject}`, topics: [] }); });
    return () => controller.abort();
  }, [selectedExamName, subject]);

  if (lesson) {
    const context = { ...lesson };
    return <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <button type="button" className="text-sm text-orange-700 underline" onClick={() => setLesson(null)}>Change lesson</button>
      <p className="text-sm text-navy-600">{context.exam} · {context.subject} · {context.topic}</p>
      <AiChatPanel key={`${voice ? "voice" : "class"}-${context.exam}-${context.subject}-${context.topic}`} title={voice ? "Voice Teaching Tutor" : "Live AI Class"} mode={voice ? "voice" : "class"} placeholder="Answer the tutor or ask a question…" exam={context.exam} subject={context.subject} topic={context.topic} initialPrompt={`Start a lesson on ${context.topic} in ${context.subject} for ${context.exam}. Introduce the topic briefly, explain the first small section with a relevant example, then ask one understanding question and wait for my answer.`} />
      <p className="text-xs text-navy-500">When you finish, ask for a short recap and a practice question on this topic.</p>
    </div>;
  }

  return <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
    <div><p className="text-xs font-semibold uppercase tracking-widest text-orange-700">{voice ? "VOICE TEACHING" : "GUIDED CLASS"}</p><h1 className="mt-2 text-3xl font-semibold text-navy-900">Learn one topic at a time.</h1><p className="mt-2 text-sm leading-6 text-navy-600">Choose your exam, subject and syllabus topic. Your tutor teaches in short sections, checks your understanding and adapts to your answers.</p></div>
    <div className="space-y-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
      <label className="block text-sm font-medium text-navy-800">1. Choose exam<select className="mt-1 block w-full rounded-xl border border-navy-200 p-3" value={examSlug} onChange={(event) => { setExamSlug(event.target.value); setSubject(""); setTopic(""); }}><option value="">Select JAMB, WAEC or NECO</option>{supportedExams.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label className="block text-sm font-medium text-navy-800">2. Choose subject<select className="mt-1 block w-full rounded-xl border border-navy-200 p-3" disabled={!selectedExam} value={subject} onChange={(event) => { setSubject(event.target.value); setTopic(""); }}><option value="">Select a subject</option>{(SUBJECTS_BY_EXAM[examSlug] ?? []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label className="block text-sm font-medium text-navy-800">3. Choose topic or subtopic{parentTopics.length > 0 ? <select className="mt-1 block w-full rounded-xl border border-navy-200 p-3" value={topic} onChange={(event) => setTopic(event.target.value)} disabled={loadingTopics}><option value="">{loadingTopics ? "Loading official topics…" : "Select a topic"}</option>{topics.map((item) => { const parent = topics.find((candidate) => candidate.id === item.parentId); return <option key={item.id} value={item.name}>{parent ? `${parent.name} › ${item.name}` : item.name}{item.official ? " · syllabus" : ""}</option>; })}</select> : <input className="mt-1 block w-full rounded-xl border border-navy-200 p-3" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder={loadingTopics ? "Loading topic catalogue…" : "Enter a syllabus topic or subtopic"} disabled={!subject} />}</label>
      <button type="button" disabled={!selectedExam || !subject || !topic.trim() || loadingTopics} className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={() => setLesson({ exam: selectedExamName, subject, topic: topic.trim() })}>Start lesson</button>
      {voice && <p className="text-xs leading-5 text-navy-500">Microphone and spoken playback use your browser’s speech features when available. Every lesson also works in the text transcript.</p>}
    </div>
  </main>;
}
